import prisma from "../config/prisma.js";

// Create a service for a branch
const createService = async (req, res) => {
  try {
    const {
      branchId,
      name,
      description,
      duration,
      price,
    } = req.body;

    const organizationId = req.user.organizationId;

    if (
      !organizationId ||
      !branchId ||
      !name ||
      !duration ||
      price === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Branch ID, name, duration and price are required",
      });
    }

    // Make sure branch belongs to logged-in organization
    const branch = await prisma.branch.findFirst({
      where: {
        id: branchId,
        organizationId,
      },
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    const service = await prisma.service.create({
      data: {
        branchId,
        name: name.trim(),
        description: description?.trim() || null,
        duration: Number(duration),
        price: Number(price),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: service,
    });
  } catch (error) {
    console.error("Create service error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while creating service",
    });
  }
};

// Get services for patient booking
const getServices = async (req, res) => {
  try {
    const { branchId } = req.query;

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "Branch ID is required",
      });
    }

    const branch = await prisma.branch.findUnique({
      where: {
        id: branchId,
      },
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    const services = await prisma.service.findMany({
      where: {
        branchId,
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Services fetched successfully",
      data: services,
    });
  } catch (error) {
    console.error("Get services error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching services",
    });
  }
};

// Get all services for Organization Admin
const getAllServices = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "Organization ID is missing",
      });
    }

    const services = await prisma.service.findMany({
      where: {
        branch: {
          organizationId,
        },
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
          },
        },
      },
      orderBy: [
        {
          branch: {
            name: "asc",
          },
        },
        {
          name: "asc",
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "All services fetched successfully",
      data: services,
    });
  } catch (error) {
    console.error("Get all services error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching services",
    });
  }
};

// Update a service
const updateService = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      branchId,
      name,
      description,
      duration,
      price,
      isActive,
    } = req.body;

    const organizationId = req.user.organizationId;

    if (!organizationId || !id) {
      return res.status(400).json({
        success: false,
        message: "Service ID is required",
      });
    }

    const existingService =
      await prisma.service.findFirst({
        where: {
          id,
          branch: {
            organizationId,
          },
        },
      });

    if (!existingService) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    let targetBranchId = existingService.branchId;

    if (branchId) {
      const branch = await prisma.branch.findFirst({
        where: {
          id: branchId,
          organizationId,
        },
      });

      if (!branch) {
        return res.status(404).json({
          success: false,
          message: "Branch not found",
        });
      }

      targetBranchId = branchId;
    }

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Service name is required",
      });
    }

    if (
      duration !== undefined &&
      Number(duration) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Duration must be greater than 0",
      });
    }

    if (
      price !== undefined &&
      Number(price) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Price cannot be negative",
      });
    }

    const updatedService =
      await prisma.service.update({
        where: {
          id,
        },
        data: {
          branchId: targetBranchId,
          ...(name !== undefined && {
            name: name.trim(),
          }),
          ...(description !== undefined && {
            description:
              description?.trim() || null,
          }),
          ...(duration !== undefined && {
            duration: Number(duration),
          }),
          ...(price !== undefined && {
            price: Number(price),
          }),
          ...(isActive !== undefined && {
            isActive: Boolean(isActive),
          }),
        },
        include: {
          branch: {
            select: {
              id: true,
              name: true,
              city: true,
              state: true,
            },
          },
        },
      });

    return res.status(200).json({
      success: true,
      message: "Service updated successfully",
      data: updatedService,
    });
  } catch (error) {
    console.error("Update service error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while updating service",
    });
  }
};

// Delete a service
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    const organizationId = req.user.organizationId;

    if (!organizationId || !id) {
      return res.status(400).json({
        success: false,
        message: "Service ID is required",
      });
    }

    const existingService =
      await prisma.service.findFirst({
        where: {
          id,
          branch: {
            organizationId,
          },
        },
      });

    if (!existingService) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    const appointmentCount =
      await prisma.appointment.count({
        where: {
          serviceId: id,
        },
      });

    if (appointmentCount > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This service cannot be deleted because it has existing appointments. Deactivate it instead.",
      });
    }

    await prisma.service.delete({
      where: {
        id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error) {
    console.error("Delete service error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Unable to delete service.",
    });
  }
};

export {
  createService,
  getServices,
  getAllServices,
  updateService,
  deleteService,
};