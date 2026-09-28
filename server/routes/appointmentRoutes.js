import express from "express";

import {
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  cancelAppointment,
  deleteAppointment,
  getAvailableSlots,
  getAllAppointments,
  getMyProviderAppointments,
} from "../controllers/appointmentController.js";

import authenticate from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();

// =========================================
// CREATE APPOINTMENT
// Patient
// =========================================

router.post(
  "/",
  authenticate,
  createAppointment
);

// =========================================
// GET ALL APPOINTMENTS
// Organization Admin / Branch Admin
// =========================================

router.get(
  "/",
  authenticate,
  authorize(
    "ORGANIZATION_ADMIN",
    "BRANCH_ADMIN"
  ),
  getAllAppointments
);

// =========================================
// GET MY APPOINTMENTS
// Patient
// =========================================

router.get(
  "/my",
  authenticate,
  getMyAppointments
);

router.get(
  "/provider/my",
  authenticate,
  authorize("PROVIDER"),
  getMyProviderAppointments
);

// =========================================
// GET AVAILABLE SLOTS
// =========================================

router.get(
  "/available-slots",
  authenticate,
  getAvailableSlots
);

// =========================================
// GET APPOINTMENT BY ID
// =========================================

router.get(
  "/:id",
  authenticate,
  getAppointmentById
);

// =========================================
// CANCEL APPOINTMENT
// =========================================

router.patch(
  "/:id/cancel",
  authenticate,
  cancelAppointment
);

// =========================================
// DELETE APPOINTMENT
// Admin
// =========================================

router.delete(
  "/:id",
  authenticate,
  deleteAppointment
);

export default router;