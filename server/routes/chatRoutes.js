
import express from "express";

import {
  getOrCreateConversation,
  getMyConversations,
  getConversationMessages,
  sendMessage,
  sendFileMessage,
  markConversationAsRead,
} from "../controllers/chatController.js";

import authenticate from "../middleware/authMiddleware.js";

import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// =========================================
// GET MY CONVERSATIONS
// =========================================

router.get(
  "/",
  authenticate,
  getMyConversations
);

// =========================================
// GET OR CREATE CONVERSATION
// =========================================

router.post(
  "/conversation",
  authenticate,
  getOrCreateConversation
);

// =========================================
// GET CONVERSATION MESSAGES
// =========================================

router.get(
  "/conversation/:conversationId/messages",
  authenticate,
  getConversationMessages
);

// =========================================
// SEND TEXT MESSAGE
// =========================================

router.post(
  "/conversation/:conversationId/messages",
  authenticate,
  sendMessage
);

// =========================================
// SEND FILE MESSAGE
// =========================================

router.post(
  "/conversation/:conversationId/messages/file",
  authenticate,
  upload.single("file"),
  sendFileMessage
);

// =========================================
// MARK MESSAGES AS READ
// =========================================

router.patch(
  "/conversation/:conversationId/read",
  authenticate,
  markConversationAsRead
);

export default router;

