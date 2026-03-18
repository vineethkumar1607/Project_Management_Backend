import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { getProjectTasks } from "../controllers/ProjectController.js";

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

export default taskRouter;