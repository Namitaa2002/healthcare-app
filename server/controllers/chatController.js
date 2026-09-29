import prisma from "../config/prisma.js";
import { getIO } from "../socket.js";

// =========================================
// GET OR CREATE CONVERSATION
// =========================================

export const getOrCreateConversation = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { userId: otherUserId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({
        success: false,
        message: "Other user ID is required.",
      });
    }

    if (currentUserId === otherUserId) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot create a conversation with yourself.",
      });
    }

    const otherUser = await prisma.user.findUnique({
      where: {
        id: otherUserId,
      },

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (!otherUser.isActive) {
      return res.status(400).json({
        success: false,
        message: "This user is inactive.",
      });
    }

    const existingConversation =
      await prisma.conversation.findFirst({
        where: {
          AND: [
            {
              participants: {
                some: {
                  userId: currentUserId,
                },
              },
            },
            {
              participants: {
                some: {
                  userId: otherUserId,
                },
              },
            },
          ],
        },

        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
        },
      });

    if (existingConversation) {
      return res.status(200).json({
        success: true,
        data: existingConversation,
      });
    }

    const conversation =
      await prisma.conversation.create({
        data: {
          participants: {
            create: [
              {
                userId: currentUserId,
              },
              {
                userId: otherUserId,
              },
            ],
          },
        },

        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
        },
      });

    return res.status(201).json({
      success: true,
      message:
        "Conversation created successfully.",
      data: conversation,
    });
  } catch (error) {
    console.error(
      "Get or create conversation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to create or load conversation.",
    });
  }
};

// =========================================
// GET MY CONVERSATIONS
// =========================================

export const getMyConversations = async (req, res) => {
  try {
    const currentUserId = req.user.userId;

    const conversations =
      await prisma.conversation.findMany({
        where: {
          participants: {
            some: {
              userId: currentUserId,
            },
          },
        },

        orderBy: {
          updatedAt: "desc",
        },

        include: {
          // =====================================
          // PARTICIPANTS
          // =====================================

          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
          },

          // =====================================
          // LATEST MESSAGE
          // =====================================

          messages: {
            orderBy: {
              createdAt: "desc",
            },

            take: 1,

            select: {
              id: true,
              senderId: true,
              content: true,
              messageType: true,
              attachmentUrl: true,
              attachmentName: true,
              attachmentType: true,
              attachmentSize: true,
              isRead: true,
              createdAt: true,
            },
          },
        },
      });

    // =========================================
    // ADD UNREAD COUNT
    // =========================================

    const conversationsWithUnreadCount =
      await Promise.all(
        conversations.map(
          async (conversation) => {
            const unreadCount =
              await prisma.message.count({
                where: {
                  conversationId:
                    conversation.id,

                  senderId: {
                    not: currentUserId,
                  },

                  isRead: false,
                },
              });

            const latestMessage =
              conversation.messages?.[0] ||
              null;

            return {
              ...conversation,

              latestMessage,

              unreadCount,
            };
          }
        )
      );

    return res.status(200).json({
      success: true,
      data: conversationsWithUnreadCount,
    });
  } catch (error) {
    console.error(
      "Get conversations error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load conversations.",
    });
  }
};

// =========================================
// GET CHAT MESSAGES
// =========================================

export const getConversationMessages = async (
  req,
  res
) => {
  try {
    const currentUserId = req.user.userId;
    const { conversationId } = req.params;

    // =========================================
    // CHECK CONVERSATION ACCESS
    // =========================================

    const conversation =
      await prisma.conversation.findFirst({
        where: {
          id: conversationId,

          participants: {
            some: {
              userId: currentUserId,
            },
          },
        },
      });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    // =========================================
    // GET MESSAGES
    // =========================================

    const messages =
      await prisma.message.findMany({
        where: {
          conversationId,
        },

        orderBy: {
          createdAt: "asc",
        },

        include: {
          sender: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

    return res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error(
      "Get conversation messages error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load messages.",
    });
  }
};

// =========================================
// SEND TEXT MESSAGE
// =========================================

export const sendMessage = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { conversationId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Message content is required.",
      });
    }

    // =========================================
    // CHECK CONVERSATION ACCESS
    // =========================================

    const conversation =
      await prisma.conversation.findFirst({
        where: {
          id: conversationId,

          participants: {
            some: {
              userId: currentUserId,
            },
          },
        },

        include: {
          participants: true,
        },
      });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    // =========================================
    // CREATE MESSAGE
    // =========================================

    const message =
      await prisma.message.create({
        data: {
          conversationId,

          senderId: currentUserId,

          content: content.trim(),

          messageType: "TEXT",
        },

        include: {
          sender: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

    // =========================================
    // UPDATE CONVERSATION TIME
    // =========================================

    await prisma.conversation.update({
      where: {
        id: conversationId,
      },

      data: {
        updatedAt: new Date(),
      },
    });

    // =========================================
    // SOCKET EVENT
    // =========================================

    const io = getIO();

    // Send message to everyone currently
    // inside the conversation.

    io.to(
      `conversation:${conversationId}`
    ).emit(
      "new-message",
      message
    );

    // =========================================
    // NOTIFY OTHER PARTICIPANT
    // =========================================

    const otherParticipant =
      conversation.participants.find(
        (participant) =>
          participant.userId !==
          currentUserId
      );

    if (otherParticipant) {
      console.log(
        "Sending new-chat-message to:",
        `user:${otherParticipant.userId}`
      );

      io.to(
        `user:${otherParticipant.userId}`
      ).emit(
        "new-chat-message",
        message
      );
    }

    return res.status(201).json({
      success: true,
      message:
        "Message sent successfully.",
      data: message,
    });
  } catch (error) {
    console.error(
      "Send message error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to send message.",
    });
  }
};

