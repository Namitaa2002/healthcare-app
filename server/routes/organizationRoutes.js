import express from "express";

import {
  createOrganization,
  createOrganizationAdmin,
  getOrganizationDashboard,
  getOrganizationSettings,
  updateOrganizationSettings,
  updateOrganizationAdminPassword,
} from "../controllers/organizationController.js";

import authenticate from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();

/* =========================================
   CREATE ORGANIZATION
========================================= */

router.post("/", createOrganization);

/* =========================================
   CREATE FIRST ORGANIZATION ADMIN
========================================= */

router.post("/admin", createOrganizationAdmin);

/* =========================================
   ORGANIZATION ADMIN DASHBOARD
========================================= */

router.get(
  "/dashboard",
  authenticate,
  authorize("ORGANIZATION_ADMIN"),
  getOrganizationDashboard
);

/* =========================================
   ORGANIZATION SETTINGS
========================================= */

// Get organization + admin settings

router.get(
  "/settings",
  authenticate,
  authorize("ORGANIZATION_ADMIN"),
  getOrganizationSettings
);

// Update organization + admin settings

router.put(
  "/settings",
  authenticate,
  authorize("ORGANIZATION_ADMIN"),
  updateOrganizationSettings
);

/* =========================================
   UPDATE ORGANIZATION ADMIN PASSWORD
========================================= */

router.put(
  "/settings/password",
  authenticate,
  authorize("ORGANIZATION_ADMIN"),
  updateOrganizationAdminPassword
);

export default router;