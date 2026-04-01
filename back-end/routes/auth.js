import express from "express";
import * as authController from "../controllers/authController.js";
import authMiddleware from "../middleware/auth";
const router = express.Router();

// Public routes
router.post("/signup", authController.register);
router.post("/login", authController.login);
router.post("/reset-password", authController.resetPassword);

// Protected routes
router.get("/me", authMiddleware, authController.getCurrentUser);

export default router;
