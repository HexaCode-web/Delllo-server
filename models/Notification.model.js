const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "meet Request",
        "organization Invite",
        "network Approval",
        "custom",
      ],
    },
    message: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    seen: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      default: null, // Optional: Set expiration for notifications
    },
  },
  { timestamps: true }
);

// Indexes
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired notifications

module.exports = mongoose.model("Notification", notificationSchema);
