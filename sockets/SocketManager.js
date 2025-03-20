const socketIo = require("socket.io");
const User = require("../models/User.model");
const MeetRequest = require("../models/MeetRequest.model");
const Notification = require("../models/Notification.model");
const socketClient = require("socket.io-client");
const flaskSocket = socketClient("ws://127.0.0.1:5000"); // Ensure WebSocket connection

flaskSocket.on("connect", () => {
  console.log("✅ Connected to Flask WebSocket!");
});

flaskSocket.on("disconnect", () => {
  console.log("❌ Disconnected from Flask WebSocket.");
});

// Initialize Socket.IO and handle events
const initializeSocket = (server) => {
  const io = socketIo(server);
  flaskSocket.on("connect_error", (err) => {
    io.emit("AI-connection-error", "Error connecting to AI");
    console.error("❌ Flask WebSocket Connection Error:", err.message);
  });

  // Store active users
  global.activeUsers = new Map();

  // Set up listeners for matchmaking events from Flask
  flaskSocket.on("matchmaking_progress", (data) => {
    console.log(
      `📊 Match progress: ${data.progress.current}/${data.progress.total} for user ${data.userId}`
    );

    if (global.activeUsers.has(data.userId)) {
      const userSocket = global.activeUsers.get(data.userId);
      io.to(userSocket).emit("matchmaking_progress", data);
    }
  });

  flaskSocket.on("matchmaking_complete", (data) => {
    console.log(
      `✅ Matchmaking complete for user ${data.userId} with ${data.matches.length} matches`
    );

    if (global.activeUsers.has(data.userId)) {
      const userSocket = global.activeUsers.get(data.userId);
      io.to(userSocket).emit("matchmaking_complete", data);
    }
  });

  io.on("connection", (socket) => {
    // Register user
    socket.on("registerUser", (userId) => {
      global.activeUsers.set(userId, socket.id);
      console.log(`👤 User registered: ${userId} with socket ID: ${socket.id}`);
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

    socket.on("SendMessageToBot", async (message) => {
      console.log("📨Rain Message received:", message);
      const messageSender = message.sender;

      console.log("🔥 Sending user message to Flask with chat history");

      await User.findByIdAndUpdate(
        messageSender,
        {
          $push: { rAInChat: message },
        },
        { new: true }
      );

      if (message.text === "Yes") {
        const updatedUser = await User.findByIdAndUpdate(
          messageSender,
          {
            $push: {
              rAInChat: {
                role: "AI",
                text: `I first would like to know your objectives and how long you're around for today? Do you mind if I analyse and then potentially ask a few more questions to help get the best connections in the Network?`,
                timestamp: new Date(),
              },
            },
          },
          { new: true }
        );
        if (global.activeUsers.has(messageSender)) {
          const userSocket = global.activeUsers.get(messageSender);
          io.to(userSocket).emit("receiveBotMessage", updatedUser);
        }
      } else {
        const userData = await User.findById(messageSender);
        const chatHistory = userData.rAInChat.slice(-5); // Last 5 messages

        const formattedHistory = chatHistory
          .map((msg) => `${msg.role}: ${msg.text}`)
          .join("\n");
        flaskSocket.emit("chat_request", {
          userId: messageSender,
          message: message.text,
          history: formattedHistory,
        });

        flaskSocket.once("chat_response", async (data) => {
          console.log("🤖 AI Response:", data.answer);
          console.log("🔍 Checking messageSender:", messageSender);

          const updatedUser = await User.findByIdAndUpdate(
            messageSender,
            {
              $push: {
                rAInChat: {
                  role: "AI",
                  text: data.answer,
                  timestamp: new Date(),
                },
              },
            },
            { new: true }
          );
          if (!global.activeUsers.has(messageSender)) {
            console.error("❌ messageSender is NOT in global.activeUsers");
            return;
          }
          const userSocket = global.activeUsers.get(messageSender);
          if (!userSocket) {
            console.error(
              "❌ userSocket is undefined for user:",
              messageSender
            );
            return;
          }

          io.to(userSocket).emit("receiveBotMessage", updatedUser);
        });
      }
    });

    // Enhanced GenerateMatches event handler
    socket.on("GenerateMatches", async (data) => {
      try {
        console.log("🧩 Generate Matches Request:", data.User._id);

        const userId = data.User._id;

        // Notify client that matchmaking has started
        if (global.activeUsers.has(userId)) {
          const userSocket = global.activeUsers.get(userId);
          io.to(userSocket).emit("matchmaking_started", {
            message: "Starting to find your matches...",
            timestamp: new Date(),
          });
        }

        // If profiles aren't provided, fetch them from the database
        if (!data.Profiles || data.Profiles.length === 0) {
          console.log("🔍 No profiles provided, fetching from database");

          // Get user's networks to find relevant profiles
          const user = await User.findById(userId);
          if (!user) {
            throw new Error("User not found");
          }

          // Extract network IDs from joinedNetworks
          const networkIds = user.joinedNetworks.map(
            (network) => network.networkId
          );

          // Find users in the same networks
          const potentialMatches = await User.find({
            _id: { $ne: userId }, // Exclude the requesting user
            "joinedNetworks.networkId": { $in: networkIds }, // Users in same networks
          }).limit(20);

          // Update data with fetched profiles
          data.Profiles = potentialMatches;
          console.log(
            `📊 Found ${potentialMatches.length} potential matches in same networks`
          );
        }

        // Add timestamp to the data for tracking
        data.timestamp = new Date();

        // Emit the event to Flask
        flaskSocket.emit("matchmaking_request", data);
        console.log("🚀 Sent matchmaking request to Flask");
      } catch (error) {
        console.error("❌ Error in GenerateMatches:", error);

        // Notify user of error
        if (global.activeUsers.has(data.User._id)) {
          const userSocket = global.activeUsers.get(data.User._id);
          io.to(userSocket).emit("matchmaking_error", {
            error:
              "There was an error generating your matches. Please try again later.",
            timestamp: new Date(),
          });
        }
      }
    });

    // Handle user disconnect
    socket.on("disconnect", () => {
      for (let [key, value] of global.activeUsers.entries()) {
        if (value === socket.id) {
          console.log("👋 User disconnected:", key);
          global.activeUsers.delete(key);
        }
      }
    });
  });

  return io;
};

module.exports = initializeSocket;
