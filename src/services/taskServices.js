import prisma from "../config/prisma.js";
import { createError } from "../utils/error.js";
import { parseDate } from "../utils/date.js";

export const createTaskService = async (userId, payload) => {
    const {
        projectId,
        title,
        description,
        type,
        status,
        priority,
        assigneeId,
        due_date,
    } = payload;

    // Validate required fields
    if (!projectId) {
        throw createError("Project ID is required", 400);
    }

    if (!title) {
        throw createError("Title is required", 400);
    }

    if (!assigneeId) {
        throw createError("Assignee is required", 400);
    }

    // Parse due date
    const parsedDate = parseDate(due_date);
    if (!parsedDate) {
        throw createError("Valid due date is required", 400);
    }

    // Check project
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            members: true,
        },
    });

    if (!project) {
        throw createError("Project not found", 404);
    }

    // Check team lead
    if (project.team_lead !== userId) {
        throw createError("Only Team Lead can create tasks", 403);
    }

    // Check assignee
    const isMember = project.members.some(
        (member) => member.userId === assigneeId
    );

    if (!isMember) {
        throw createError("Assignee is not part of this project", 400);
    }

    // Create task
    const task = await prisma.task.create({
        data: {
            title,
            description,
            type,
            status,
            priority,
            projectId,
            assigneeId,
            due_date: parsedDate,
        },
        include: {
            assignee: true,
        },
    });

    return task;
};

// Update Task Service

export const updateTaskService = async (userId, taskId, payload) => {
    const {
        title,
        description,
        type,
        status,
        priority,
        due_date,
    } = payload;

    //Check if task exists
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
            project: {
                include: {
                    members: true,
                },
            },
        },
    });

    if (!task) {
        throw createError("Task not found", 404);
    }

    // Check if user is team lead
    if (task.project.team_lead !== userId) {
        throw createError("Only Team Lead can update tasks", 403);
    }

    //  Parse due date if provided
    let parsedDate;
    if (due_date) {
        parsedDate = parseDate(due_date);
        if (!parsedDate) {
            throw createError("Invalid due date", 400);
        }
    }

    //  Update task (only send fields if provided)
    const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
            ...(title && { title }),
            ...(description && { description }),
            ...(type && { type }),
            ...(status && { status }),
            ...(priority && { priority }),
            ...(assigneeId && { assigneeId }),
            ...(parsedDate && { due_date: parsedDate }),
        },
        include: {
            assignee: true,
        },
    });

    return updatedTask;
};


// Delete Task Service

export const deleteTasksService = async (userId, taskIds) => {
    // Validate input
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
        throw createError("taskIds must be a non-empty array", 400);
    }

    // Fetch all tasks
    const tasks = await prisma.task.findMany({
        where: {
            id: { in: taskIds },
        },
    });

    // Ensure all tasks exist
    if (tasks.length !== taskIds.length) {
        throw createError("Some tasks not found", 404);
    }

    // Ensure all tasks belong to same project
    const projectId = tasks[0].projectId;

    const isSameProject = tasks.every(
        (task) => task.projectId === projectId
    );

    if (!isSameProject) {
        throw createError("All tasks must belong to same project", 400);
    }

    // 5️⃣ Fetch project (only needed fields)
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { team_lead: true },
    });

    if (!project) {
        throw createError("Project not found", 404);
    }

    // Authorization check
    if (project.team_lead !== userId) {
        throw createError("Only Team Lead can delete tasks", 403);
    }

    // Delete all tasks
    const result = await prisma.task.deleteMany({
        where: {
            id: { in: taskIds },
        },
    });

    return {
        message: `${result.count} tasks deleted successfully`,
    };
};