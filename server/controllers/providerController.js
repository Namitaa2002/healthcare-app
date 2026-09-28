
import prisma from "../config/prisma.js";

import { hashPassword } from "../utils/authUtils.js";

// =========================================
// CREATE PROVIDER
// =========================================

const createProvider = async (req, res) => {
  try {
   const {
      branchId,
      name,
      email,
      password,
      phone,
      specialization,
      qualification,
      experienceYears,
      bio,
    } = req.body;

    const organizationId = req.user.organizationId;
    const userRole = req.user.role;
    const loggedInBranchId = req.user.branchId;

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
          "Branch ID, name, email and password are required",
      });
    }

    // Branch Admin can only create provider
    // for their own branch.
    if (
      userRole === "BRANCH_ADMIN" &&
      loggedInBranchId !== branchId
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only create providers for your assigned branch",
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
        message:
          "Branch not found in this organization",
      });
    }

    // Check duplicate email
    const existingUser =
      await prisma.user.findUnique({
        where: {
          email: email.trim().toLowerCase(),
        },
      });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "User with this email already exists",
      });
    }

    const hashedPassword =
      await hashPassword(password);

    const providerUser =
      await prisma.user.create({
        data: {
          organizationId,
          branchId,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: hashedPassword,
          role: "PROVIDER",
          phone: phone || null,
          provider: {
            create: {
              specialization:
                specialization?.trim() || null,
              qualification:
                qualification?.trim() || null,
              experienceYears:
                experienceYears !== null &&
                experienceYears !== undefined &&
                experienceYears !== ""
                  ? Number(experienceYears)
                  : null,
              bio: bio?.trim() || null,
            },
          },
        },
        include: {
          provider: true,
          branch: true,
        },
      });

    return res.status(201).json({
      success: true,
      message: "Provider created successfully",
      data: {
        id: providerUser.provider.id,
        userId: providerUser.id,
        name: providerUser.name,
        email: providerUser.email,
        phone: providerUser.phone,
        role: providerUser.role,
        organizationId:
          providerUser.organizationId,
        branchId: providerUser.branchId,
        branch: providerUser.branch,
        specialization:
          providerUser.provider.specialization,
        qualification:
          providerUser.provider.qualification,
        experienceYears:
          providerUser.provider.experienceYears,
        bio: providerUser.provider.bio,
      },
    });
  } catch (error) {
    console.error(
      "Create provider error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while creating provider",
    });
  }
};

// =========================================
// GET ALL PROVIDERS FOR ADMIN
// =========================================

