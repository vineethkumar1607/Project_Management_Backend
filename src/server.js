import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"

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

app.use("/api/inngest", serve({
  client: inngest,          // Inngest client instance
  functions                   // Array of all registered Inngest functions
}));

const PORT = process.env.PORT || 5000;

// Starts the  server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
