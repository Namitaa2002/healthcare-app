import prisma from "../config/prisma.js";

import {
  hashPassword,
  comparePassword,
  generateToken,
} from "../utils/authUtils.js";

/* =========================================
   CREATE ORGANIZATION
========================================= */

const createOrganization = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Organization name is required",
      });
    }

    const organization = await prisma.organization.create({
      data: {
        name,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Organization created successfully",
      data: organization,
    });
  } catch (error) {
    console.error("Create organization error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating organization",
    });
  }
};

/* =========================================
   CREATE ORGANIZATION ADMIN
========================================= */

const createOrganizationAdmin = async (req, res) => {
  try {
    const {
      organizationId,
      name,
      email,
      password,
      phone,
    } = req.body;

    if (!organizationId || !name || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Organization ID, name, email and password are required",
      });
    }

    const organization = await prisma.organization.findUnique({
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

    const hashedPassword = await hashPassword(password);

    const admin = await prisma.user.create({
      data: {
        organizationId,
        name,
        email,
        password: hashedPassword,
        role: "ORGANIZATION_ADMIN",
        phone: phone || null,
      },
    });

    const token = generateToken(admin);

    return res.status(201).json({
      success: true,
      message: "Organization admin created successfully",
      data: {
        user: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          organizationId: admin.organizationId,
          branchId: admin.branchId,
          phone: admin.phone,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Create organization admin error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while creating organization admin",
    });
  }
};

/* =========================================
   ORGANIZATION ADMIN DASHBOARD
========================================= */

const getOrganizationDashboard = async (req, res) => {
  try {
    if (req.user.role !== "ORGANIZATION_ADMIN") {
      return res.status(403).json({
        success: false,
        message:
          "Only organization admins can view this dashboard",
      });
    }

    const organizationId = req.user.organizationId;

    const [
      branches,
      services,
      providers,
      patients,
      appointments,
      pendingAppointments,
      completedAppointments,
      paidAppointments,
      recentAppointments,
    ] = await Promise.all([
      prisma.branch.count({
        where: {
          organizationId,
        },
      }),

      prisma.service.count({
        where: {
          branch: {
            organizationId,
          },
        },
      }),

      prisma.provider.count({
        where: {
          user: {
            organizationId,
          },
        },
      }),

      prisma.patient.count({
        where: {
          user: {
            organizationId,
          },
        },
      }),

      prisma.appointment.count({
        where: {
          branch: {
            organizationId,
          },
        },
      }),

      prisma.appointment.count({
        where: {
          branch: {
            organizationId,
          },
          status: "PENDING",
        },
      }),

      prisma.appointment.count({
        where: {
          branch: {
            organizationId,
          },
          status: "COMPLETED",
        },
      }),

      prisma.appointment.count({
        where: {
          branch: {
            organizationId,
          },
          paymentStatus: "PAID",
        },
      }),

      prisma.appointment.findMany({
        where: {
          branch: {
            organizationId,
          },
        },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },

          provider: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },

          service: true,
          branch: true,
          payment: true,
        },

        orderBy: {
          createdAt: "desc",
        },

        take: 5,
      }),
    ]);

    return res.status(200).json({
      success: true,
      message:
        "Organization dashboard data fetched successfully",

      data: {
        branches,
        services,
        providers,
        patients,
        appointments,
        pendingAppointments,
        completedAppointments,
        paidAppointments,
        recentAppointments,
      },
    });
  } catch (error) {
    console.error(
      "Get organization dashboard error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while loading organization dashboard",
    });
  }
};

/* =========================================
   GET ORGANIZATION SETTINGS
========================================= */

const getOrganizationSettings = async (req, res) => {
  try {
    if (req.user.role !== "ORGANIZATION_ADMIN") {
      return res.status(403).json({
        success: false,
        message:
          "Only organization admins can access settings",
      });
    }

    const organizationId = req.user.organizationId;

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

    const admin = await prisma.user.findUnique({
      where: {
        id: req.user.userId,
      },

      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        appointmentReminders: true,
        paymentUpdates: true,
        emailUpdates: true,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Organization settings fetched successfully",

      data: {
        organization,
        admin,
      },
    });
  } catch (error) {
    console.error(
      "Get organization settings error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while loading organization settings",
    });
  }
};

/* =========================================
   UPDATE ORGANIZATION SETTINGS
========================================= */

const updateOrganizationSettings = async (req, res) => {
  try {
    if (req.user.role !== "ORGANIZATION_ADMIN") {
      return res.status(403).json({
        success: false,
        message:
          "Only organization admins can update settings",
      });
    }

    const organizationId = req.user.organizationId;
    const userId = req.user.userId;

    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      country,
      appointmentReminders,
      paymentUpdates,
      emailUpdates,
    } = req.body;

    // Update organization information
    const organization =
      await prisma.organization.update({
        where: {
          id: organizationId,
        },
        data: {
          name,
          email: email || null,
          phone: phone || null,
          address: address || null,
          city: city || null,
          state: state || null,
          country: country || null,
        },
      });

    // Update organization admin information
    const admin = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        email,
        phone: phone || null,

        appointmentReminders:
          appointmentReminders ?? true,

        paymentUpdates:
          paymentUpdates ?? true,

        emailUpdates:
          emailUpdates ?? false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        appointmentReminders: true,
        paymentUpdates: true,
        emailUpdates: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: {
        organization,
        admin,
      },
    });
  } catch (error) {
    console.error(
      "Update organization settings error:",
      error
    );

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message:
          "This email address is already being used by another user",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while updating settings",
    });
  }
};

/* =========================================
   UPDATE ORGANIZATION ADMIN PASSWORD
========================================= */

const updateOrganizationAdminPassword = async (
  req,
  res
) => {
  try {
    if (req.user.role !== "ORGANIZATION_ADMIN") {
      return res.status(403).json({
        success: false,
        message:
          "Only organization admins can update password",
      });
    }

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Current password, new password and confirm password are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 8 characters long",
      });
    }

    const admin = await prisma.user.findUnique({
      where: {
        id: req.user.userId,
      },
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Organization admin not found",
      });
    }

    const isCurrentPasswordValid =
      await comparePassword(
        currentPassword,
        admin.password
      );

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const isSamePassword =
      await comparePassword(
        newPassword,
        admin.password
      );

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be different from current password",
      });
    }

    const hashedNewPassword =
      await hashPassword(newPassword);

    await prisma.user.update({
      where: {
        id: req.user.userId,
      },

      data: {
        password: hashedNewPassword,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error(
      "Update organization admin password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while updating password",
    });
  }
};

export {
  createOrganization,
  createOrganizationAdmin,
  getOrganizationDashboard,
  getOrganizationSettings,
  updateOrganizationSettings,
  updateOrganizationAdminPassword,
};