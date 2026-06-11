import {
    getUserWorkspacesService,
    getWorkspaceMembersService,
} from "../services/workspaceService.js";


/*
Fetch all workspaces that the logged-in user belongs to.
*/
export const getUserWorkspaces = async (req, res, next) => {

    try {

        const workspaces = await getUserWorkspacesService(
            req.userId
        );

        return res.status(200).json({
            success: true,
            data: workspaces,
        });

    } catch (error) {
        next(error);
    }
};


/*
Fetch all members belonging to a specific workspace.
*/
export const getWorkspaceMembers = async (req, res, next) => {

    try {

        const members =
            await getWorkspaceMembersService(
                req.params.workspaceId,
                req.userId
            );

        return res.status(200).json({
            success: true,
            data: members,
        });

    } catch (error) {
        next(error);
    }
};