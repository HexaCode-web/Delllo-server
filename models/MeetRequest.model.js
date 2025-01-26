const mongoose = require("mongoose");

// Define the MeetRequest schema
const meetRequestSchema = new mongoose.Schema(
  {
    networkID: { type: String, required: true },
    userIDA: { type: String, required: true }, // User initiating the request
    userIDB: { type: String, required: true }, // Target user
    purpose: { type: String, required: true },
    datetimeCancelled: { type: Date, default: null }, // Nullable
    datetimeCreated: { type: Date, required: true, default: Date.now },
    expiryPeriodinMins: { type: Number, required: true },
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
