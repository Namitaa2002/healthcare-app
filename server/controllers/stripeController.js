import prisma from "../config/prisma.js";

import stripe from "../config/stripe.js";

import env from "../config/env.js";

// =========================================
// CREATE STRIPE CONNECTED ACCOUNT
// =========================================

const createConnectedAccount = async (req, res) => {
  try {
    const { providerId } = req.body;

    if (!providerId) {
      return res.status(400).json({
        success: false,
        message: "Provider ID is required",
      });
    }

    const provider = await prisma.provider.findUnique({
      where: {
        id: providerId,
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

    // Prevent duplicate Stripe accounts
    if (provider.stripeAccountId) {
      return res.status(409).json({
        success: false,
        message: "Stripe account already exists for this provider",
      });
    }

    // Create Stripe connected account
    const account = await stripe.v2.core.accounts.create({
      display_name: provider.user.name,
      contact_email: provider.user.email,
      dashboard: "express",

      defaults: {
        responsibilities: {
          fees_collector: "application",
          losses_collector: "application",
        },
      },

      // Providers are based in India
      identity: {
        country: "IN",
        entity_type: "individual",
      },

      // Request recipient capability
      configuration: {
        recipient: {
          capabilities: {
            stripe_balance: {
              stripe_transfers: {
                requested: true,
              },
            },
          },
        },
      },
    });

    // Save Stripe account in database
    await prisma.provider.update({
      where: {
        id: providerId,
      },
      data: {
        stripeAccountId: account.id,
        stripeAccountStatus: "PENDING",
      },
    });

    return res.status(201).json({
      success: true,
      message: "Stripe connected account created successfully",
      data: {
        providerId,
        stripeAccountId: account.id,
        status: "PENDING",
      },
    });
  } catch (error) {
    console.error("Create Stripe account error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating Stripe account",
    });
  }
};

// =========================================
// CREATE STRIPE ONBOARDING LINK
// =========================================

const createOnboardingLink = async (req, res) => {
  try {
    const { providerId } = req.body;

    if (!providerId) {
      return res.status(400).json({
        success: false,
        message: "Provider ID is required",
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

    if (!provider.stripeAccountId) {
      return res.status(400).json({
        success: false,
        message: "Stripe connected account not found",
      });
    }

    /*
      Provider will complete Stripe onboarding here.

      After Stripe onboarding:
      - return URL takes provider back to Providers page
      - refresh URL generates a fresh onboarding link
    */

    const returnUrl =
      `http://localhost:5173/admin/providers?stripe=return&providerId=${providerId}`;

    const refreshUrl =
      `http://localhost:5173/admin/providers?stripe=refresh&providerId=${providerId}`;

    const accountLink = await stripe.accountLinks.create({
      account: provider.stripeAccountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    return res.status(200).json({
      success: true,
      message: "Stripe onboarding link created successfully",
      data: {
        url: accountLink.url,
      },
    });
  } catch (error) {
    console.error("Create onboarding link error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating onboarding link",
    });
  }
};

// =========================================
// CREATE STRIPE CHECKOUT SESSION
// =========================================

const createCheckoutSession = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: "Appointment ID is required",
      });
    }

    // =========================================
    // GET APPOINTMENT
    // =========================================

    const appointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
      },

      include: {
        patient: {
          include: {
            user: true,
          },
        },

        provider: true,

        service: true,

        payment: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // =========================================
    // PATIENT OWNERSHIP CHECK
    // =========================================

    if (
      req.user.role !== "PATIENT" ||
      appointment.patient.userId !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to make payment for this appointment",
      });
    }

    // =========================================
    // APPOINTMENT STATUS CHECK
    // =========================================

    if (appointment.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Cancelled appointment cannot be paid",
      });
    }

    // =========================================
    // DUPLICATE PAYMENT CHECK
    // =========================================

    if (appointment.payment?.status === "PAID") {
      return res.status(400).json({
        success: false,
        message: "Appointment is already paid",
      });
    }

    // =========================================
    // DEMO STRIPE ACCOUNT
    // =========================================
    //
    // For now, all selected doctors use the
    // already-connected Stripe account.
    //
    // The selected doctor is still saved in the
    // appointment.
    //
    // Only the Stripe destination account is shared
    // for this demo setup.
    //

    const stripeAccountId =
      env.stripeDemoConnectedAccountId;

    if (!stripeAccountId) {
      return res.status(500).json({
        success: false,
        message:
          "Demo Stripe connected account is not configured",
      });
    }

    // =========================================
    // SERVICE FEE
    // =========================================
    //
    // IMPORTANT:
    // Fee always comes from the database.
    //
    // Admin -> Services -> Service Price
    //
    // Frontend cannot change the payment amount.
    //

    const amount = Math.round(
      Number(appointment.service.price) * 100
    );

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid service price",
      });
    }

    // =========================================
    // CREATE STRIPE CHECKOUT SESSION
    // =========================================

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "inr",

            product_data: {
              name: appointment.service.name,
            },

            unit_amount: amount,
          },

          quantity: 1,
        },
      ],

      // =========================================
      // DEMO CONNECTED ACCOUNT
      // =========================================

      payment_intent_data: {
        transfer_data: {
          destination: stripeAccountId,
        },
      },

      success_url:
        "http://localhost:5173/payment/success?session_id={CHECKOUT_SESSION_ID}",

      cancel_url:
        `http://localhost:5173/payment/cancel?appointmentId=${appointment.id}`,

      metadata: {
        appointmentId: appointment.id,
      },
    });

    // =========================================
    // SAVE PAYMENT
    // =========================================

    await prisma.payment.upsert({
      where: {
        appointmentId: appointment.id,
      },

      update: {
        amount: appointment.service.price,
        currency: "inr",
        stripeCheckoutId: session.id,
        status: "PENDING",
      },

      create: {
        appointmentId: appointment.id,
        amount: appointment.service.price,
        currency: "inr",
        stripeCheckoutId: session.id,
        status: "PENDING",
      },
    });

    return res.status(201).json({
      success: true,
      message: "Stripe Checkout Session created successfully",

      data: {
        sessionId: session.id,
        checkoutUrl: session.url,
      },
    });
  } catch (error) {
    console.error(
      "Create Checkout Session error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while creating Checkout Session",
    });
  }
};

