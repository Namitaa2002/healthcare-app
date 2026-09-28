
import express from "express";

import {
  createPatient,
  getAllPatients,
  getMyProfile,
  updateMyProfile,
  getMyProviderPatients,
} from "../controllers/patientController.js";

import authenticate from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();

// =========================================
// CREATE PATIENT
// =========================================

router.post(
  "/",
  authenticate,
  createPatient
);

// =========================================
// GET ALL PATIENTS
// Organization Admin / Branch Admin
// =========================================

router.get(
  "/",
  authenticate,
  authorize(
    "ORGANIZATION_ADMIN",
    "BRANCH_ADMIN"
  ),
  getAllPatients
);

router.get(
  "/provider/my",
  authenticate,
  authorize("PROVIDER"),
  getMyProviderPatients
);

// =========================================
// GET LOGGED-IN PATIENT PROFILE
// =========================================

router.get(
  "/profile",
  authenticate,
  getMyProfile
);

// =========================================
// UPDATE LOGGED-IN PATIENT PROFILE
// =========================================

router.patch(
  "/profile",
  authenticate,
  updateMyProfile
);

export default router;

