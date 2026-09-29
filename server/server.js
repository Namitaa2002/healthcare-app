import http from "http";

import app from "./app.js";
import env from "./config/env.js";
import prisma from "./config/prisma.js";
import initializeSocket from "./socket.js";

const startServer = async () => {
  try {
    await prisma.$connect();

    console.log(
      "PostgreSQL connected successfully"
    );

    // Create HTTP server using Express app
    const httpServer = http.createServer(app);

    // Initialize Socket.IO
    initializeSocket(httpServer);

    httpServer.listen(env.port, () => {
      console.log(
        `Server running on http://localhost:${env.port}`
      );

      console.log(
        "Socket.IO server initialized"
      );
    });
  } catch (error) {
    console.error(
      "Database connection failed:",
      error
    );

    process.exit(1);
  }
};

startServer();