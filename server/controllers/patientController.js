import prisma from "../config/prisma.js";

import { hashPassword } from "../utils/authUtils.js";

// =========================================
// CREATE PATIENT
// =========================================

// Create patient and patient profile
const createPatient = async (req, res) => {
  try {
    const {
      organizationId,
      branchId,
      name,
      email,
      password,
      phone,
      dateOfBirth,
      gender,
      address,
      emergencyName,
      emergencyPhone,
    } = req.body;

    // Validate required fields
    if (
      !organizationId ||
      !branchId ||
      !name ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Organization ID, branch ID, name, email and password are required",
      });
    }

    // Check organization
    const organization =
      await prisma.organization.findUnique({
        where: {
          id: organizationId,
        },
      });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    // Check branch belongs to organization
    const branch = await prisma.branch.findFirst({
      where: {
        id: branchId,
        organizationId,
      },
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found in this organization",
      });
    }

    // Check duplicate email
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

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user and patient profile together
    const patient = await prisma.user.create({
      data: {
        organizationId,
        branchId,
        name,
        email,
        password: hashedPassword,
        role: "PATIENT",
        phone: phone || null,

        patient: {
          create: {
            dateOfBirth: dateOfBirth
              ? new Date(dateOfBirth)
              : null,

            gender: gender || null,

            address: address || null,

            emergencyName: emergencyName || null,

            emergencyPhone: emergencyPhone || null,
          },
        },
      },

      include: {
        patient: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Patient created successfully",

      data: {
        id: patient.patient.id,
        userId: patient.id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        role: patient.role,
        organizationId: patient.organizationId,
        branchId: patient.branchId,
        dateOfBirth: patient.patient.dateOfBirth,
        gender: patient.patient.gender,
        address: patient.patient.address,
        emergencyName: patient.patient.emergencyName,
        emergencyPhone: patient.patient.emergencyPhone,
      },
    });
  } catch (error) {
    console.error("Create patient error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while creating patient",
    });
  }
};

// =========================================
// GET ALL PATIENTS - ADMIN
// =========================================

const getAllPatients = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    const patients = await prisma.patient.findMany({
      where: {
        user: {
          organizationId,
          role: "PATIENT",
        },
      },

      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            branchId: true,
            isActive: true,
            createdAt: true,

            branch: {
              select: {
                id: true,
                name: true,
                city: true,
                state: true,
              },
            },
          },
        },

        appointments: {
          select: {
            id: true,
            appointmentDate: true,
            startTime: true,
            endTime: true,
            status: true,
            paymentStatus: true,

            provider: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },

            service: {
              select: {
                id: true,
                name: true,
              },
            },
          },

          orderBy: {
            appointmentDate: "desc",
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedPatients = patients.map(
      (patient) => ({
        id: patient.id,

        userId: patient.user.id,

        name: patient.user.name,

        email: patient.user.email,

        phone: patient.user.phone,

        branch: patient.user.branch,

        branchId: patient.user.branchId,

        isActive: patient.user.isActive,

        dateOfBirth: patient.dateOfBirth,

        gender: patient.gender,

        address: patient.address,

        emergencyName: patient.emergencyName,

        emergencyPhone: patient.emergencyPhone,

        createdAt: patient.user.createdAt,

        appointmentCount:
          patient.appointments.length,

        appointments: patient.appointments,
      })
    );

    return res.status(200).json({
      success: true,

      message: "Patients fetched successfully",

      data: formattedPatients,
    });
  } catch (error) {
    console.error(
      "Get all patients error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching patients",
    });
  }
};

// =========================================
// GET LOGGED-IN PATIENT PROFILE
// =========================================

// Get logged-in patient's profile
const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },

      include: {
        patient: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== "PATIENT" || !user.patient) {
      return res.status(403).json({
        success: false,
        message: "Patient profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",

      data: {
        id: user.patient.id,
        userId: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        organizationId: user.organizationId,
        branchId: user.branchId,
        dateOfBirth: user.patient.dateOfBirth,
        gender: user.patient.gender,
        address: user.patient.address,
        emergencyName: user.patient.emergencyName,
        emergencyPhone: user.patient.emergencyPhone,
      },
    });
  } catch (error) {
    console.error(
      "Get patient profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching profile",
    });
  }
};

// =========================================
// UPDATE LOGGED-IN PATIENT PROFILE
// =========================================

// Update logged-in patient's profile
const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      name,
      phone,
      dateOfBirth,
      gender,
      address,
      emergencyName,
      emergencyPhone,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (
      phone &&
      !/^[0-9]{10}$/.test(phone)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid 10-digit phone number",
      });
    }

    if (
      emergencyPhone &&
      !/^[0-9]{10}$/.test(emergencyPhone)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid emergency contact number",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },

      include: {
        patient: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== "PATIENT" || !user.patient) {
      return res.status(403).json({
        success: false,
        message: "Patient profile not found",
      });
    }

    let parsedDateOfBirth = null;

    if (dateOfBirth) {
      const date = new Date(dateOfBirth);

      if (Number.isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date of birth",
        });
      }

      parsedDateOfBirth = date;
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },

      data: {
        name: name.trim(),

        phone: phone?.trim() || null,

        patient: {
          update: {
            dateOfBirth: parsedDateOfBirth,

            gender: gender?.trim() || null,

            address: address?.trim() || null,

            emergencyName:
              emergencyName?.trim() || null,

            emergencyPhone:
              emergencyPhone?.trim() || null,
          },
        },
      },

      include: {
        patient: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",

      data: {
        id: updatedUser.patient.id,
        userId: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        organizationId:
          updatedUser.organizationId,
        branchId: updatedUser.branchId,
        dateOfBirth:
          updatedUser.patient.dateOfBirth,
        gender: updatedUser.patient.gender,
        address:
          updatedUser.patient.address,
        emergencyName:
          updatedUser.patient.emergencyName,
        emergencyPhone:
          updatedUser.patient.emergencyPhone,
      },
    });
  } catch (error) {
    console.error(
      "Update patient profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while updating profile",
    });
  }
};

const getMyProviderPatients = async (req, res) => {
  try {
    if (req.user.role !== "PROVIDER") {
      return res.status(403).json({
        success: false,
        message: "Only providers can view their patients",
      });
    }

    const provider = await prisma.provider.findUnique({
      where: {
        userId: req.user.userId,
      },
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found",
      });
    }

    const patients = await prisma.patient.findMany({
      where: {
        appointments: {
          some: {
            providerId: provider.id,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        appointments: {
          where: {
            providerId: provider.id,
          },
          include: {
            service: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: [
            {
              appointmentDate: "desc",
            },
            {
              startTime: "desc",
            },
          ],
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Provider patients fetched successfully",
      data: patients,
    });
  } catch (error) {
    console.error("Get provider patients error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching provider patients",
    });
  }
};

export {
  createPatient,
  getAllPatients,
  getMyProfile,
  updateMyProfile,
  getMyProviderPatients,
};