// =========================================
// SEND FILE / IMAGE / AUDIO MESSAGE
// =========================================

export const sendFileMessage = async (
  req,
  res
) => {
  try {
    const currentUserId = req.user.userId;
    const { conversationId } = req.params;

    // =========================================
    // CHECK FILE
    // =========================================

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "Please select a file to upload.",
      });
    }

    // =========================================
    // CHECK CONVERSATION ACCESS
    // =========================================

    const conversation =
      await prisma.conversation.findFirst({
        where: {
          id: conversationId,

          participants: {
            some: {
              userId: currentUserId,
            },
          },
        },

        include: {
          participants: true,
        },
      });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    const file = req.file;

    // =========================================
    // ATTACHMENT URL
    // =========================================

    const attachmentUrl =
      `/uploads/${file.filename}`;

    // =========================================
    // DETECT MESSAGE TYPE
    // =========================================

    const isImage =
      file.mimetype.startsWith(
        "image/"
      );

    const isAudio =
      file.mimetype.startsWith(
        "audio/"
      );

    let messageType = "FILE";

    if (isImage) {
      messageType = "IMAGE";
    } else if (isAudio) {
      messageType = "AUDIO";
    }

    // =========================================
    // CREATE MESSAGE
    // =========================================

    const message =
      await prisma.message.create({
        data: {
          conversationId,

          senderId: currentUserId,

          content: null,

          messageType,

          attachmentUrl,

          attachmentName:
            file.originalname,

          attachmentType:
            file.mimetype,

          attachmentSize:
            file.size,
        },

        include: {
          sender: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

    // =========================================
    // UPDATE CONVERSATION TIME
    // =========================================

    await prisma.conversation.update({
      where: {
        id: conversationId,
      },

      data: {
        updatedAt: new Date(),
      },
    });

    // =========================================
    // SOCKET EVENT
    // =========================================

    const io = getIO();

    // Send file/image/audio message to
    // everyone currently inside conversation.

    io.to(
      `conversation:${conversationId}`
    ).emit(
      "new-message",
      message
    );

    // =========================================
    // NOTIFY OTHER PARTICIPANT
    // =========================================

    const otherParticipant =
      conversation.participants.find(
        (participant) =>
          participant.userId !==
          currentUserId
      );

    if (otherParticipant) {
      console.log(
        "Sending new-chat-message to:",
        `user:${otherParticipant.userId}`
      );

      io.to(
        `user:${otherParticipant.userId}`
      ).emit(
        "new-chat-message",
        message
      );
    }

    // =========================================
    // RESPONSE
    // =========================================

    return res.status(201).json({
      success: true,
      message:
        "File sent successfully.",
      data: message,
    });
  } catch (error) {
    console.error(
      "Send file message error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to send file.",
    });
  }
};

// =========================================
// MARK CONVERSATION MESSAGES AS READ
// =========================================

export const markConversationAsRead = async (
  req,
  res
) => {
  try {
    const currentUserId = req.user.userId;
    const { conversationId } = req.params;

    // =========================================
    // CHECK CONVERSATION ACCESS
    // =========================================

    const conversation =
      await prisma.conversation.findFirst({
        where: {
          id: conversationId,

          participants: {
            some: {
              userId: currentUserId,
            },
          },
        },
      });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    // =========================================
    // MARK INCOMING MESSAGES AS READ
    // =========================================

    await prisma.message.updateMany({
      where: {
        conversationId,

        senderId: {
          not: currentUserId,
        },

        isRead: false,
      },

      data: {
        isRead: true,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Conversation messages marked as read.",
    });
  } catch (error) {
    console.error(
      "Mark conversation as read error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update message status.",
    });
  }
};