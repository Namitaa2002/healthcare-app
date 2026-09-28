import express from "express";

import {
  assignServiceToProvider,
  getProvidersByService,
} from "../controllers/providerServiceController.js";

import authenticate from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();

// Get providers for a service
// Patient + Admin
router.get(
  "/",
  authenticate,
  authorize(
    "PATIENT",
    "ORGANIZATION_ADMIN",
    "BRANCH_ADMIN"
  ),
  getProvidersByService
);

// Assign service to provider
// Admin only
router.post(
  "/",
  authenticate,
  authorize(
    "ORGANIZATION_ADMIN",
    "BRANCH_ADMIN"
  ),
  assignServiceToProvider
);

export default router;