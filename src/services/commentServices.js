import prisma from "../lib/prisma.js";
import { createError } from "../utils/error.js";

export const addTaskCommentService = async (userId, taskId, message) => {
    // Business validation
    if (!message || message.trim() === "") {
        throw createError(400, "Comment message cannot be empty");
    }

    // Validate task + project + membership
    const task = await prisma.task.findFirst({
        where: {
            id: taskId,
            project: {
                members: {
                    some: { userId },
                },
            },
        },
        select: {
            id: true,
        },
    });

    if (!task) {
        throw createError(
            404,
            "Task not found or you are not authorized to comment"
        );
    }

    // Create comment
    const comment = await prisma.comment.create({
        data: {
            content: message.trim(),
            taskId: task.id,
            userId,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
        },
    });

    return comment;
};

export const getTaskCommentsService = async ({
    userId,
    taskId,
    cursor,
    limit,
}) => {
    // Defensive limit (protect backend)
    const safeLimit = Math.min(limit, 50);

    // Validate access
    const task = await prisma.task.findFirst({
        where: {
            id: taskId,
            project: {
                members: {
                    some: { userId },
                },
            },
        },
        select: { id: true },
    });

    if (!task) {
        throw createError(404, "Task not found or unauthorized");
    }

    // Pagination query
    const comments = await prisma.comment.findMany({
        where: {
            taskId,
        },
        orderBy: [
            { createdAt: "desc" },
            { id: "desc" }, // stable ordering
        ],
        take: safeLimit + 1,
        ...(cursor && {
            cursor: { id: cursor },
            skip: 1,
        }),
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
        },
    });

    // Determine next cursor
    let nextCursor = null;

    if (comments.length > safeLimit) {
        const nextItem = comments.pop();
        nextCursor = nextItem.id;
    }

    return {
        items: comments,
        nextCursor,
    };
};