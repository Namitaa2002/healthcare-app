import prisma from "../config/prisma.js";

// Create appointment

const createAppointment = async (req, res) => {
  try {
    if (req.user.role !== "PATIENT") {
      return res.status(403).json({
        success: false,
        message: "Only patients can create appointments",
      });
    }

    const {
      providerId,
      serviceId,
      branchId,
      appointmentDate,
      startTime,
      endTime,
      notes,
    } = req.body;

    if (
      !providerId ||
      !serviceId ||
      !branchId ||
      !appointmentDate ||
      !startTime ||
      !endTime
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Provider ID, service ID, branch ID, date, start time and end time are required",
      });
    }

    // Get the patient profile of the logged-in user.
    // The frontend does not need to send patientId anymore.
    const patient = await prisma.patient.findUnique({
      where: {
        userId: req.user.userId,
      },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found",
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

    if (!service.isActive) {
      return res.status(400).json({
        success: false,
        message: "Selected service is not active",
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

    const providerUser = await prisma.user.findUnique({
      where: {
        id: provider.userId,
      },
    });

    if (
      !providerUser ||
      providerUser.branchId !== branchId ||
      service.branchId !== branchId
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider, service or branch combination",
      });
    }

    if (!providerUser.isActive) {
      return res.status(400).json({
        success: false,
        message: "Selected provider is not active",
      });
    }

    if (branch.organizationId !== req.user.organizationId) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot book an appointment outside your organization",
      });
    }

    const providerService = await prisma.providerService.findUnique({
      where: {
        providerId_serviceId: {
          providerId,
          serviceId,
        },
      },
    });

    if (!providerService) {
      return res.status(400).json({
        success: false,
        message:
          "This service is not assigned to the selected provider",
      });
    }

    const appointmentDateObject = new Date(appointmentDate);

    if (Number.isNaN(appointmentDateObject.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment date",
      });
    }

    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time",
      });
    }

    const dayOfWeek = appointmentDateObject.getUTCDay();

    const availability = await prisma.availability.findFirst({
      where: {
        providerId,
        dayOfWeek,
        isActive: true,
      },
    });

    if (!availability) {
      return res.status(400).json({
        success: false,
        message: "Provider is not available on the selected day",
      });
    }

    if (
      startTime < availability.startTime ||
      endTime > availability.endTime
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Selected appointment time is outside provider availability",
      });
    }

    const appointmentDateKey = appointmentDateObject
      .toISOString()
      .slice(0, 10);

    const appointment = await prisma.$transaction(
      async (tx) => {
        // Lock booking operations for this provider and date.
        // PostgreSQL releases this transaction-level lock automatically
        // when the transaction completes.
        await tx.$queryRaw`
          WITH booking_lock AS (
            SELECT pg_advisory_xact_lock(
              hashtext(${providerId}),
              hashtext(${appointmentDateKey})
            )
          )
          SELECT 1 AS locked
        `;

        const existingAppointments = await tx.appointment.findMany({
          where: {
            providerId,
            appointmentDate: appointmentDateObject,
            status: {
              in: ["PENDING", "CONFIRMED"],
            },
          },
          select: {
            id: true,
            startTime: true,
            endTime: true,
          },
        });

        const hasOverlap = existingAppointments.some((appointment) => {
          return (
            startTime < appointment.endTime &&
            endTime > appointment.startTime
          );
        });

        if (hasOverlap) {
          const error = new Error(
            "This appointment slot overlaps with an existing booking"
          );

          error.code = "APPOINTMENT_OVERLAP";

          throw error;
        }

        return tx.appointment.create({
          data: {
            patientId: patient.id,
            providerId,
            serviceId,
            branchId,
            appointmentDate: appointmentDateObject,
            startTime,
            endTime,
            notes: notes || null,
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
                    role: true,
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
                    role: true,
                  },
                },
              },
            },

            service: true,
            branch: true,
          },
        });
      },
      {
        isolationLevel: "Serializable",
      }
    );

    return res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      data: appointment,
    });
  } catch (error) {
    if (error.code === "APPOINTMENT_OVERLAP") {
      return res.status(409).json({
        success: false,
        message:
          "This appointment slot overlaps with an existing booking",
      });
    }

    console.error("Create appointment error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating appointment",
    });
  }
};

