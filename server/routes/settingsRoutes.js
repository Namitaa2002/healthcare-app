import express from "express";

import {
  getSettings,
  updateSettings,
  changePassword,
  deleteAccount,
} from "../controllers/settingsController.js";

import authenticate from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, getSettings);

router.patch("/", authenticate, updateSettings);

router.patch(
  "/password",
  authenticate,
  changePassword
);

router.delete(
  "/account",
  authenticate,
  deleteAccount
);

export default router;