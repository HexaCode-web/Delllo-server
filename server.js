const express = require("express");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const authRoutes = require("./routes/Auth.route");
const profileRoutes = require("./routes/Profile.route");
const organizationRoutes = require("./routes/Organization.route");
const networkRoutes = require("./routes/Network.route.js");
const mongoDB = process.env.DB;
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

//routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/organization", organizationRoutes);
app.use("/api/network", networkRoutes);

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
