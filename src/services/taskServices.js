import prisma from "../config/prisma.js";
import { createError } from "../utils/error.js";
import { parseDate } from "../utils/date.js";
import { inngest } from "../inngest/client.js";

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

    // console.log("payload", payload);

    // Validate required fields
    if (!projectId) {
        throw createError(400, "Project ID is required");
    }

    if (!title) {
        throw createError(400, "Title is required");
    }

    if (!assigneeId) {
        throw createError(400, "Assignee is not part of this project");
    }

    // Parse due date
    const parsedDate = parseDate(due_date);
    if (!parsedDate) {
        throw createError(400, "Valid due date is required");
    }

    // Check project
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            members: true,
        },
    });

    if (!project) {
        throw createError(404, "Project not found");
    }

    // console.log("PROJECT MEMBERS:", project.members);
    // console.log("ASSIGNEE ID:", assigneeId);

    // Check team lead
    if (project.team_lead !== userId) {
        throw createError(403, "Only Team Lead can create tasks");
    }

    // Check assignee
    const isMember = project.members.some(
        (member) => member.userId === assigneeId
    );

    if (!isMember) {
        throw createError(400, "Assignee is not part of this project");
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

    /*
   Trigger event after successful task creation

   - Service = business logic layer
   - Ensures event only fires when DB write succeeds
 */
    await inngest.send({
        name: "task/created",
        data: {
            taskId: task.id,
            origin: payload.origin, // pass from controller
        },
    });
    return task;
};

// Update Task Service - for updating a single task by ID, ensuring only team lead can update and that due date is valid if provided

export const updateTaskService = async (userId, taskId, payload) => {
    const {
        title,
        description,
        type,
        status,
        priority,
        due_date,
        assigneeId,
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
        throw createError(404, "Task not found");
    }

    // Check if user is team lead
    const isTeamLead = task.project.team_lead === userId;
    const isAssignee = task.assigneeId === userId;

    if (!isTeamLead && !isAssignee) {
        throw createError(403, "Unauthorized to update this task");
    }

    //  Parse due date if provided
    let parsedDate;
    if (due_date) {
        parsedDate = parseDate(due_date);
        if (!parsedDate) {
            throw createError(400, "Invalid due date");
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


// Delete Task Service - for deleting one or more tasks by their IDs, ensuring they belong to the same project and that the user is authorized to delete them

export const deleteTasksService = async (userId, taskIds) => {
    // Validate input
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
        throw createError(400, "taskIds must be a non-empty array");
    }

    // Fetch all tasks
    const tasks = await prisma.task.findMany({
        where: {
            id: { in: taskIds },
        },
    });

    // Ensure all tasks exist
    if (tasks.length !== taskIds.length) {
        throw createError(404, "Some tasks not found");
    }

    // Ensure all tasks belong to same project
    const projectId = tasks[0].projectId;

    const isSameProject = tasks.every(
        (task) => task.projectId === projectId
    );

    if (!isSameProject) {
        throw createError(400, "All tasks must belong to same project");
    }

    //  Fetch project (only needed fields)
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { team_lead: true },
    });

    if (!project) {
        throw createError(404, "Project not found");
    }

    // Authorization check
    if (project.team_lead !== userId) {
        throw createError(403, "Only Team Lead can delete tasks");
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

// Get Task by ID Service - for fetching a single task's details, ensuring user has access to the project it belongs to 
export const getTaskByIdService = async (taskId, userId) => {
    const task = await prisma.task.findFirst({
        where: {
            id: taskId,
            project: {
                members: {
                    some: { userId },
                },
            },
        },
        include: {
            assignee: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
            project: {
                select: {
                    id: true,
                    name: true,
                    status: true,
                    priority: true,
                    workspaceId: true,
                },
            },
        },
    }); 

    if (!task) {
        throw createError(404, "Task not found or unauthorized");
    }

    return task;
};
