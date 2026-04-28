import { createTaskService, deleteTasksService, getTaskByIdService, updateTaskService } from "../services/taskServices.js";
// Task Controller - handles task-related API requests such as creating, updating, and deleting tasks. 

// Create Task Controller - for creating a new task within a project

export const createTasksController = async (req, res, next) => {
    try {
        const userId = req.userId;

        const payload = {
            ...req.body,
            projectId: req.params.projectId,
            origin: req.headers.origin,
        };
        // Call service to create task
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

// Update Task Controller - for updating a single task by ID 
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



// Delete Task Controller - for deleting a single task by ID

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

// Get Task by ID Controller - for fetching a single task's details

export const getTaskByIdController = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const userId = req.userId;

        const task = await getTaskByIdService(taskId, userId);

        res.status(200).json({
            success: true,
            data: task,
        });
    } catch (err) {
        next(err);
    }
};
