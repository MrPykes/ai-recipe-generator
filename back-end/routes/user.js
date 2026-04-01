import express from "express";
import * as authController from "../controllers/authController.js";
import authMiddleware from "../middleware/auth";
const router = express.Router();

//All routes are protected
router.use(authMiddleware);

// Get user profile
router.get("/profile", authController.getProfile);
// Update user profile
router.put("/profile", authController.updateProfile);
// Update preferences
router.put("/preferences", authController.updatePreferences);
// Change password
router.post("/change-password", authController.changePassword);
// Delete user account
router.delete("/account", authController.deleteAccount);

export default router;