// Get available slots for a provider, service and date
const getAvailableSlots = async (req, res) => {
  try {
    const { providerId, serviceId, date } = req.query;

    if (!providerId || !serviceId || !date) {
      return res.status(400).json({
        success: false,
        message: "Provider ID, service ID and date are required",
      });
    }

    // Validate date
    const appointmentDate = new Date(date);

    if (Number.isNaN(appointmentDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment date",
      });
    }

    // Check provider
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

    // Check service
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

    if (!service.isActive) {
      return res.status(400).json({
        success: false,
        message: "Selected service is not active",
      });
    }

    // Make sure provider offers this service
    const providerService = await prisma.providerService.findUnique({
      where: {
        providerId_serviceId: {
          providerId,
          serviceId,
        },
      },
    });

    if (!providerService) {
      return res.status(400).json({
        success: false,
        message: "This service is not assigned to the selected provider",
      });
    }

    // Make sure provider and service belong to the same branch
    const providerUser = await prisma.user.findUnique({
      where: {
        id: provider.userId,
      },
      select: {
        branchId: true,
        isActive: true,
      },
    });

    if (
      !providerUser ||
      !providerUser.isActive ||
      providerUser.branchId !== service.branchId
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider and service combination",
      });
    }

    // Get provider availability for selected day
    const dayOfWeek = appointmentDate.getUTCDay();

    const availability = await prisma.availability.findMany({
      where: {
        providerId,
        dayOfWeek,
        isActive: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    if (availability.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No availability for the selected date",
        data: [],
      });
    }

    // Get already booked appointments
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        providerId,
        appointmentDate,
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    const serviceDuration = Number(service.duration);

    if (!serviceDuration || serviceDuration <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid service duration",
      });
    }

    const timeToMinutes = (time) => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const minutesToTime = (minutes) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;

      return `${String(hours).padStart(2, "0")}:${String(mins).padStart(
        2,
        "0"
      )}`;
    };

    const isOverlapping = (startTime, endTime) => {
      return existingAppointments.some((appointment) => {
        return (
          startTime < timeToMinutes(appointment.endTime) &&
          endTime > timeToMinutes(appointment.startTime)
        );
      });
    };

    const slots = [];

    for (const window of availability) {
      const availabilityStart = timeToMinutes(window.startTime);
      const availabilityEnd = timeToMinutes(window.endTime);

      for (
        let currentStart = availabilityStart;
        currentStart + serviceDuration <= availabilityEnd;
        currentStart += serviceDuration
      ) {
        const currentEnd = currentStart + serviceDuration;

        const startTime = minutesToTime(currentStart);
        const endTime = minutesToTime(currentEnd);

        if (!isOverlapping(currentStart, currentEnd)) {
          slots.push({
            startTime,
            endTime,
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Available slots fetched successfully",
      data: slots,
    });
  } catch (error) {
    console.error("Get available slots error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching available slots",
    });
  }
};

// Get logged-in patient's appointments

const getMyAppointments = async (req, res) => {
  try {
    if (req.user.role !== "PATIENT") {
      return res.status(403).json({
        success: false,
        message: "Only patients can view their appointments",
      });
    }

    const patient = await prisma.patient.findUnique({
      where: {
        userId: req.user.userId,
      },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found",
      });
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        patientId: patient.id,
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
              },
            },
          },
        },
        service: true,
        branch: true,
        payment: true,
      },
      orderBy: [
        {
          appointmentDate: "desc",
        },
        {
          startTime: "desc",
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Appointments fetched successfully",
      data: appointments,
    });
  } catch (error) {
    console.error("Get my appointments error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching appointments",
    });
  }
};

// Get appointment by ID

const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: {
        id,
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
                role: true,
                organizationId: true,
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
                role: true,
                organizationId: true,
                branchId: true,
              },
            },
          },
        },
        service: true,
        branch: true,
        payment: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const isPatient =
      req.user.role === "PATIENT" &&
      appointment.patient.userId === req.user.userId;

    const isProvider =
      req.user.role === "PROVIDER" &&
      appointment.provider.userId === req.user.userId;

    const isOrganizationAdmin =
      req.user.role === "ORGANIZATION_ADMIN" &&
      appointment.branch.organizationId === req.user.organizationId;

    const isBranchAdmin =
      req.user.role === "BRANCH_ADMIN" &&
      appointment.branch.id === req.user.branchId;

    if (
      !isPatient &&
      !isProvider &&
      !isOrganizationAdmin &&
      !isBranchAdmin
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this appointment",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Appointment fetched successfully",
      data: appointment,
    });
  } catch (error) {
    console.error("Get appointment error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching appointment",
    });
  }
};

