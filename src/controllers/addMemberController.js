
import {addProjectMemberService} from "../services/addMembersServices.js"
import prisma from "../config/prisma.js";
import { createError } from "../utils/error.js";
/*
addworkspacecontroller.js
Adds an existing user to a workspace as a member.

Typical flow:
Workspace admin invites a user by email → backend verifies user →
creates a WorkspaceMember record.

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

        // Check admin
        const adminCheck = await prisma.workspaceMember.findFirst({
            where: {
                userId,
                workspaceId
            }
        });

        if (!adminCheck || adminCheck.role !== "ADMIN") {
            return next(createError(403, "Only admins can add members"));
        }

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
