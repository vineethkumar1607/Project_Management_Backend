import prisma from "../lib/prisma.js";
import { getWorkspaceWithMembers } from "./workspaceService.js";
import { hasPermission } from "../controllers/ProjectController.js";
import { ROLES } from "../controllers/ProjectController.js";
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
        throw createError("Workspace not found", 404);
    }

    // Only users with ADMIN role are allowed to create a project
    if (!hasPermission(workspace.members, userId, [ROLES.ADMIN])) {
        throw createError("Not authorized to create project", 403);
    }

    // Find the team lead using email and extract only the user ID
    const teamLeadUser = await prisma.user.findUnique({
        where: { email: team_lead },
        select: { id: true },
    });

    // If the provided team lead email does not exist, throw an error
    if (!teamLeadUser) {
        throw createError("Team lead not found", 404);
    }

    // Convert the incoming list of emails into a Set for efficient lookup
    const emailSet = new Set(team_members || []);

    // From workspace members, pick only those users whose emails were provided
    // This ensures only valid workspace members are added to the project
    const membersToAdd = workspace.members
        .filter((member) => emailSet.has(member.user.email))
        .map((member) => member.user.id);

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
            members: {
                create: membersToAdd.map((userId) => ({ userId })),
            },
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

    // If no project is found, either it doesn't exist or user has no access
    if (!project) {
        throw createError("Project not found or access denied", 404);
    }

    // Only the team lead is allowed to update the project
    if (project.team_lead !== userId) {
        throw createError("Only team lead can update this project", 403);
    }

    // Update only the fields that are provided in the payload
    // Undefined fields will not be modified in the database
    return await prisma.project.update({
        where: { id: projectId },
        data: {
            ...(name && { name }),
            ...(description && { description }),
            ...(status && { status }),
            ...(priority && { priority }),
            ...(progress !== undefined && { progress }),
            ...(start_date && { start_date: parseDate(start_date) }),
            ...(end_date && { end_date: parseDate(end_date) }),
        },
        include: {
            members: { include: { user: true } },
            owner: true,
        },
    });
};