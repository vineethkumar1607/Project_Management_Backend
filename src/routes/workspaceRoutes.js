import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { addWorkspaceMember } from "../controllers/addWorkspaceMember.js";
import { getUserWorkspaces } from "../controllers/workspaceController.js";

const workspaceRouter = express.Router();

/*
GET /workspace
Get all workspaces of logged-in user
*/
workspaceRouter.get("/", authMiddleware, getUserWorkspaces);

/*
POST /workspace/add-member
Add member to workspace
*/
workspaceRouter.post("/add-member", authMiddleware, addWorkspaceMember);

export default workspaceRouter;