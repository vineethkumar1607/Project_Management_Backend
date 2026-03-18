// projectroutes.js 

import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { getWorkspaceProjects } from "../controllers/ProjectController.js";

const projectRouter = express.Router();

/*
Route: GET /workspace/:workspaceId/projects
Purpose: Fetch all projects belonging to a workspace
*/
projectRouter.get(
    "/workspace/:workspaceId/projects",
    authMiddleware,
    getWorkspaceProjects
);

export default projectRouter;