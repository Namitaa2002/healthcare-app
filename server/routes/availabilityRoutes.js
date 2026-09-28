
import express from "express";

import {
  createAvailability,
  getProviderAvailability,
  getMyProviderAvailability,
  createMyProviderAvailability,
} from "../controllers/availabilityController.js";

import authenticate from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();

// Provider apni availability dekhe
// IMPORTANT: ye dynamic :providerId route se PEHLE hona chahiye
router.get(
  "/provider/my",
  authenticate,
  authorize("PROVIDER"),
  getMyProviderAvailability
);

// Provider apni availability create kare
router.post(
  "/provider/my",
  authenticate,
  authorize("PROVIDER"),
  createMyProviderAvailability
);

// Admin availability create kare
router.post(
  "/",
  authenticate,
  authorize(
    "ORGANIZATION_ADMIN",
    "BRANCH_ADMIN"
  ),
  createAvailability
);

// Kisi provider ki availability
router.get(
  "/provider/:providerId",
  authenticate,
  getProviderAvailability
);

export default router;