const getProviders = async (req, res) => {
  try {
    const organizationId =
      req.user.organizationId;

    const providers =
      await prisma.provider.findMany({
        where: {
          user: {
            organizationId,
            role: "PROVIDER",
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
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    return res.status(200).json({
      success: true,
      data: providers,
    });
  } catch (error) {
    console.error(
      "Get providers error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load providers",
    });
  }
};

// =========================================
// GET PUBLIC PROVIDERS
// =========================================

const getPublicProviders = async (req, res) => {
  try {
    const providers = await prisma.provider.findMany({
      where: {
        user: {
          role: "PROVIDER",
          isActive: true,
        },
      },

      include: {
        user: {
          select: {
            id: true,
            name: true,
            branchId: true,

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
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: providers,
    });
  } catch (error) {
    console.error(
      "Get public providers error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load providers",
    });
  }
};

// =========================================
// UPDATE PROVIDER
// =========================================

const updateProvider = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      branchId,
      name,
      email,
      password,
      phone,
      specialization,
      qualification,
      experienceYears,
      bio,
    } = req.body;

    const organizationId =
      req.user.organizationId;

    const userRole = req.user.role;
    const loggedInBranchId = req.user.branchId;

    const provider =
      await prisma.provider.findFirst({
        where: {
          id,
          user: {
            organizationId,
            role: "PROVIDER",
          },
        },
        include: {
          user: true,
        },
      });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    // =========================================
    // BRANCH ADMIN RESTRICTIONS
    // =========================================

    if (userRole === "BRANCH_ADMIN") {
      if (
        provider.user.branchId !==
        loggedInBranchId
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only update providers from your assigned branch",
        });
      }

      if (
        branchId &&
        branchId !== loggedInBranchId
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You cannot move a provider to another branch",
        });
      }
    }

    // =========================================
    // CHECK TARGET BRANCH
    // =========================================

    if (branchId) {
      const branch =
        await prisma.branch.findFirst({
          where: {
            id: branchId,
            organizationId,
          },
        });

      if (!branch) {
        return res.status(404).json({
          success: false,
          message:
            "Branch not found in this organization",
        });
      }
    }

    // =========================================
    // CHECK EMAIL UNIQUENESS
    // =========================================

    if (
      email &&
      email.trim().toLowerCase() !==
        provider.user.email.toLowerCase()
    ) {
      const existingUser =
        await prisma.user.findUnique({
          where: {
            email: email.trim().toLowerCase(),
          },
        });

      if (
        existingUser &&
        existingUser.id !== provider.user.id
      ) {
        return res.status(409).json({
          success: false,
          message:
            "User with this email already exists",
        });
      }
    }

    // =========================================
    // UPDATE PROVIDER
    // =========================================

    const updatedProvider =
      await prisma.$transaction(
        async (tx) => {
          await tx.user.update({
            where: {
              id: provider.user.id,
            },
            data: {
              ...(name !== undefined && {
                name: name.trim(),
              }),

              ...(email !== undefined && {
                email: email
                  .trim()
                  .toLowerCase(),
              }),

              ...(password !== undefined &&
                password.trim() !== "" && {
                  password: await hashPassword(
                    password.trim()
                  ),
                }),

              ...(phone !== undefined && {
                phone: phone || null,
              }),

              ...(branchId !== undefined && {
                branchId,
              }),
            },
          });

          await tx.provider.update({
            where: {
              id: provider.id,
            },
            data: {
              ...(specialization !==
                undefined && {
                specialization:
                  specialization?.trim() ||
                  null,
              }),

              ...(qualification !==
                undefined && {
                qualification:
                  qualification?.trim() ||
                  null,
              }),

              ...(experienceYears !==
                undefined && {
                experienceYears:
                  experienceYears === null ||
                  experienceYears === ""
                    ? null
                    : Number(
                        experienceYears
                      ),
              }),

              ...(bio !== undefined && {
                bio:
                  bio?.trim() || null,
              }),
            },
          });

          return tx.provider.findUnique({
            where: {
              id: provider.id,
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
            },
          });
        }
      );

    return res.status(200).json({
      success: true,
      message:
        "Provider updated successfully",
      data: updatedProvider,
    });
  } catch (error) {
    console.error(
      "Update provider error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to update provider",
    });
  }
};

// =========================================
// DELETE PROVIDER
// =========================================

const deleteProvider = async (req, res) => {
  try {
    const { id } = req.params;

    const organizationId =
      req.user.organizationId;

    const provider =
      await prisma.provider.findFirst({
        where: {
          id,
          user: {
            organizationId,
            role: "PROVIDER",
          },
        },
        include: {
          user: true,
        },
      });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    // Do not delete provider if appointments exist
    const appointmentCount =
      await prisma.appointment.count({
        where: {
          providerId: id,
        },
      });

    if (appointmentCount > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This provider has existing appointments and cannot be deleted.",
      });
    }

    await prisma.user.delete({
      where: {
        id: provider.userId,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Provider deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete provider error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to delete provider",
    });
  }
};

// =========================================
// GET MY PROVIDER PROFILE
// =========================================

const getMyProviderProfile = async (
  req,
  res
) => {
  try {
    if (req.user.role !== "PROVIDER") {
      return res.status(403).json({
        success: false,
        message:
          "Only providers can view their profile",
      });
    }

    const provider =
      await prisma.provider.findUnique({
        where: {
          userId: req.user.userId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              branchId: true,
              organizationId: true,
              isActive: true,
              branch: {
                select: {
                  id: true,
                  name: true,
                  city: true,
                  state: true,
                  address: true,
                },
              },
            },
          },
        },
      });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message:
          "Provider profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Provider profile fetched successfully",
      data: provider,
    });
  } catch (error) {
    console.error(
      "Get provider profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load provider profile",
    });
  }
};

// =========================================
// UPDATE MY PROVIDER PROFILE
// =========================================

