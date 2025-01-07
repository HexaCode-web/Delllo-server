const express = require("express");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth.route.js");
const profileRoutes = require("./routes/Profile.route.js");
const organizationRoutes = require("./routes/Organization.route.js");
const networkRoutes = require("./routes/Network.route.js");
const MeetRoutes = require("./routes/Meet.route.js");
const corsOptions = require("./middleware/corsOptions.js");
const cors = require("cors");

const mongoDB = process.env.DB;
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors(corsOptions));

//routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/organization", organizationRoutes);
app.use("/api/network", networkRoutes);
app.use("/api/meet", MeetRoutes);

mongoose
  .connect(mongoDB)
  .then(
    () => console.log("MongoDB connected"),
    app.listen(port, () => {
      console.log(`app listening on port ${port}, DB is connected`);
    })
  )
  .catch((err) => console.error("MongoDB connection error:", err));

mongoose.connection.on("error", (err) => {
  console.log("MongoDB error:", err);
});
