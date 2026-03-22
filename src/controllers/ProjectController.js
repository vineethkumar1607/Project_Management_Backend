import { PrismaClient } from "@prisma/client";
import { createProjectService, updateProjectService } from "../services/projectService.js";

const prisma = new PrismaClient();

/*

projectcontroller.js

Fetch all projects that belong to a workspace.

When the user switches workspace,
the frontend will load projects for that workspace.
*/
export const hasPermission = (members, userId, allowedRoles = []) => {
    return members.some(
        (member) =>
            member.userId === userId && allowedRoles.includes(member.role)
    );
};

export const ROLES = {
    ADMIN: "ADMIN",
    MEMBER: "MEMBER",
};


export const createProject = async (req, res) => {
    try {
        const { userId } = await req.auth();

        const project = await createProjectService(userId, req.body);

        const formattedProject = {
            id: project.id,
            name: project.name,
            status: project.status,
            progress: project.progress,
            priority: project.priority,
            start_date: project.start_date,
            end_date: project.end_date,
            team_lead: project.team_lead,
            members: project.members.map(m => ({
                id: m.user.id,
                email: m.user.email,
            }))
        };

        return res.status(201).json({
            success: true,
            message: "Project created successfully",
            data: formattedProject,
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Internal Server Error",
        });
    }
};


export const updateProject = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { projectId } = req.params;

        const project = await updateProjectService(
            userId,
            projectId,
            req.body
        );

        return res.status(200).json({
            success: true,
            message: "Project updated successfully",
            data: project,
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Internal Server Error",
        });
    }
};

export const getWorkspaceProjects = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const userId = req.userId;

        // Check if user belongs to workspace
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

        const projects = await prisma.project.findMany({
            where: { workspaceId }
        });

        res.status(200).json({
            success: true,
            data: projects
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch projects"
        });
    }
};


/*
Fetch tasks belonging to a specific project.

Includes:
- task assignee
- task comments

This is used when viewing a project board.
*/
export const getProjectTasks = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.userId;

        // get project
        const project = await prisma.project.findUnique({
            where: { id: projectId }
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        // check workspace access
        const member = await prisma.workspaceMember.findFirst({
            where: {
                workspaceId: project.workspaceId,
                userId
            }
        });

        if (!member) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        // fetch tasks
        const tasks = await prisma.task.findMany({
            where: { projectId },
            include: {
                assignee: true,
                comments: true
            }
        });

        res.status(200).json({
            success: true,
            data: tasks
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch tasks"
        });
    }
};


/*
Fetch all comments for a specific task.

Each comment includes the user who wrote it.
*/
export const getTaskComments = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.userId;

        // Get task
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                project: true
            }
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        // Check if user belongs to workspace
        const member = await prisma.workspaceMember.findFirst({
            where: {
                workspaceId: task.project.workspaceId,
                userId
            }
        });

        if (!member) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        //  Fetch comments
        const comments = await prisma.comment.findMany({
            where: { taskId },
            include: {
                user: true
            }
        });

        res.status(200).json({
            success: true,
            data: comments
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch comments"
        });
    }
};