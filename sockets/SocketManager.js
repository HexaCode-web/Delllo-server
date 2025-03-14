const socketIo = require("socket.io");
const User = require("../models/User.model");
const MeetRequest = require("../models/MeetRequest.model");
const Notification = require("../models/Notification.model");

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

    socket.on("joinRoom", async (meetRequestID, UserPlace) => {
      try {
        // Join the room
        socket.join(meetRequestID);
        console.log(`User ${UserPlace} joined room: ${meetRequestID}`);

        // Find the MeetRequest document
        const meetRequest = await MeetRequest.findById(meetRequestID);
        if (!meetRequest) {
          console.error("MeetRequest not found");
          return;
        }

        // Determine the other user's ID
        const otherUserID =
          UserPlace === "UserIDA" ? meetRequest.userIDB : meetRequest.userIDA;
        console.log("otherUserID", otherUserID);

        // Update the seen status for messages sent by the other user
        const updatedConversation = meetRequest.Conversation.map((message) => {
          if (message.senderID === otherUserID && !message.seen) {
            console.log("message", message);
            return { ...message, seen: true }; // Mark as seen
          }
          return message; // Leave other messages unchanged
        });

        // Update the MeetRequest document with the new Conversation and isAinRoom/isBinRoom status
        meetRequest.Conversation = updatedConversation;
        meetRequest.markModified("Conversation"); // Explicitly mark the array as modified

        // Set isAinRoom or isBinRoom based on UserPlace
        if (UserPlace === "UserIDA") {
          meetRequest.isAinRoom = true;
        } else {
          meetRequest.isBinRoom = true;
        }

        // Save the updated document
        await meetRequest.save();

        console.log(
          `Updated seen status for messages in room: ${meetRequestID}`
        );
      } catch (error) {
        console.error("Error in joinRoom handler:", error);
      }
    });
    socket.on("leaveRoom", async (meetRequestID, UserPlace) => {
      console.log(`User ${UserPlace} left room: ${meetRequestID} `);
      if (UserPlace === "UserIDA") {
        await MeetRequest.findByIdAndUpdate(
          meetRequestID,
          {
            isAinRoom: false,
          },
          { new: true }
        );
      } else {
        await MeetRequest.findByIdAndUpdate(
          meetRequestID,
          {
            isBinRoom: false,
          },
          { new: true }
        );
      }
    });
    socket.on("sendMessage", async (data) => {
      console.log("📨 Message received:", data);

      const { meetRequestID, senderID, message } = data;

      // Update the MeetRequest object with the new message
      const meetRequest = await MeetRequest.findById(meetRequestID);
      const otherUserID =
        meetRequest.userIDA.toString() === senderID
          ? meetRequest.userIDB
          : meetRequest.userIDA;
      const otherUser = await User.findById(otherUserID);
      const sender = await User.findById(senderID);
      const senderName = `${sender.FirstName} ${sender.LastName}`;
      const lastActive = otherUser.updatedAt;
      const isActive = lastActive >= new Date(Date.now() - 1000 * 60);
      let isOtherUserActive = false;
      if (isActive) {
        isOtherUserActive =
          meetRequest.userIDA.toString() === senderID
            ? meetRequest.isBinRoom
            : meetRequest.isAinRoom;
      }

      if (meetRequest && meetRequest.meetResponse === "accepted") {
        meetRequest.Conversation.push({
          senderID,
          message,
          seen: isOtherUserActive,
        });

        await meetRequest.save();

        // Emit the message to the room
        io.to(meetRequestID).emit("receiveMessage", {
          senderID,
          message,
          seen: isOtherUserActive,
          timestamp: new Date(),
        });
      }
      if (!isOtherUserActive) {
        if (global.activeUsers.has(otherUserID)) {
          const userSocket = global.activeUsers.get(otherUserID);

          // Emit real-time notification
          io.to(userSocket).emit("newNotification", {
            type: "Message",
            message: `${senderName}: ${message}`,
            metadata: {
              senderID: sender._id,
              senderName,
              message,
              requestId: meetRequest._id,
              seen: false,
            },
          });

          // Create notification in the database
          await Notification.create({
            userId: otherUserID,
            type: "Message",
            message: `${senderName}: ${message}`,
            metadata: {
              senderID: sender._id,
              senderName,
              requestId: meetRequest._id,
            },
            seen: false,
          });
        } else {
          // Create notification in the database (no real-time update)
          await Notification.create({
            userId: otherUserID,
            type: "Message",
            message: `${senderName}: ${message}`,
            metadata: {
              senderID: sender._id,
              senderName,
              requestId: meetRequest._id,
            },
            seen: false,
          });
        }
      }
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

          io.to(userSocket).emit("receiveBotMessage", updatedUser);
        }
      }
    });
    // Handle user disconnect
    socket.on("disconnect", () => {
      for (let [key, value] of global.activeUsers.entries()) {
        if (value === socket.id) {
          console.log("A user disconnected:", value);
          global.activeUsers.delete(key);
        }
      }
    });
  });

  return io;
};

module.exports = initializeSocket;
