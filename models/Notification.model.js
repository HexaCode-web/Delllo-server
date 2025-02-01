const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    requestId: { type: String, required: true },
    message: { type: String, required: true },
    senderID: { type: String, required: false },
    senderName: { type: String, required: false },
    seen: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
