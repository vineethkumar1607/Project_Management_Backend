// projectroutes.js 

import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { createProject, getWorkspaceProjects, updateProject, deleteProject } from "../controllers/ProjectController.js";
import { removeProjectMember, addProjectMember, getProjectMembers } from "../controllers/memberController.js";

const projectRouter = express.Router();

/*
Route: GET /workspace/:workspaceId/projects
*/
projectRouter.get("/workspace/:workspaceId", authMiddleware, getWorkspaceProjects);

projectRouter.post("/workspace/:workspaceId", authMiddleware, createProject);

projectRouter.delete("/:projectId", authMiddleware, deleteProject);

projectRouter.post("/:projectId/add-member", authMiddleware, addProjectMember);
projectRouter.patch("/:projectId", authMiddleware, updateProject);
projectRouter.put("/:projectId", authMiddleware, updateProject);
// REMOVE MEMBER
projectRouter.delete("/:projectId/member/:memberId", authMiddleware, removeProjectMember);
projectRouter.get("/:projectId/members", authMiddleware, getProjectMembers);

export default projectRouter;       