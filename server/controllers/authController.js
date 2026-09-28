import prisma from "../config/prisma.js";

import {
  hashPassword,
  comparePassword,
  generateToken,
} from "../utils/authUtils.js";

// =====================================================
// REGISTER USER
// =====================================================
// This function creates a new user in the database.
// For now, it is kept as a basic registration API.
// Role-based restrictions will be added later through
// authentication and authorization middleware.

const register = async (req, res) => {
  try {
    // Get registration data from request body
    const {
      name,
      email,
      password,
      role,
      organizationId,
      branchId,
      phone,
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password and role are required",
      });
    }

    // Check whether a user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Hash the password before storing it in the database
    const hashedPassword = await hashPassword(password);

    // Create the user in PostgreSQL
    const user = await prisma.user.create({
  data: {
    name,
    email,
    password: hashedPassword,
    role,
    organizationId,
    branchId: branchId || null,
    phone: phone || null,

    ...(role === "PATIENT"
      ? {
          patient: {
            create: {},
          },
        }
      : {}),
  },
});

    // Generate JWT token for the newly registered user
    const token = generateToken(user);

    // Send user information and token to frontend
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
          branchId: user.branchId,
          phone: user.phone,
        },
        token,
      },
    });
  } catch (error) {
    // Log actual error in backend console for debugging
    console.error("Register error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while registering user",
    });
  }
};

// =====================================================
// LOGIN USER
// =====================================================
// This function authenticates an existing user.
// It checks the email, compares the password and
// generates a JWT token after successful login.

const login = async (req, res) => {
  try {
    // Get login credentials from request body
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    // If no user is found, return authentication error
    // We don't reveal whether the email exists for security.
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check whether the user account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    // Compare entered password with hashed password
    // stored in PostgreSQL
    const isPasswordValid = await comparePassword(
      password,
      user.password
    );

    // If password does not match, reject login
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT token after successful authentication
    const token = generateToken(user);

    // Return safe user information and token
    // Password is intentionally NOT returned.
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
          branchId: user.branchId,
          phone: user.phone,
        },
        token,
      },
    });
  } catch (error) {
    // Log actual error in backend console for debugging
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while logging in",
    });
  }
};

// Export controller functions so routes can use them
export {
  register,
  login,
};