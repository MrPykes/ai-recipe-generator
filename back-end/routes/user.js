import express from "express";
import * as userController from "../controllers/userController.js";
import authMiddleware from "../middleware/auth.js";
const router = express.Router();

//All routes are protected
router.use(authMiddleware);

// Get user profile
router.get("/profile", userController.getProfile);
// Update user profile
router.put("/profile", userController.updateProfile);
// Update preferences
router.put("/preferences", userController.updatePreferences);
// Change password
router.post("/change-password", userController.changePassword);
// Delete user account
router.delete("/account", userController.deleteAccount);

export default router;
