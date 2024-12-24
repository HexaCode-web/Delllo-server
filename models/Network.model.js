const mongoose = require("mongoose");

const networkSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["Private", "Public"], // Replace with valid types
    },
    size: {
      type: Number,
      required: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    coordinates: {
      type: { type: String, default: "Point" },
      coordinates: [Number], // [longitude, latitude]
    },
    Dismissed: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User", // Reference to the User model, store ObjectId
          required: true,
        },
      },
    ],
    Pending: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User", // Reference to the User model, store ObjectId
          required: true,
        },
      },
    ],
    Rejected: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User", // Reference to the User model, store ObjectId
          required: true,
        },
      },
    ],
    Accepted: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User", // Reference to the User model, store ObjectId
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);
networkSchema.index({ coordinates: "2dsphere" }); // Create a 2dsphere index for geospatial queries

module.exports = mongoose.model("Network", networkSchema);
