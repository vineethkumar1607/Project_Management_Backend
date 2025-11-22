import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// environment variables
dotenv.config();

const app = express();

// Middlewares for cors and  json
app.use(cors());
app.use(express.json());

// Test Route
app.get("/", (req, res) => {
  res.json({ message: "Server is running successfully!" });
});


const PORT = process.env.PORT || 5000;

// Starts the  server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
