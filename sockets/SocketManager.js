const socketIo = require("socket.io");
const User = require("../models/User.model");

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
    socket.on("NetworkJoin", (data) => {
      io.emit("NetworkJoin", data);
    });
    socket.on("SendMessage", async (message) => {
      console.log("📨 Message received:", message);
      await User.findByIdAndUpdate(
        message.sender,
        {
          $push: { rAInChat: message }, // ✅ Fix the structure
        },
        { new: true }
      );

      if (message.text.includes("Yes")) {
        const updatedUser = await User.findByIdAndUpdate(
          message.sender,
          {
            $push: {
              rAInChat: {
                role: "AI",
                text: `I first would like to know your objectives and how long you're around for today ? and Do you mind if I analyse and then potentially ask a few more questions to help get the best connections in the Network?`,
                timestamp: new Date(),
              },
            },
          },
          { new: true }
        );
        if (global.activeUsers.has(message.sender)) {
          const userSocket = global.activeUsers.get(message.sender);

          io.to(userSocket).emit("receiveMessage", updatedUser);
        }
      }
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
