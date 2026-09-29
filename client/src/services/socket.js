
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  autoConnect: false,
  withCredentials: true,
});

socket.on("connect", () => {
  console.log(
    "Socket connected:",
    socket.id
  );
});

socket.on("disconnect", (reason) => {
  console.log(
    "Socket disconnected:",
    reason
  );
});

socket.on("connect_error", (error) => {
  console.error(
    "Socket connection error:",
    error.message
  );

  console.error(
    "Socket connection error details:",
    error
  );
});

export default socket;

