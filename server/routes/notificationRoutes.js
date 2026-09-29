import express from "express";

import {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markNotificationAsUnread,
  markAllNotificationsAsRead,
} from "../controllers/notificationController.js";

import authenticate from "../middleware/authMiddleware.js";

const router = express.Router();

// =========================================
// GET MY NOTIFICATIONS
// =========================================

router.get(
  "/",
  authenticate,
  getMyNotifications
);

// =========================================
// GET UNREAD COUNT
// =========================================

router.get(
  "/unread-count",
  authenticate,
  getUnreadNotificationCount
);

// =========================================
// MARK ALL AS READ
// =========================================

router.patch(
  "/read-all",
  authenticate,
  markAllNotificationsAsRead
);

// =========================================
// MARK ONE AS READ
// =========================================

router.patch(
  "/:id/read",
  authenticate,
  markNotificationAsRead
);

router.patch(
  "/:id/unread",
  authenticate,
  markNotificationAsUnread
);

export default router;