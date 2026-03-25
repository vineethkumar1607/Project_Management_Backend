//server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest } from "./inngest/client.js"
import { functions } from "./inngest/index.js"

import workspaceRoutes from "./routes/workspaceRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import taskRoutes from "./routes/tasksRoutes.js";
import commentRoutes from "./routes/commenstRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

// environment variables
dotenv.config();

const app = express();

// Middlewares for cors, json and cookies
app.use(cors());
app.use(express.json());

// Clerk middleware
// - Verifies Clerk authentication
// - Adds auth info to req (req.auth, req.userId, etc.)
// - Used for protected routes in the app
app.use(clerkMiddleware())



// Test Route
app.get("/", (req, res) => {
  res.json({ message: "Server is running successfully!" });
});

/*
This route is used by Inngest:
- Discover all registered background functions
- Execute them when events occur (ex: clerk/user.created)
- Handle retries, failures, and step execution
*/

/**
 * Inngest Endpoint
 *
 * Inngest uses this route to:
 * - Discover functions
 * - Trigger event handlers
 * - Manage retries
 */

app.use("/api/inngest", serve({
  client: inngest,          // Inngest client instance
  functions                   // Array of all registered Inngest functions
}));


app.post("/api/webhooks/clerk", async (req, res) => {
  try {
    const { type, data } = req.body;

    await inngest.send({
      name: `clerk/${type}`,
      data,
    });

    res.status(200).json({ received: true });
  } catch (error) {
    console.error(error);
    res.status(500).send("Webhook error");
  }
});

// Mount workspace-related routes
// All routes inside workspaceRoutes will be prefixed with /api/workspace
// GET  /api/workspace
// POST /api/workspace/add-member
app.use("/api/workspace", workspaceRoutes);

// Mount project-related routes
// GET /api/workspace/:workspaceId/projects
app.use("/api/projects", projectRoutes);

// Mount task-related routes
// GET /api/project/:projectId/tasks
app.use("/api/tasks", taskRoutes);

// Mount comment-related routes
// GET /api/task/:taskId/comments
app.use("/api", commentRoutes);

app.use(errorHandler);


const PORT = process.env.PORT || 5000;

// Starts the  server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
