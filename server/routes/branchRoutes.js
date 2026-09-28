import express from "express";

import {
  createBranch,
  getBranches,
  updateBranch,
  deleteBranch,
} from "../controllers/branchController.js";

import authenticate from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();

// Get branches
// Patient + Organization Admin
router.get(
  "/",
  authenticate,
  authorize("PATIENT", "ORGANIZATION_ADMIN"),
  getBranches
);

// Create branch
// Organization Admin only
router.post(
  "/",
  authenticate,
  authorize("ORGANIZATION_ADMIN"),
  createBranch
);

// Update branch
// Organization Admin only
router.patch(
  "/:id",
  authenticate,
  authorize("ORGANIZATION_ADMIN"),
  updateBranch
);

// Delete branch
// Organization Admin only
router.delete(
  "/:id",
  authenticate,
  authorize("ORGANIZATION_ADMIN"),
  deleteBranch
);

export default router;