const updateMyProviderProfile = async (
  req,
  res
) => {
  try {
    if (req.user.role !== "PROVIDER") {
      return res.status(403).json({
        success: false,
        message:
          "Only providers can update their profile",
      });
    }

    const {
      name,
      email,
      phone,
      specialization,
      qualification,
      experienceYears,
      bio,
    } = req.body;

    const provider =
      await prisma.provider.findUnique({
        where: {
          userId: req.user.userId,
        },
        include: {
          user: true,
        },
      });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message:
          "Provider profile not found",
      });
    }

    // =========================================
    // CHECK DUPLICATE EMAIL
    // =========================================

    if (
      email &&
      email.trim().toLowerCase() !==
        provider.user.email.toLowerCase()
    ) {
      const existingUser =
        await prisma.user.findUnique({
          where: {
            email: email.trim().toLowerCase(),
          },
        });

      if (
        existingUser &&
        existingUser.id !== provider.user.id
      ) {
        return res.status(409).json({
          success: false,
          message:
            "User with this email already exists",
        });
      }
    }

    // =========================================
    // VALIDATE EXPERIENCE
    // =========================================

    if (
      experienceYears !== undefined &&
      experienceYears !== null &&
      experienceYears !== ""
    ) {
      const parsedExperience =
        Number(experienceYears);

      if (
        !Number.isInteger(parsedExperience) ||
        parsedExperience < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Experience must be a valid non-negative number",
        });
      }
    }

    // =========================================
    // UPDATE PROFILE
    // =========================================

    const updatedProvider =
      await prisma.$transaction(
        async (tx) => {
          // Update User information
          await tx.user.update({
            where: {
              id: provider.user.id,
            },
            data: {
              ...(name !== undefined && {
                name: name.trim(),
              }),

              ...(email !== undefined && {
                email: email
                  .trim()
                  .toLowerCase(),
              }),

              ...(phone !== undefined && {
                phone: phone || null,
              }),
            },
          });

          // Update Provider information
          await tx.provider.update({
            where: {
              id: provider.id,
            },
            data: {
              ...(specialization !==
                undefined && {
                specialization:
                  specialization?.trim() ||
                  null,
              }),

              ...(qualification !==
                undefined && {
                qualification:
                  qualification?.trim() ||
                  null,
              }),

              ...(experienceYears !==
                undefined && {
                experienceYears:
                  experienceYears === null ||
                  experienceYears === ""
                    ? null
                    : Number(
                        experienceYears
                      ),
              }),

              ...(bio !== undefined && {
                bio:
                  bio?.trim() || null,
              }),
            },
          });

          // Return updated profile
          return tx.provider.findUnique({
            where: {
              id: provider.id,
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                  role: true,
                  branchId: true,
                  organizationId: true,
                  isActive: true,
                  branch: {
                    select: {
                      id: true,
                      name: true,
                      city: true,
                      state: true,
                      address: true,
                    },
                  },
                },
              },
            },
          });
        }
      );

    return res.status(200).json({
      success: true,
      message:
        "Provider profile updated successfully",
      data: updatedProvider,
    });
  } catch (error) {
    console.error(
      "Update provider profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update provider profile",
    });
  }
};

// =========================================
// GET MY PROVIDER SETTINGS
// =========================================

const getMyProviderSettings = async (
  req,
  res
) => {
  try {
    if (req.user.role !== "PROVIDER") {
      return res.status(403).json({
        success: false,
        message:
          "Only providers can view their settings",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.user.userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        appointmentReminders: true,
        paymentUpdates: true,
        emailUpdates: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Provider account not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Provider settings fetched successfully",
      data: {
        appointmentReminders:
          user.appointmentReminders,
        paymentNotifications:
          user.paymentUpdates,
        emailNotifications:
          user.emailUpdates,
      },
    });
  } catch (error) {
    console.error(
      "Get provider settings error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load provider settings",
    });
  }
};

// =========================================
// UPDATE MY PROVIDER SETTINGS
// =========================================

const updateMyProviderSettings = async (
  req,
  res
) => {
  try {
    if (req.user.role !== "PROVIDER") {
      return res.status(403).json({
        success: false,
        message:
          "Only providers can update their settings",
      });
    }

    const {
      appointmentReminders,
      paymentNotifications,
      emailNotifications,
    } = req.body;

    const updatedUser =
      await prisma.user.update({
        where: {
          id: req.user.userId,
        },
        data: {
          appointmentReminders:
            appointmentReminders ?? true,

          paymentUpdates:
            paymentNotifications ?? true,

          emailUpdates:
            emailNotifications ?? false,
        },
        select: {
          id: true,
          name: true,
          email: true,
          appointmentReminders: true,
          paymentUpdates: true,
          emailUpdates: true,
        },
      });

    return res.status(200).json({
      success: true,
      message:
        "Settings updated successfully",
      data: {
        appointmentReminders:
          updatedUser.appointmentReminders,

        paymentNotifications:
          updatedUser.paymentUpdates,

        emailNotifications:
          updatedUser.emailUpdates,
      },
    });
  } catch (error) {
    console.error(
      "Update provider settings error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update provider settings",
    });
  }
};

// =========================================
// EXPORT
// =========================================

export {
  createProvider,
  getProviders,
  getPublicProviders,
  updateProvider,
  deleteProvider,
  getMyProviderProfile,
  updateMyProviderProfile,
  getMyProviderSettings,
  updateMyProviderSettings,
};

