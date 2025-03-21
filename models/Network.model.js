const mongoose = require("mongoose");

const networkSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    licenseID: {
      type: String,
      required: false,
    },
    licenseType: {
      type: String,
      required: false,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    renewalPoint: {
      type: Date,
      required: false,
    },
    type: {
      type: String,
      required: true,
      enum: ["Public", "Private"],
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
    Admins: [
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
        Active: {
          type: Boolean,
          default: true, // Default to true when a user is accepted
        },
        ManualInActive: {
          type: Boolean,
          default: false, // Default to false when a user is accepted
        },
      },
    ],
    radius: {
      type: Number,
      required: true,
    },
    Deleted: {
      type: Boolean,
      default: false, // Default to true when a user is accepted
    },
    OnlyProfEmails: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
networkSchema.index({ coordinates: "2dsphere" }); // Create a 2dsphere index for geospatial queries

module.exports = mongoose.model("Network", networkSchema);
