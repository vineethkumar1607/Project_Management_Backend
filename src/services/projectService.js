import prisma from "../config/prisma.js";
import { getWorkspaceWithMembers } from "./workspaceService.js";
import { requireWorkspaceAdmin, requireProjectAdminOrTeamLead, } from "./authorizationService.js";
import { createError } from "../utils/error.js";
import { parseDate } from "../utils/date.js";

export const createProjectService = async (userId, payload) => {
    const {
        workspaceId,
        description,
        name,
        status,
        start_date,
        end_date,
        team_members,
        team_lead,
        progress,
        priority,
    } = payload;

    // Fetch the workspace along with its members
    // This is required to validate access and filter valid users
    const workspace = await getWorkspaceWithMembers(workspaceId);

    // Ensure the workspace exists
    if (!workspace) {
        throw createError(404, "Workspace not found");
    }

    // Only users with ADMIN role are allowed to create a project
    await requireWorkspaceAdmin(
        workspaceId,
        userId
    );

    // Find the team lead using email and extract only the user ID
    const teamLeadUser = await prisma.user.findUnique({
        where: { email: team_lead },
        select: { id: true },
    });

    // If the provided team lead email does not exist, throw an error
    if (!teamLeadUser) {
        throw createError(404, "Team lead not found");
    }

    // Convert the incoming list of emails into a Set for efficient lookup
    const emailSet = new Set(team_members || []);

    // From workspace members, pick only those users whose emails were provided
    // This ensures only valid workspace members are added to the project
    const membersToAdd = [
        ...new Set(
            workspace.members.filter((member) => member.user && (emailSet.has(member.user.email) ||
                member.user.id === teamLeadUser.id )).map((member) => member.user.id)
        ), ];


    // Create the project along with associated members
    return await prisma.project.create({
        data: {
            name,
            description,
            status,
            start_date: parseDate(start_date),
            end_date: parseDate(end_date),
            progress,
            priority,
            workspaceId,
            team_lead: teamLeadUser.id,
            members: {create: membersToAdd.map((userId) => ({ userId })),},
        },
        include: {
            members: { include: { user: true } },
            owner: true,
        },
    });
};



export const updateProjectService = async (userId, projectId, payload) => {
    const {
        name,
        description,
        status,
        start_date,
        end_date,
        progress,
        priority,
    } = payload;

    // Fetch the project only if the user is part of the workspace
    // This prevents access to projects outside the user's workspace
    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            workspace: {
                members: {
                    some: { userId }
                }
            }
        }
    });


    if (!project) {
        throw createError(404, "Project not found or access denied");
    }

    await requireProjectAdminOrTeamLead(
        project,
        userId
    );

    // ENUM VALIDATION
    const validStatus = ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"];
    const validPriority = ["LOW", "MEDIUM", "HIGH"];

    if (status && !validStatus.includes(status)) {
        throw createError(400, "Invalid status value");
    }

    if (priority && !validPriority.includes(priority)) {
        throw createError(400, "Invalid priority value");
    }

    // Update only the fields that are provided in the payload
    // Undefined fields will not be modified in the database
    return await prisma.project.update({
        where: { id: projectId },
        data: {
            ...(name !== undefined && { name }),
            ...(description !== undefined && { description }),
            ...(status !== undefined && { status }),
            ...(priority !== undefined && { priority }),
            ...(progress !== undefined && { progress }),
            ...(start_date !== undefined && { start_date: parseDate(start_date) }),
            ...(end_date !== undefined && { end_date: parseDate(end_date) }),
        },
        include: {
            members: { include: { user: true } },
            owner: true,
        },
    });
};



// Service function to delete a project with proper access control  and error handling. Only workspace admins or project team leads can delete a project. 
export const deleteProjectService = async (userId, projectId) => {

    // find project
    const project = await prisma.project.findUnique({
        where: {
            id: projectId,
        },
    });

    // project not found
    if (!project) {
        throw createError(404, "Project not found");
    }

    await requireProjectAdminOrTeamLead(
        project,
        userId
    );

    // delete project
    await prisma.project.delete({
        where: {
            id: projectId,
        },
    });

    return {
        message: "Project deleted successfully",
    };
};
