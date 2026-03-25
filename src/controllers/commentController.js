import {
    addTaskCommentService,
    getTaskCommentsService,
} from "../services/commentServices.js";

import { createError } from "../utils/error.js";

export const addTaskCommentController = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { taskId, message } = req.body;

        // Basic input validation
        if (!taskId || !message) {
            return next(createError(400, "taskId and message are required"));
        }

        const comment = await addTaskCommentService(userId, taskId, message);

        return res.status(201).json({
            success: true,
            message: "Comment added successfully",
            data: comment,
        });
    } catch (error) {
        return next(error);
    }
};

export const getTaskCommentsController = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { taskId } = req.params;
        const { cursor, limit = 10 } = req.query;

        // Validate taskId
        if (!taskId) {
            return next(createError(400, "taskId is required"));
        }

        const parsedLimit = Number(limit);

        // Validate limit
        if (isNaN(parsedLimit) || parsedLimit <= 0) {
            return next(createError(400, "limit must be a positive number"));
        }

        const comments = await getTaskCommentsService({
            userId,
            taskId,
            cursor,
            limit: parsedLimit,
        });

        return res.status(200).json({
            success: true,
            data: comments,
        });
    } catch (error) {
        return next(error);
    }
};
