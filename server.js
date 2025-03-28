const express = require("express");
require("dotenv").config({path:"./.env"});
const app = express();
const port = process.env.PORT || 3000;
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const authRoutes = require("./routes/Auth.route.js");
const profileRoutes = require("./routes/Profile.route.js");
const organizationRoutes = require("./routes/Organization.route.js");
const networkRoutes = require("./routes/Network.route.js");
const MeetRoutes = require("./routes/Meet.route.js");
const NotificationRoutes = require("./routes/Notification.route.js");
const corsOptions = require("./middleware/corsOptions.js");
const cors = require("cors");
const checkForActive = require("./functions/checkForActive.js");
const http = require("http");
// Import the Socket.IO module
const initializeSocket = require("./sockets/SocketManager.js");
const path = require("path");

const mongoDB = process.env.MONGO_URI;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors(corsOptions));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Server error", error: err.message });
});
// Create an HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Attach io instance to req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/organization", organizationRoutes);
app.use("/api/network", networkRoutes);
app.use("/api/meet", MeetRoutes);
app.use("/api/notifications", NotificationRoutes);
// Connect to MongoDB and start the server

mongoose
  .connect(mongoDB)
  .then(() => {
    console.log("MongoDB connected");
    server.listen(port, () => {
      console.log(`Server listening on port ${port}, DB is connected`);

      setInterval(checkForActive, 12000);
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));

mongoose.connection.on("error", (err) => {
  console.log("MongoDB error:", err);
});
