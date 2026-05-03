import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { getProjectTasks } from "../controllers/ProjectController.js";
import { createTasksController, updateTaskController, deleteTaskController, getTaskByIdController, deleteTaskControllerBulk } from "../controllers/taskController.js";

const taskRouter = express.Router();

/*
Route: GET /project/:projectId/tasks
Purpose: Retrieves all tasks associated with a specific project, ensuring that the requesting user is authenticated and authorized to view the tasks for that project.
*/
taskRouter.get("/project/:projectId/tasks", authMiddleware, getProjectTasks);

// CREATE task
taskRouter.post("/project/:projectId/tasks", authMiddleware, createTasksController);

// UPDATE task
taskRouter.patch("/:taskId", authMiddleware, updateTaskController);
taskRouter.put("/:taskId", authMiddleware, updateTaskController);

// DELETE single task
taskRouter.delete("/:taskId", authMiddleware, deleteTaskController);

// Bulk delete tasks - expects an array of task IDs in the request body to delete multiple tasks at once, ensuring they belong to the same project and that the user is authorized to delete them
taskRouter.delete("/", authMiddleware, deleteTaskControllerBulk);

// Get single task 
taskRouter.get("/:taskId", authMiddleware, getTaskByIdController);

export default taskRouter;