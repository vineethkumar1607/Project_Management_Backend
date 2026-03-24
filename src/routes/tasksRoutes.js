import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { getProjectTasks } from "../controllers/ProjectController.js";
import { createTaskController, deleteTaskController, updateTaskController } from "../controllers/taskController.js";

const taskRouter = express.Router();

/*
Route: GET /project/:projectId/tasks
Purpose: Fetch all tasks belonging to a project
*/
taskRouter.get(
  "/project/:projectId/tasks",
  authMiddleware,
  getProjectTasks
);

// CREATE task
taskRouter.post(
  "/project/:projectId/tasks",
  authMiddleware,
  createTaskController
);

// UPDATE task
taskRouter.patch(
  "/:taskId",
  authMiddleware,
  updateTaskController
);

// DELETE task
taskRouter.delete(
  "/:taskId",
  authMiddleware,
  deleteTaskController
);

export default taskRouter;