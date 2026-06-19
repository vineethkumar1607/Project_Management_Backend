import prisma from "../config/prisma.js";
import { createError } from "../utils/error.js";

// Ensures the user is a member of the workspace.
export const requireWorkspaceMember = async (workspaceId, userId) => {

    const member = await prisma.workspaceMember.findFirst({
        where: { workspaceId, userId },
    });

    if (!member) { throw createError(403, "Access denied"); }

    return member;
};


// Ensures the user is a workspace admin.
export const requireWorkspaceAdmin = async (
    workspaceId,
    userId,
    action = "perform this action"
) => {

    const member = await requireWorkspaceMember(
        workspaceId,
        userId
    );

    if (member.role !== "ADMIN") {
        throw createError(403, `Only workspace admins can ${action}`);
    }

    return member;
};


// Ensures the user is a workspace admin or project team lead.
export const requireProjectTeamLead = async (project, userId) => {

    if (project.team_lead !== userId) {
        throw createError(403, "Only Team Lead can perform this action");
    }

    return true;
};


/*
Ensures the user is either:
- Workspace admin
- Project team lead
*/
export const requireProjectAdminOrTeamLead =
    async (project, userId) => {

        const workspaceMember = await requireWorkspaceMember(project.workspaceId, userId);

        const isAdmin = workspaceMember.role === "ADMIN";

        const isTeamLead = project.team_lead === userId;

        if (!isAdmin && !isTeamLead) {
            throw createError(403, "Only admin or team lead can perform this action");
        }

        return true;
    };