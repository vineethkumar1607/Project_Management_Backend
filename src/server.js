import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index"

// environment variables
dotenv.config();

const app = express();

// Middlewares for cors, json and cookies
app.use(cors());
app.use(express.json());
// app.use(cookieParser());
app.use(clerkMiddleware())



// Test Route
app.get("/", (req, res) => {
  res.json({ message: "Server is running successfully!" });
});
// Set up the "/api/inngest" (recommended) routes with the serve handler
app.use("/api/inngest", serve({ client: inngest, functions }));

const PORT = process.env.PORT || 5000;

// Starts the  server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
