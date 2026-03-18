import prisma from "../config/prisma.js"
/*

workspacecontroller.js

Fetch all workspaces that the logged-in user belongs to.

This is used to populate the workspace switcher
in the sidebar or dropdown in the frontend.
*/
export const getUserWorkspaces = async (req, res) => {
    try {

        // Clerk authentication middleware provides the authenticated user
        const { userId } = await req.auth();

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        /*
        Query the WorkspaceMember table to find all workspace
        memberships for the current user.
    
        included the related workspace metadata
        so the frontend can display workspace information.
        */
        const workspaces = await prisma.workspaceMember.findMany({
            where: { userId },
            include: {
                workspace: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        imageUrl: true
                    }
                }
            }
        });

        // Transform data for frontend
        const formattedWorkspaces = workspaces.map(w => ({
            id: w.workspace.id,
            name: w.workspace.name,
            slug: w.workspace.slug,
            image_url: w.workspace.imageUrl,
        }));

        // Return the list of workspaces to the client
        res.status(200).json({
            success: true,
            data: formattedWorkspaces
        });

    } catch (error) {
        console.error("GET WORKSPACES ERROR:", error);
        // Handle unexpected server errors
        res.status(500).json({
            success: false,
            message: "Failed to fetch workspaces"
        })

    }
}


/*
Fetch all members belonging to a specific workspace.

Used in features like:
- Workspace member list

*/
export const getWorkspaceMembers = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const userId = req.userId;

        // Check membership
        const member = await prisma.workspaceMember.findFirst({
            where: {
                workspaceId,
                userId
            }
        });

        if (!member) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        // Fetch members
        const members = await prisma.workspaceMember.findMany({
            where: { workspaceId },
            include: {
                user: true
            }
        });

        res.status(200).json({
            success: true,
            data: members
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch workspace members"
        });
    }
};