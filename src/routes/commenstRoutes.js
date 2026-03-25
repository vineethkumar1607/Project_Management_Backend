import express from "express";
import { addTaskCommentController, getTaskCommentsController } from "../controllers/commentController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Create comment
router.post(
    "/tasks/:taskId/comments", authMiddleware, addTaskCommentController
);

// Get comments with pagination
router.get(
    "/tasks/:taskId/comments", authMiddleware, getTaskCommentsController
);

export default router;