const express = require("express");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth.route");
const mongoDB = process.env.DB;
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

//routes
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Hello, World!");
});
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
