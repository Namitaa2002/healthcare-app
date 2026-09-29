
import { Server } from "socket.io";

let io;

// =========================================
// USER ROOM HELPER
// =========================================

const getUserRoom = (userId) => `user:${userId}`;

// =========================================
// INITIALIZE SOCKET
// =========================================

const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // =========================================
    // JOIN USER ROOM
    // =========================================

    socket.on("join-user", (userId, callback) => {
      if (!userId) {
        console.log(
          "join-user received without userId"
        );

        if (typeof callback === "function") {
          callback({
            success: false,
            message: "userId is required",
          });
        }

        return;
      }

      const roomName = getUserRoom(userId);

      socket.join(roomName);

      console.log(
        `User ${userId} joined their socket room`
      );

      console.log(
        "Socket rooms:",
        [...socket.rooms]
      );

      if (typeof callback === "function") {
        callback({
          success: true,
          room: roomName,
        });
      }
    });

    // =========================================
    // LEAVE USER ROOM
    // =========================================

    socket.on("leave-user", (userId) => {
      if (!userId) {
        return;
      }

      const roomName = getUserRoom(userId);

      socket.leave(roomName);

      console.log(
        `User ${userId} left their socket room`
      );
    });

    // =========================================
    // JOIN CONVERSATION ROOM
    // =========================================

    socket.on(
      "join-conversation",
      (conversationId) => {
        if (!conversationId) {
          return;
        }

        const roomName =
          `conversation:${conversationId}`;

        socket.join(roomName);

        console.log(
          `Socket ${socket.id} joined conversation ${conversationId}`
        );
      }
    );

    // =========================================
    // LEAVE CONVERSATION ROOM
    // =========================================

    socket.on(
      "leave-conversation",
      (conversationId) => {
        if (!conversationId) {
          return;
        }

        const roomName =
          `conversation:${conversationId}`;

        socket.leave(roomName);

        console.log(
          `Socket ${socket.id} left conversation ${conversationId}`
        );
      }
    );

    // =========================================
    // AUDIO / VIDEO CALL
    // WEBRTC SIGNALING
    // =========================================

    // -----------------------------------------
    // CALL USER
    // Caller -> Receiver
    // -----------------------------------------

    socket.on(
      "call-user",
      ({
        to,
        callId,
        callType,
        offer,
        caller,
      } = {}) => {
        if (
          !to ||
          !callId ||
          !callType ||
          !offer
        ) {
          console.log(
            "Invalid call-user request"
          );

          return;
        }

        const targetRoom = getUserRoom(to);

        console.log(
          `Call started: ${caller?.id || "unknown"} -> ${to} (${callType})`
        );

        io.to(targetRoom).emit(
          "incoming-call",
          {
            from: caller?.id || null,
            caller: caller || null,
            callId,
            callType,
            offer,
          }
        );
      }
    );

    // -----------------------------------------
    // ACCEPT CALL
    // Receiver -> Caller
    // -----------------------------------------

    socket.on(
      "accept-call",
      ({
        to,
        callId,
        answer,
      } = {}) => {
        if (
          !to ||
          !callId ||
          !answer
        ) {
          console.log(
            "Invalid accept-call request"
          );

          return;
        }

        const targetRoom = getUserRoom(to);

        console.log(
          `Call accepted: ${to} (${callId})`
        );

        io.to(targetRoom).emit(
          "call-accepted",
          {
            callId,
            answer,
          }
        );
      }
    );

    // -----------------------------------------
    // REJECT CALL
    // Receiver -> Caller
    // -----------------------------------------

    socket.on(
      "reject-call",
      ({
        to,
        callId,
        reason = "Call rejected",
      } = {}) => {
        if (
          !to ||
          !callId
        ) {
          console.log(
            "Invalid reject-call request"
          );

          return;
        }

        const targetRoom = getUserRoom(to);

        console.log(
          `Call rejected: ${to} (${callId})`
        );

        io.to(targetRoom).emit(
          "call-rejected",
          {
            callId,
            reason,
          }
        );
      }
    );

    // -----------------------------------------
    // CALL BUSY
    // Receiver -> Caller
    // -----------------------------------------

    socket.on(
      "call-busy",
      ({
        to,
        callId,
      } = {}) => {
        if (
          !to ||
          !callId
        ) {
          console.log(
            "Invalid call-busy request"
          );

          return;
        }

        const targetRoom = getUserRoom(to);

        console.log(
          `Call busy: ${to} (${callId})`
        );

        io.to(targetRoom).emit(
          "call-busy",
          {
            callId,
          }
        );
      }
    );

    // -----------------------------------------
    // ICE CANDIDATE
    // Both Peers -> Each Other
    // -----------------------------------------

    socket.on(
      "ice-candidate",
      ({
        to,
        callId,
        candidate,
      } = {}) => {
        if (
          !to ||
          !callId ||
          !candidate
        ) {
          console.log(
            "Invalid ice-candidate request"
          );

          return;
        }

        const targetRoom = getUserRoom(to);

        io.to(targetRoom).emit(
          "ice-candidate",
          {
            callId,
            candidate,
          }
        );
      }
    );

    // -----------------------------------------
    // END CALL
    // Both Peers -> Other Peer
    // -----------------------------------------

    socket.on(
      "end-call",
      ({
        to,
        callId,
      } = {}) => {
        if (
          !to ||
          !callId
        ) {
          console.log(
            "Invalid end-call request"
          );

          return;
        }

        const targetRoom = getUserRoom(to);

        console.log(
          `Call ended: ${callId}`
        );

        io.to(targetRoom).emit(
          "call-ended",
          {
            callId,
          }
        );
      }
    );

    // -----------------------------------------
    // CANCEL OUTGOING CALL
    // Caller -> Receiver
    // -----------------------------------------

    socket.on(
      "cancel-call",
      ({
        to,
        callId,
      } = {}) => {
        if (
          !to ||
          !callId
        ) {
          return;
        }

        const targetRoom = getUserRoom(to);

        console.log(
          `Call cancelled: ${callId}`
        );

        io.to(targetRoom).emit(
          "call-cancelled",
          {
            callId,
          }
        );
      }
    );

    // =========================================
    // DISCONNECT
    // =========================================

    socket.on("disconnect", () => {
      console.log(
        "Socket disconnected:",
        socket.id
      );
    });
  });

  return io;
};

// =========================================
// GET SOCKET INSTANCE
// =========================================

export const getIO = () => {
  if (!io) {
    throw new Error(
      "Socket.IO has not been initialized."
    );
  }

  return io;
};

export default initializeSocket;

