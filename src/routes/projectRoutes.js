// projectroutes.js 

import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { createProject, getWorkspaceProjects } from "../controllers/ProjectController.js";
import { addProjectMember } from "../controllers/addMemberController.js";

const projectRouter = express.Router();

/*
Route: GET /workspace/:workspaceId/projects
Purpose: Fetch all projects belonging to a workspace
*/
projectRouter.get("/:workspaceId/projects", authMiddleware, getWorkspaceProjects);
projectRouter.post("/:workspaceId/projects", authMiddleware, createProject);
projectRouter.post("/:projectId/add-member", authMiddleware, addProjectMember);

export default projectRouter;