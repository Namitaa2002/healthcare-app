
import express from "express";

import {
  createConnectedAccount,
  createOnboardingLink,
  createCheckoutSession,
  handleStripeWebhook,
  getConnectedAccountStatus,
} from "../controllers/stripeController.js";

import authenticate from "../middleware/authMiddleware.js";

import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post(
  "/connect",
  authenticate,
  authorize("ORGANIZATION_ADMIN", "BRANCH_ADMIN"),
  createConnectedAccount
);

router.post(
  "/onboarding",
  authenticate,
  authorize("ORGANIZATION_ADMIN", "BRANCH_ADMIN", "PROVIDER"),
  createOnboardingLink
);

router.post(
  "/checkout",
  authenticate,
  authorize("PATIENT"),
  createCheckoutSession
);

router.get(
  "/account-status/:providerId",
  authenticate,
  authorize("ORGANIZATION_ADMIN", "BRANCH_ADMIN", "PROVIDER"),
  getConnectedAccountStatus
);

router.post("/webhook", handleStripeWebhook);

export default router;

