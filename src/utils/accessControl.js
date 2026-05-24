
export const validateWorkspaceAccess = (workspace, userId, allowedRoles, hasPermission) => {
    const isAllowed = hasPermission(workspace.members, userId, allowedRoles);

    if (!isAllowed) {
        throw createError(403, "Not authorized");
    }
};
