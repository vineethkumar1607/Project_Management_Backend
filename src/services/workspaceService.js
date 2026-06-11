import prisma from "../config/prisma.js";
import { createError } from "../utils/error.js";


/*
Fetch all workspaces that the user belongs to.
*/
export const getUserWorkspacesService = async (userId) => {

    const workspaces = await prisma.workspaceMember.findMany({
        where: { userId },

        include: {
            workspace: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    imageUrl: true,
                },
            },
        },
    });

    return workspaces.map((workspaceMember) => ({
        id: workspaceMember.workspace.id,
        name: workspaceMember.workspace.name,
        slug: workspaceMember.workspace.slug,
        image_url: workspaceMember.workspace.imageUrl,
    }));
};


/*
Fetch all members belonging to a specific workspace.
*/
export const getWorkspaceMembersService = async (
    workspaceId,
    userId
) => {

    const member = await prisma.workspaceMember.findFirst({
        where: {
            workspaceId,
            userId,
        },
    });

    if (!member) {
        throw createError(403, "Access denied");
    }

    const members = await prisma.workspaceMember.findMany({
        where: {
            workspaceId,
        },

        include: {
            user: true,
        },
    });

    return members.map((member) => ({
        id: member.user.id,
        email: member.user.email,
        name: member.user.name,
        role: member.role,
    }));
};


/*
Fetch workspace with members.
Used by member-related features.
*/
export const getWorkspaceWithMembers = async (workspaceId) => {

    const workspace = await prisma.workspace.findUnique({
        where: {
            id: workspaceId,
        },

        include: {
            members: {
                include: {
                    user: true,
                },
            },
        },
    });

    if (!workspace) {
        throw createError(404, "Workspace not found");
    }

    return workspace;
};