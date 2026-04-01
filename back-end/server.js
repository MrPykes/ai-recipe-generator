import dotenv from "dotenv";

dotenv.config();

import express from "express";
import cors from "cors";
import { Pool } from "pg";
import jwt from "jsonwebtoken";

// Impoert routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Hello, World!" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
