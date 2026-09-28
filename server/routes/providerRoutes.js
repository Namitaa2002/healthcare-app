
import express from "express";

import {
  createProvider,
  getProviders,
  getPublicProviders,
  updateProvider,
  deleteProvider,
  getMyProviderProfile,
  updateMyProviderProfile,
  getMyProviderSettings,
  updateMyProviderSettings,
} from "../controllers/providerController.js";

import authenticate from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();

// =========================================
// GET PUBLIC PROVIDERS
// =========================================

router.get(
  "/public",
  getPublicProviders
);

// =========================================
// GET ALL PROVIDERS FOR ADMIN
// =========================================

router.get(
  "/admin",
  authenticate,
  authorize(
    "ORGANIZATION_ADMIN",
    "BRANCH_ADMIN"
  ),
  getProviders
);

// =========================================
// CREATE PROVIDER
// =========================================

router.post(
  "/",
  authenticate,
  authorize(
    "ORGANIZATION_ADMIN",
    "BRANCH_ADMIN"
  ),
  createProvider
);

// =========================================
// GET MY PROVIDER PROFILE
// =========================================

router.get(
  "/profile",
  authenticate,
  authorize("PROVIDER"),
  getMyProviderProfile
);

// =========================================
// UPDATE MY PROVIDER PROFILE
// =========================================

router.put(
  "/profile",
  authenticate,
  authorize("PROVIDER"),
  updateMyProviderProfile
);

// =========================================
// GET MY PROVIDER SETTINGS
// =========================================

router.get(
  "/settings",
  authenticate,
  authorize("PROVIDER"),
  getMyProviderSettings
);

// =========================================
// UPDATE MY PROVIDER SETTINGS
// =========================================

router.put(
  "/settings",
  authenticate,
  authorize("PROVIDER"),
  updateMyProviderSettings
);

// =========================================
// UPDATE PROVIDER - ADMIN ONLY
// =========================================

router.patch(
  "/:id",
  authenticate,
  authorize(
    "ORGANIZATION_ADMIN",
    "BRANCH_ADMIN"
  ),
  updateProvider
);

// =========================================
// DELETE PROVIDER - ORGANIZATION ADMIN ONLY
// =========================================

router.delete(
  "/:id",
  authenticate,
  authorize("ORGANIZATION_ADMIN"),
  deleteProvider
);

export default router;

