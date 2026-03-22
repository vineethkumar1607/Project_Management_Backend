
export const validateWorkspaceAccess = (workspace, userId, allowedRoles, hasPermission) => {
    const isAllowed = hasPermission(workspace.members, userId, allowedRoles);

    if (!isAllowed) {
        throw createError("Not authorized", 403);
    }
};