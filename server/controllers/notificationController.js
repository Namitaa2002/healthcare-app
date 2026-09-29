import prisma from "../config/prisma.js";

// =========================================
// GET MY NOTIFICATIONS
// =========================================

export const getMyNotifications = async (req, res) => {
  try {
    const notifications =
      await prisma.notification.findMany({
        where: {
          userId: req.user.userId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    return res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error(
      "Get notifications error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load notifications.",
    });
  }
};

// =========================================
// GET UNREAD NOTIFICATION COUNT
// =========================================

export const getUnreadNotificationCount = async (
  req,
  res
) => {
  try {
    const count =
      await prisma.notification.count({
        where: {
          userId: req.user.userId,
          isRead: false,
        },
      });

    return res.status(200).json({
      success: true,
      data: {
        count,
      },
    });
  } catch (error) {
    console.error(
      "Get unread notification count error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load unread notification count.",
    });
  }
};

// =========================================
// MARK ONE NOTIFICATION AS READ
// =========================================

export const markNotificationAsRead = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const notification =
      await prisma.notification.findFirst({
        where: {
          id,
          userId: req.user.userId,
        },
      });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    const updatedNotification =
      await prisma.notification.update({
        where: {
          id,
        },
        data: {
          isRead: true,
        },
      });

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      data: updatedNotification,
    });
  } catch (error) {
    console.error(
      "Mark notification as read error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update notification.",
    });
  }
};

// =========================================
// MARK ONE NOTIFICATION AS UNREAD
// =========================================

export const markNotificationAsUnread = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const notification =
      await prisma.notification.findFirst({
        where: {
          id,
          userId: req.user.userId,
        },
      });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    const updatedNotification =
      await prisma.notification.update({
        where: {
          id,
        },
        data: {
          isRead: false,
        },
      });

    return res.status(200).json({
      success: true,
      message: "Notification marked as unread.",
      data: updatedNotification,
    });
  } catch (error) {
    console.error(
      "Mark notification as unread error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update notification.",
    });
  }
};

// =========================================
// MARK ALL NOTIFICATIONS AS READ
// =========================================

export const markAllNotificationsAsRead = async (
  req,
  res
) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "All notifications marked as read.",
    });
  } catch (error) {
    console.error(
      "Mark all notifications as read error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update notifications.",
    });
  }
};