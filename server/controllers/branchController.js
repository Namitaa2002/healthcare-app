import prisma from "../config/prisma.js";

// Get all branches for the logged-in organization
const getBranches = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "Organization ID is missing",
      });
    }

    const branches = await prisma.branch.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        name: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Branches fetched successfully",
      data: branches,
    });
  } catch (error) {
    console.error("Get branches error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching branches",
    });
  }
};

// Create a new branch
const createBranch = async (req, res) => {
  try {
    const {
      name,
      address,
      city,
      state,
      country,
      phone,
    } = req.body;

    const organizationId = req.user.organizationId;

    if (!organizationId || !name) {
      return res.status(400).json({
        success: false,
        message: "Organization ID and branch name are required",
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

    const branch = await prisma.branch.create({
      data: {
        organizationId,
        name: name.trim(),
        address: address || null,
        city: city || null,
        state: state || null,
        country: country || null,
        phone: phone || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Branch created successfully",
      data: branch,
    });
  } catch (error) {
    console.error("Create branch error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating branch",
    });
  }
};

// Update a branch
const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      address,
      city,
      state,
      country,
      phone,
    } = req.body;

    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "Organization ID is missing",
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Branch ID is required",
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Branch name is required",
      });
    }

    // Make sure the branch belongs to this organization
    const existingBranch = await prisma.branch.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!existingBranch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    const updatedBranch = await prisma.branch.update({
      where: {
        id,
      },
      data: {
        name: name.trim(),
        address: address?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        country: country?.trim() || null,
        phone: phone?.trim() || null,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Branch updated successfully",
      data: updatedBranch,
    });
  } catch (error) {
    console.error("Update branch error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating branch",
    });
  }
};

// Delete a branch
const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;

    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "Organization ID is missing",
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Branch ID is required",
      });
    }

    // Make sure the branch belongs to this organization
    const existingBranch = await prisma.branch.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!existingBranch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    await prisma.branch.delete({
      where: {
        id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Branch deleted successfully",
    });
  } catch (error) {
    console.error("Delete branch error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Unable to delete branch. It may have related records.",
    });
  }
};

export {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
};