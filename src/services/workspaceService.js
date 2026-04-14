import prisma from "../config/prisma.js";

export const getWorkspaceWithMembers = async (workspaceId) => {
    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: {
            members: {
                include: {
                    user: true,
                },
            },
        }
    });

    if (!workspace) {
        const error = new Error("Workspace not found");
        error.statusCode = 404;
        throw error;
    }

    return workspace;
};