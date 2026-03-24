
import {addProjectMemberService} from "../services/addMembersServices.js"
/*
addworkspacecontroller.js
Adds an existing user to a workspace as a member.

Typical flow:
Workspace admin invites a user by email → backend verifies user →
creates a WorkspaceMember record.

*/

export const addWorkspaceMember = async (req, res) => {
    try {
        const userId = req.userId;

        const { email, role, workspaceId, message } = req.body;

        // Validation
        const errors = {};

        if (!email) errors.email = "Email is required";
        if (!workspaceId) errors.workspaceId = "Workspace ID is required";
        if (!role) errors.role = "Role is required";

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                success: false,
                errors
            });
        }

        const allowedRoles = ["ADMIN", "MEMBER"];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role"
            });
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
            return res.status(403).json({
                success: false,
                message: "Only admins can add members"
            });
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Prevent duplicate
        const existingMember = await prisma.workspaceMember.findFirst({
            where: {
                userId: user.id,
                workspaceId
            }
        });

        if (existingMember) {
            return res.status(400).json({
                success: false,
                message: "User is already a member"
            });
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
        console.error("Add member error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to add workspace member"
        });
    }
};



export const addProjectMember = async (req, res) => {
    try {
        const { userId } = await req.auth();
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
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
};
