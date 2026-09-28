import prisma from "../config/prisma.js";

import {
  getCache,
  setCache,
  deleteCache,
} from "../config/redis.js";

// =========================================
// CREATE PROVIDER AVAILABILITY
// Admin / Branch Admin
// =========================================

const createAvailability = async (req, res) => {
  try {
    const {
      providerId,
      dayOfWeek,
      startTime,
      endTime,
    } = req.body;

    if (
      !providerId ||
      dayOfWeek === undefined ||
      !startTime ||
      !endTime
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Provider ID, day of week, start time and end time are required",
      });
    }

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({
        success: false,
        message: "Day of week must be between 0 and 6",
      });
    }

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

    const availability = await prisma.availability.create({
      data: {
        providerId,
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
      },
    });

    await deleteCache(
      `provider:availability:${providerId}`
    );

    return res.status(201).json({
      success: true,
      message: "Provider availability created successfully",
      data: availability,
    });
  } catch (error) {
    console.error("Create availability error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while creating availability",
    });
  }
};

// =========================================
// GET PROVIDER AVAILABILITY
// Admin / Branch Admin / Public appointment flow
// =========================================

const getProviderAvailability = async (req, res) => {
  try {
    const { providerId } = req.params;

    if (!providerId) {
      return res.status(400).json({
        success: false,
        message: "Provider ID is required",
      });
    }

    const cacheKey =
      `provider:availability:${providerId}`;

    const cachedAvailability =
      await getCache(cacheKey);

    if (cachedAvailability) {
      return res.status(200).json({
        success: true,
        message:
          "Provider availability fetched successfully",
        source: "cache",
        data: cachedAvailability,
      });
    }

    const availability =
      await prisma.availability.findMany({
        where: {
          providerId,
          isActive: true,
        },
        orderBy: {
          dayOfWeek: "asc",
        },
      });

    await setCache(
      cacheKey,
      availability,
      300
    );

    return res.status(200).json({
      success: true,
      message:
        "Provider availability fetched successfully",
      source: "database",
      data: availability,
    });
  } catch (error) {
    console.error(
      "Get provider availability error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching provider availability",
    });
  }
};

// =========================================
// GET LOGGED-IN PROVIDER AVAILABILITY
// Provider can only see their own availability
// =========================================

const getMyProviderAvailability = async (
  req,
  res
) => {
  try {
    if (req.user.role !== "PROVIDER") {
      return res.status(403).json({
        success: false,
        message:
          "Only providers can access their availability",
      });
    }

    const provider =
      await prisma.provider.findUnique({
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

    const cacheKey =
      `provider:availability:${provider.id}`;

    const cachedAvailability =
      await getCache(cacheKey);

    if (cachedAvailability) {
      return res.status(200).json({
        success: true,
        message:
          "Your availability fetched successfully",
        source: "cache",
        data: cachedAvailability,
      });
    }

    const availability =
      await prisma.availability.findMany({
        where: {
          providerId: provider.id,
          isActive: true,
        },
        orderBy: {
          dayOfWeek: "asc",
        },
      });

    await setCache(
      cacheKey,
      availability,
      300
    );

    return res.status(200).json({
      success: true,
      message:
        "Your availability fetched successfully",
      source: "database",
      data: availability,
    });
  } catch (error) {
    console.error(
      "Get my provider availability error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching your availability",
    });
  }
};

// =========================================
// CREATE LOGGED-IN PROVIDER AVAILABILITY
// Provider can only create their own availability
// =========================================

const createMyProviderAvailability = async (
  req,
  res
) => {
  try {
    if (req.user.role !== "PROVIDER") {
      return res.status(403).json({
        success: false,
        message:
          "Only providers can create their availability",
      });
    }

    const {
      dayOfWeek,
      startTime,
      endTime,
    } = req.body;

    if (
      dayOfWeek === undefined ||
      !startTime ||
      !endTime
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Day of week, start time and end time are required",
      });
    }

    const numericDay = Number(dayOfWeek);

    if (
      !Number.isInteger(numericDay) ||
      numericDay < 0 ||
      numericDay > 6
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Day of week must be between 0 and 6",
      });
    }

    const provider =
      await prisma.provider.findUnique({
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

    const availability =
      await prisma.availability.create({
        data: {
          providerId: provider.id,
          dayOfWeek: numericDay,
          startTime,
          endTime,
        },
      });

    await deleteCache(
      `provider:availability:${provider.id}`
    );

    return res.status(201).json({
      success: true,
      message:
        "Your availability created successfully",
      data: availability,
    });
  } catch (error) {
    console.error(
      "Create my provider availability error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while creating your availability",
    });
  }
};

const updateMyProviderAvailability = async (req, res) => {
  try {
    if (req.user.role !== "PROVIDER") {
      return res.status(403).json({
        success: false,
        message: "Only providers can update their availability",
      });
    }

    const { id } = req.params;
    const { dayOfWeek, startTime, endTime } = req.body;

    // Find provider using logged-in user
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

    // Validate required fields
    if (
      dayOfWeek === undefined ||
      !startTime ||
      !endTime
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Day, start time and end time are required",
      });
    }

    // Validate day
    const parsedDay = Number(dayOfWeek);

    if (
      !Number.isInteger(parsedDay) ||
      parsedDay < 0 ||
      parsedDay > 6
    ) {
      return res.status(400).json({
        success: false,
        message:
          "dayOfWeek must be a number between 0 and 6",
      });
    }

    // Validate time
    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message:
          "Start time must be earlier than end time",
      });
    }

    // Make sure this availability belongs to
    // the currently logged-in provider
    const availability =
      await prisma.availability.findFirst({
        where: {
          id,
          providerId: provider.id,
        },
      });

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: "Availability not found",
      });
    }

    // Update availability
    const updatedAvailability =
      await prisma.availability.update({
        where: {
          id: availability.id,
        },
        data: {
          dayOfWeek: parsedDay,
          startTime,
          endTime,
        },
      });

    // Clear cached availability
    await deleteCache(
      `provider:availability:${provider.id}`
    );

    return res.status(200).json({
      success: true,
      message: "Availability updated successfully",
      data: updatedAvailability,
    });
  } catch (error) {
    console.error(
      "Update provider availability error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while updating availability",
    });
  }
};





export {
  createAvailability,
  getProviderAvailability,
  getMyProviderAvailability,
  createMyProviderAvailability,
  updateMyProviderAvailability,
};

