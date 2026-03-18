
//commentsroutes.js
import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { getTaskComments } from "../controllers/ProjectController.js";

const commentsRouter = express.Router();

/*
Route: GET /task/:taskId/comments
Purpose: Fetch comments belonging to a task
*/
commentsRouter.get("/task/:taskId/comments", authMiddleware, getTaskComments);

export default commentsRouter;