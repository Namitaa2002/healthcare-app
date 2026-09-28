import bcrypt from "bcryptjs";

import prisma from "../config/prisma.js";

const getSettings = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.userId,
      },
      select: {
        appointmentReminders: true,
        paymentUpdates: true,
        emailUpdates: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Settings fetched successfully",
      data: user,
    });
  } catch (error) {
    console.error("Get settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching settings",
    });
  }
};

const updateSettings = async (req, res) => {
  try {
    const {
      appointmentReminders,
      paymentUpdates,
      emailUpdates,
    } = req.body;

    const data = {};

    if (typeof appointmentReminders === "boolean") {
      data.appointmentReminders = appointmentReminders;
    }

    if (typeof paymentUpdates === "boolean") {
      data.paymentUpdates = paymentUpdates;
    }

    if (typeof emailUpdates === "boolean") {
      data.emailUpdates = emailUpdates;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid settings provided",
      });
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: req.user.userId,
      },
      data,
      select: {
        appointmentReminders: true,
        paymentUpdates: true,
        emailUpdates: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating settings",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
    } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 6 characters long",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.user.userId,
      },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const isSamePassword = await bcrypt.compare(
      newPassword,
      user.password
    );

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be different from your current password",
      });
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while changing password",
    });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== "PATIENT") {
      return res.status(403).json({
        success: false,
        message:
          "Only patient accounts can be deleted from this page",
      });
    }

    await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while deleting your account",
    });
  }
};

export {
  getSettings,
  updateSettings,
  changePassword,
  deleteAccount,
};