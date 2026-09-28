import express from "express";

import {
  createService,
  getServices,
  getAllServices,
  updateService,
  deleteService,
} from "../controllers/serviceController.js";

import authenticate from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();

// =========================================
// PATIENT
// Get active services for selected branch
// =========================================

router.get(
  "/",
  authenticate,
  authorize("PATIENT"),
  getServices
);

// =========================================
// ORGANIZATION ADMIN
// Get all services
// =========================================

router.get(
  "/admin",
  authenticate,
  authorize("ORGANIZATION_ADMIN"),
  getAllServices
);

// =========================================
// ADMIN / BRANCH ADMIN
// Create service
// =========================================

router.post(
  "/",
  authenticate,
  authorize(
    "ORGANIZATION_ADMIN",
    "BRANCH_ADMIN"
  ),
  createService
);

// =========================================
// ORGANIZATION ADMIN
// Update service
// =========================================

router.patch(
  "/:id",
  authenticate,
  authorize("ORGANIZATION_ADMIN"),
  updateService
);

// =========================================
// ORGANIZATION ADMIN
// Delete service
// =========================================

router.delete(
  "/:id",
  authenticate,
  authorize("ORGANIZATION_ADMIN"),
  deleteService
);

export default router;