const mongoose = require("mongoose");
const Message = {
  message: { type: String, required: true },
  seen: { type: Boolean, required: true, default: false },
  senderID: { type: String, required: true },
  timestamp: { type: Date, required: true, default: Date.now },
};
// Define the MeetRequest schema
const meetRequestSchema = new mongoose.Schema(
  {
    networkID: { type: String, required: true },
    userIDA: { type: String, required: true }, // User initiating the request
    userIDB: { type: String, required: true }, // Target user
    purpose: { type: String, required: true },
    isAinRoom: { type: Boolean, default: false },
    isBinRoom: { type: Boolean, default: false },
    datetimeCancelled: { type: Date, default: null }, // Nullable
    datetimeCreated: { type: Date, required: true, default: Date.now },
    expiryPeriodinMins: { type: Number, required: true },
    Conversation: { type: [Message], required: false, default: [] },
    meetResponse: {
      type: String,
      enum: ["waiting", "accepted", "rejected"],
      required: true,
      default: "waiting",
    },
    isSuggestion: { type: Boolean, required: true },
  },
  { timestamps: true }
);

// Create the model
const MeetRequest = mongoose.model("MeetRequest", meetRequestSchema);

module.exports = MeetRequest;