// =========================================
// GET CONNECTED ACCOUNT STATUS
// =========================================

const getConnectedAccountStatus = async (req, res) => {
  try {
    const { providerId } = req.params;

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

    if (!provider.stripeAccountId) {
      return res.status(200).json({
        success: true,
        message: "Stripe account is not connected",

        data: {
          providerId,
          stripeAccountId: null,
          status: "NOT_CONNECTED",
        },
      });
    }

    // Get latest Stripe account information
    const account =
      await stripe.v2.core.accounts.retrieve(
        provider.stripeAccountId
      );

    /*
      Recipient configuration means the account
      has been enabled for receiving transfers.
    */

    const status =
      account.applied_configurations?.includes("recipient")
        ? "ENABLED"
        : "PENDING";

    // Sync status to database
    await prisma.provider.update({
      where: {
        id: providerId,
      },

      data: {
        stripeAccountStatus: status,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Stripe account status fetched successfully",

      data: {
        providerId,
        stripeAccountId: provider.stripeAccountId,
        status,
      },
    });
  } catch (error) {
    console.error(
      "Get Stripe account status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching Stripe account status",
    });
  }
};

// =========================================
// STRIPE WEBHOOK
// =========================================

const handleStripeWebhook = async (req, res) => {
  const signature = req.headers["stripe-signature"];

  try {
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      env.stripeWebhookSecret
    );

    console.log(
      "Stripe webhook received:",
      event.type
    );

    // =========================================
    // CHECKOUT COMPLETED
    // =========================================

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const appointmentId =
        session.metadata?.appointmentId;

      if (!appointmentId) {
        return res.status(400).json({
          success: false,
          message:
            "Appointment ID not found in Stripe session",
        });
      }

      // =========================================
      // FIND LOCAL PAYMENT
      // =========================================

      const payment =
        await prisma.payment.findUnique({
          where: {
            appointmentId,
          },
        });

      if (!payment) {
        console.error(
          `Payment record not found for appointment: ${appointmentId}`
        );

        return res.status(404).json({
          success: false,
          message: "Payment record not found",
        });
      }

      // =========================================
      // IDEMPOTENCY
      // =========================================

      if (payment.status !== "PAID") {
        await prisma.payment.update({
          where: {
            appointmentId,
          },

          data: {
            status: "PAID",

            stripePaymentIntentId:
              session.payment_intent,
          },
        });
      }

      // =========================================
      // FIND APPOINTMENT
      // =========================================

      const appointment =
        await prisma.appointment.findUnique({
          where: {
            id: appointmentId,
          },
        });

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }

      // =========================================
      // CONFIRM APPOINTMENT
      // =========================================

      if (
        appointment.paymentStatus !== "PAID" ||
        appointment.status !== "CONFIRMED"
      ) {
        await prisma.appointment.update({
          where: {
            id: appointmentId,
          },

          data: {
            paymentStatus: "PAID",
            status: "CONFIRMED",
          },
        });
      }

      console.log(
        `Payment completed for appointment: ${appointmentId}`
      );
    }

    return res.status(200).json({
      received: true,
    });
  } catch (error) {
    console.error(
      "Stripe webhook verification error:",
      error.message
    );

    return res.status(400).json({
      success: false,
      message: "Invalid Stripe webhook",
    });
  }
};

// =========================================
// EXPORTS
// =========================================

export {
  createConnectedAccount,
  createOnboardingLink,
  createCheckoutSession,
  handleStripeWebhook,
  getConnectedAccountStatus,
};