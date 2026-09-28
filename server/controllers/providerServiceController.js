import prisma from "../config/prisma.js";

// Assign a service to a provider
const assignServiceToProvider = async (req, res) => {
  try {
    const { providerId, serviceId } = req.body;

    // Validate required fields
    if (!providerId || !serviceId) {
      return res.status(400).json({
        success: false,
        message: "Provider ID and service ID are required",
      });
    }

    // Check provider exists
    const provider = await prisma.provider.findUnique({
      where: {
        id: providerId,
      },
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    // Check service exists
    const service = await prisma.service.findUnique({
      where: {
        id: serviceId,
      },
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // Make sure provider and service belong to the same branch
    const providerUser = await prisma.user.findUnique({
      where: {
        id: provider.userId,
      },
    });

    const branch = await prisma.branch.findUnique({
      where: {
        id: service.branchId,
      },
    });

    if (
      !providerUser ||
      !branch ||
      providerUser.branchId !== service.branchId
    ) {
      return res.status(400).json({
        success: false,
        message: "Provider and service must belong to the same branch",
      });
    }

    // Check whether service is already assigned
    const existingAssignment = await prisma.providerService.findUnique({
      where: {
        providerId_serviceId: {
          providerId,
          serviceId,
        },
      },
    });

    if (existingAssignment) {
      return res.status(409).json({
        success: false,
        message: "Service is already assigned to this provider",
      });
    }

    // Create provider-service relationship
    const assignment = await prisma.providerService.create({
      data: {
        providerId,
        serviceId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Service assigned to provider successfully",
      data: assignment,
    });
  } catch (error) {
    console.error("Assign service error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while assigning service",
    });
  }
};

// Get providers for a service
const getProvidersByService = async (req, res) => {
  try {
    const { serviceId } = req.query;

    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: "Service ID is required",
      });
    }

    // Check service exists
    const service = await prisma.service.findUnique({
      where: {
        id: serviceId,
      },
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // Find providers assigned to this service
    const providerServices = await prisma.providerService.findMany({
      where: {
        serviceId,
      },
      include: {
        provider: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                branchId: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    const providers = providerServices
      .filter(
        (item) =>
          item.provider.user?.isActive &&
          item.provider.user?.branchId === service.branchId
      )
      .map((item) => ({
        id: item.provider.id,
        name: item.provider.user.name,
        email: item.provider.user.email,
        phone: item.provider.user.phone,
        specialization: item.provider.specialization,
        qualification: item.provider.qualification,
        experienceYears: item.provider.experienceYears,
        bio: item.provider.bio,
      }));

    return res.status(200).json({
      success: true,
      message: "Providers fetched successfully",
      data: providers,
    });
  } catch (error) {
    console.error("Get providers by service error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching providers",
    });
  }
};

export {
  assignServiceToProvider,
  getProvidersByService,
};