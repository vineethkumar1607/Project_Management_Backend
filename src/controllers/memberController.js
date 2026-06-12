
import { addProjectMemberService, removeProjectMemberService, getProjectMembersService } from "../services/membersServices.js"
import prisma from "../config/prisma.js";
import { createError } from "../utils/error.js";
import { requireWorkspaceAdmin, } from "../services/authorizationService.js";
/*

Adds an existing user to a workspace as a member.

Typical flow:
Workspace admin invites a user by email → backend verifies user → creates a WorkspaceMember record.
 
*/

export const addWorkspaceMember = async (req, res, next) => {
    try {
        const userId = req.userId;

        const { email, role, workspaceId, message } = req.body;

        // Validation
        if (!email || !workspaceId || !role) {
            return next(createError(400, "Email, workspace ID, and role are required"));
        }

        const allowedRoles = ["ADMIN", "MEMBER"];
        if (!allowedRoles.includes(role)) {
            return next(createError(400, "Invalid role"));
        }

        const normalizedEmail = email.toLowerCase();

        await requireWorkspaceAdmin(
            workspaceId,
            userId
        );

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        });

        if (!user) {
            return next(createError(404, "User not found"));
        }

        // Prevent duplicate
        const existingMember = await prisma.workspaceMember.findFirst({
            where: {
                userId: user.id,
                workspaceId
            }
        });

        if (existingMember) {
            return next(createError(400, "User is already a member"));
        }

        // Create member
        const newMember = await prisma.workspaceMember.create({
            data: {
                userId: user.id,
                workspaceId,
                role,
                message: message || ""
            }
        });

        return res.status(201).json({
            success: true,
            message: "Member added successfully",
            data: newMember
        });

    } catch (error) {
        return next(error);
    }
};


// Controller to add a member to a project. Only team leads can perform this action.
export const addProjectMember = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { projectId } = req.params;
        const { email } = req.body;

        const result = await addProjectMemberService(
            userId,
            projectId,
            email
        );

        return res.status(200).json({
            success: true,
            message: "Member added successfully",
            data: result
        });

    } catch (error) {
        return next(error);
    }
};



// Controller to remove a member from a project. Only team leads can perform this action.
export const removeProjectMember = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { projectId, memberId } = req.params;

        const result = await removeProjectMemberService(
            userId,
            projectId,
            memberId
        );

        return res.status(200).json({
            success: true,
            message: result.message,
            data: result,
        });
    } catch (error) {
        return next(error);
    }
};


// Controller to get project members with user details
export const getProjectMembers = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { projectId } = req.params;

        const members = await getProjectMembersService(userId, projectId);

        return res.status(200).json({
            success: true,
            data: members
        });

    } catch (error) {
        next(error);
    }
};