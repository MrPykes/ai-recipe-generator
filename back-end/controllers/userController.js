import User from "../models/User";
import UserPreference from "../models/UserPreference";

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const preferences = await UserPreference.getByUserId(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        user,
        preferences,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.update(req.user.id, { name, email });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update user preferences
export const updatePreferences = async (req, res) => {
  try {
    const preferences = await UserPreference.upsert(req.user.id, req.body);

    res.status(200).json({
      success: true,
      message: "Preferences updated successfully",
      data: {
        preferences,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Change user password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    // Verify current password
    const user = await User.findByEmail(req.user.email);
    const isPasswordValid = await User.verifyPassword(
      currentPassword,
      user.password_hash,
    );
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }
    // Update to new password
    await User.updatePassword(req.user.id, newPassword);
    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Delete user account
export const deleteAccount = async (req, res) => {
  try {
    await User.delete(req.user.id);

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