const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: {
        id,
      },
      include: {
        patient: true,
        branch: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Patients can cancel only their own appointments.
    const isPatient =
      req.user.role === "PATIENT" &&
      appointment.patient.userId === req.user.userId;

    // Organization admins can cancel appointments within their organization.
    const isOrganizationAdmin =
      req.user.role === "ORGANIZATION_ADMIN" &&
      appointment.branch.organizationId === req.user.organizationId;

    // Branch admins can cancel appointments within their branch.
    const isBranchAdmin =
      req.user.role === "BRANCH_ADMIN" &&
      appointment.branchId === req.user.branchId;

    if (!isPatient && !isOrganizationAdmin && !isBranchAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to cancel this appointment",
      });
    }

    // A completed, cancelled, or no-show appointment cannot be cancelled again.
    if (
      appointment.status === "CANCELLED" ||
      appointment.status === "COMPLETED" ||
      appointment.status === "NO_SHOW"
    ) {
      return res.status(400).json({
        success: false,
        message: `Appointment cannot be cancelled because its current status is ${appointment.status}`,
      });
    }

    const cancelledAppointment = await prisma.appointment.update({
      where: {
        id,
      },
      data: {
        status: "CANCELLED",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
      data: cancelledAppointment,
    });
  } catch (error) {
    console.error("Cancel appointment error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while cancelling appointment",
    });
  }
};

// Delete appointment

const deleteAppointment = async (req, res) => {
  try {
    if (
      req.user.role !== "ORGANIZATION_ADMIN" &&
      req.user.role !== "BRANCH_ADMIN"
    ) {
      return res.status(403).json({
        success: false,
        message: "Only admins can delete appointments",
      });
    }

    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: {
        id,
      },
      include: {
        branch: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (
      req.user.role === "ORGANIZATION_ADMIN" &&
      appointment.branch.organizationId !== req.user.organizationId
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this appointment",
      });
    }

    if (
      req.user.role === "BRANCH_ADMIN" &&
      appointment.branchId !== req.user.branchId
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this appointment",
      });
    }

    await prisma.appointment.delete({
      where: {
        id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Appointment deleted successfully",
    });
  } catch (error) {
    console.error("Delete appointment error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting appointment",
    });
  }
};

// Get all appointments for Organization Admin / Branch Admin

const getAllAppointments = async (req, res) => {
  try {
    if (
      req.user.role !== "ORGANIZATION_ADMIN" &&
      req.user.role !== "BRANCH_ADMIN"
    ) {
      return res.status(403).json({
        success: false,
        message: "Only admins can view all appointments",
      });
    }

    const where = {};

    // Organization Admin → all appointments
    // belonging to their organization
    if (req.user.role === "ORGANIZATION_ADMIN") {
      where.branch = {
        organizationId: req.user.organizationId,
      };
    }

    // Branch Admin → only appointments
    // belonging to their branch
    if (req.user.role === "BRANCH_ADMIN") {
      where.branchId = req.user.branchId;
    }

    const appointments = await prisma.appointment.findMany({
      where,

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

        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
          },
        },

        branch: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
          },
        },

        payment: {
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            stripePaymentIntentId: true,
            stripeCheckoutId: true,
            createdAt: true,
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
    });

    return res.status(200).json({
      success: true,
      message: "Appointments fetched successfully",
      data: appointments,
    });
  } catch (error) {
    console.error("Get all appointments error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching appointments",
    });
  }
};

const getMyProviderAppointments = async (req, res) => {
  try {
    if (req.user.role !== "PROVIDER") {
      return res.status(403).json({
        success: false,
        message: "Only providers can view their appointments",
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

    const appointments = await prisma.appointment.findMany({
      where: {
        providerId: provider.id,
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
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            stripePaymentIntentId: true,
            stripeCheckoutId: true,
          },
        },
      },
      orderBy: [
        {
          appointmentDate: "asc",
        },
        {
          startTime: "asc",
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Provider appointments fetched successfully",
      data: appointments,
    });
  } catch (error) {
    console.error(
      "Get provider appointments error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching provider appointments",
    });
  }
};

export {
  createAppointment,
  getMyAppointments,
  getMyProviderAppointments,
  getAppointmentById,
  cancelAppointment,
  deleteAppointment,
  getAvailableSlots,
  getAllAppointments,
};