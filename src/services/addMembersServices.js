import prisma from "../config/prisma.js";
import { createError } from "../utils/error.js";


export const addProjectMemberService = async (userId, projectId, email) => {

    // Fetch project + access check
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
        throw createError("Project not found or access denied", 404);
    }

    // Only team lead can add members
    if (project.team_lead !== userId) {
        throw createError("Only team lead can add members", 403);
    }

    // Convert email → userId
    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true }
    });

    if (!user) {
        throw createError("User not found", 404);
    }

    const memberId = user.id;

    // Check workspace membership
    const workspaceMember = await prisma.workspaceMember.findFirst({
        where: {
            workspaceId: project.workspaceId,
            userId: memberId
        }
    });

    if (!workspaceMember) {
        throw createError("User is not part of the workspace", 400);
    }

    // Check already exists
    const existingMember = await prisma.projectMember.findUnique({
        where: {
            userId_projectId: {
                userId: memberId,
                projectId
            }
        }
    });

    if (existingMember) {
        throw createError("User already in project", 400);
    }

    // Add member
    await prisma.projectMember.create({
        data: {
            userId: memberId,
            projectId
        }
    });

    return {
        message: "Member added successfully",
        userId: memberId
    };
};