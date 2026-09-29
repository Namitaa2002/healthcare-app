import prisma from "../config/prisma.js";

export const createNotification = async ({
  userId,
  title,
  message,
  type,
}) => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
      },
    });
  } catch (error) {
    console.error(
      "Create notification error:",
      error
    );
  }
};