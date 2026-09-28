import express from "express";

import {
  register,
  login,
} from "../controllers/authController.js";

const router = express.Router();

// =====================================================
// REGISTER ROUTE
// =====================================================
// Creates a new user account.
router.post("/register", register);

// =====================================================
// LOGIN ROUTE
// =====================================================
// Authenticates an existing user and returns a JWT token.
router.post("/login", login);

export default router;