const socketIo = require("socket.io");
const User = require("../models/User.model");
const MeetRequest = require("../models/MeetRequest.model");
const Notification = require("../models/Notification.model");
const socketClient = require("socket.io-client");
const flaskSocket = socketClient("ws://127.0.0.1:5000", {
  reconnection: true,
  timeout: 600000, // Increase timeout to 10 minutes
}); // Ensure WebSocket connection

flaskSocket.on("connect", () => {
  console.log("✅ Connected to Flask WebSocket!");
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
  flaskSocket.on("matchmaking_progress", (Data) => {
    console.log("🔄 Matchmaking Progress:", Data);

    if (global.activeUsers.has(Data.userId)) {
      const userSocket = global.activeUsers.get(Data.userId);
      io.to(userSocket).emit("matchmaking_progress", Data);
    }
  });

  flaskSocket.on("matchmaking_complete", (Data) => {
    console.log(
      `✅ Matchmaking complete for user ${Data.userId} with ${Data.matches.length} matches`
    );

    if (global.activeUsers.has(Data.userId)) {
      const userSocket = global.activeUsers.get(Data.userId);
      io.to(userSocket).emit("matchmaking_complete", Data);
    }
  });

  io.on("connection", (socket) => {
    // Register user
    socket.on("registerUser", (userId) => {
      global.activeUsers.set(userId, socket.id);
      console.log(`👤 User registered: ${userId} with socket ID: ${socket.id}`);
    });

    // Broadcast new notification
    socket.on("newNotification", (Data) => {
      io.emit("newNotification", Data);
    });

    socket.on("NetworkJoin", (Data) => {
      io.emit("NetworkJoin", Data);
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

    socket.on("sendMessage", async (Data) => {
      console.log("📨 Message received:", Data);

      const { meetRequestID, senderID, message } = Data;

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
      console.log("📨 Received User message To Rain:", message);
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
        sendMSGtoUser(
          messageSender,
          `I first would like to know your objectives and how long you're around for today? Do you mind if I analyse and then potentially ask a few more questions to help get the best connections in the Network?`
        );
      } else {
        //Passed the quick reply stage
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
        socket.emit("awaiting_AI_response");

        // Timeout to handle AI response delay
        const timeout = setTimeout(async () => {
          console.error("⏳ AI response timeout for user:", messageSender);
          sendMSGtoUser(
            messageSender,
            "Servers are busy. Please try again later."
          );
        }, 100000); // 3 minutes timeout (adjustable)

        // Handle AI response
        flaskSocket.once("chat_response", async (Data) => {
          clearTimeout(timeout); // Cancel timeout if AI responds in time
          console.log("🤖 AI Response:", Data.answer);
          sendMSGtoUser(messageSender, Data.answer);
        });
      }
    });

    // Handle Flask disconnection (only register this once)
    flaskSocket.off("disconnect").on("disconnect", async () => {
      console.error("🚨 Flask server disconnected!");

      for (const [messageSender] of global.activeUsers.entries()) {
        try {
          sendMSGtoUser(
            messageSender,
            "Connection Error. Please try again later."
          );
        } catch (error) {
          console.error(
            "❌ Error updating user chat on Flask disconnect:",
            error
          );
        }
      }
    });

    // Enhanced GenerateMatches event handler
    socket.on("GenerateMatches", async (data) => {
      try {
        const Data = {
          Profiles: data.Profiles,
          User: data.User,
          timestamp: new Date(),
          userId: data.User._id || data.User.user._id,
          selectedNetwork: data.selectedNetwork,
        };

        console.log("🧩 Generate Matches Request:", Data.User._id);
        const userId = Data.User._id;

        if (!Data.Profiles || Data.Profiles.length === 0) {
          console.log("🔍 No profiles provided");
          return;
        }

        // Notify the frontend that matchmaking has started
        if (global.activeUsers.has(userId)) {
          const userSocket = global.activeUsers.get(userId);
          io.to(userSocket).emit("matchmaking_started");
          sendMSGtoUser(
            userId,
            `Looking for a suitable person in ${data.selectedNetwork.name} Network...`
          );
        }

        flaskSocket.emit("matchmaking_request", Data);

        const timeout = setTimeout(() => {
          console.error("⏳ AI response timeout for user:", userId);
          if (global.activeUsers.has(userId)) {
            const userSocket = global.activeUsers.get(userId);
            io.to(userSocket).emit("matchMakingTimeout");
          }
        }, 180000); // 3 minutes timeout

        flaskSocket.once("matchmaking_response", async (response) => {
          clearTimeout(timeout);
          if (global.activeUsers.has(userId)) {
            const userSocket = global.activeUsers.get(userId);
            io.to(userSocket).emit("matchmaking_complete", response);
          }
          sendMSGtoUser(
            userId,
            `Found ${response.matches.length} profiles suitable in ${data.selectedNetwork} network`
          );
        });
      } catch (error) {
        console.error("❌ Error in GenerateMatches:", error);

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

  const sendMSGtoUser = async (userId, msgText) => {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          rAInChat: {
            role: "AI",
            text: msgText,
            timestamp: new Date(),
          },
        },
      },
      { new: true }
    );
    if (global.activeUsers.has(userId)) {
      const userSocket = global.activeUsers.get(userId);

      io.to(userSocket).emit("receiveBotMessage", updatedUser);
    }
  };
  return io;
};
module.exports = initializeSocket;
