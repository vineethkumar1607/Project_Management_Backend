// projectroutes.js 

import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { createProject, getWorkspaceProjects, updateProject } from "../controllers/ProjectController.js";
import { removeProjectMember, addProjectMember, getProjectMembers } from "../controllers/memberController.js";

const projectRouter = express.Router();

/*
Route: GET /workspace/:workspaceId/projects
*/
projectRouter.get("/:workspaceId/projects", authMiddleware, getWorkspaceProjects);
projectRouter.post("/:workspaceId/projects", authMiddleware, createProject);
projectRouter.post("/:projectId/add-member", authMiddleware, addProjectMember);
projectRouter.patch("/:projectId", authMiddleware, updateProject);
projectRouter.put("/:projectId", authMiddleware, updateProject);
// REMOVE MEMBER
projectRouter.delete("/:projectId/member/:memberId", authMiddleware, removeProjectMember);
projectRouter.get("/:projectId/members", authMiddleware, getProjectMembers);

export default projectRouter;       