const socketIo = require("socket.io");

// Initialize Socket.IO and handle events
const initializeSocket = (server) => {
  const io = socketIo(server);

  // Store active users
  global.activeUsers = new Map();

  io.on("connection", (socket) => {
    // Register user
    socket.on("registerUser", (userId) => {
      global.activeUsers.set(userId, socket.id);
    });

    // Broadcast new notification
    socket.on("newNotification", (data) => {
      io.emit("newNotification", data);
    });

    // Handle user disconnect
    socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.id);
      for (let [key, value] of global.activeUsers.entries()) {
        if (value === socket.id) {
          global.activeUsers.delete(key);
        }
      }
    });
  });

  return io;
};

module.exports = initializeSocket;
