import { createTaskService, deleteTasksService, updateTaskService } from "../services/taskServices.js";


export const createTaskController = async (req, res, next) => {
    try {
        const userId = req.userId;

        const payload = {
            ...req.body,
            projectId: req.params.projectId,
            origin: req.headers.origin,
        };

        const task = await createTaskService(userId, payload);

        return res.status(201).json({
            success: true,
            message: "Task created successfully",
            data: task,
        });
    } catch (error) {
        return next(error);
    }
};


export const updateTaskController = async (req, res, next) => {
    try {
        // Extract logged-in user ID from Clerk
        const userId = req.userId;

        // Get task ID from URL params
        const { taskId } = req.params;

        // Call service with payload
        const updatedTask = await updateTaskService(
            userId,
            taskId,
            req.body
        );

        // Send success response
        return res.status(200).json({
            success: true,
            message: "Task updated successfully",
            data: updatedTask,
        });
    } catch (error) {
        return next(error);
    }
};



// Delete Task Controller

export const deleteTaskController = async (req, res, next) => {
    try {
        // Extract logged-in user ID
        const userId = req.userId;

        // Get task ID from params
        const { taskId } = req.params;

        // Call service
        const result = await deleteTasksService(userId, [taskId]);

        // Send response
        return res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        return next(error);
    }
};
