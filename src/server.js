//server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest } from "./inngest/client.js"
import { functions } from "./inngest/index.js"

import workspaceRoutes from "./routes/workspaceRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import taskRoutes from "./routes/tasksRoutes.js";
import commentRoutes from "./routes/commenstRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import billingRoutes from "./routes/billingRoutes.js";


// environment variables

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Razorpay webhook route needs raw body
app.use("/api/webhooks/razorpay", express.raw({ type: "application/json" }));


app.use(express.json());

app.use("/api/inngest", serve({
  client: inngest,          // Inngest client instance
  functions                   // Array of all registered Inngest functions
}));


// Clerk middleware to handle authentication and user management
app.use(clerkMiddleware());



// Test Route
app.get("/", (req, res) => {
  res.json({ message: "Server is running successfully!" });
});

// Webhook route for Clerk events

app.post("/api/webhooks/clerk", async (req, res) => {
  try {
    const { type, data } = req.body;

    await inngest.send({
      name: `clerk/${type}`,
      data,
    });

    res.status(200).json({ received: true });
  } catch (error) {

    console.error("WEBHOOK ERROR:", error);

    res.status(500).send("Webhook error");
  }
});

//  workspace-related routes
// All routes inside workspaceRoutes will be prefixed with /api/workspace

app.use("/api/workspace", workspaceRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api", commentRoutes);
app.use("/api/billing", billingRoutes);

app.use("/api/webhooks", webhookRoutes);


app.use(errorHandler);

// console.log(process.env.RAZORPAY_KEY_ID);

const PORT = process.env.PORT || 5000;

// Starts the  server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
