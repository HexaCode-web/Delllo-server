const mongoose = require("mongoose");
const counterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  seq: {
    type: Number,
    required: true,
    default: 0,
  },
});

const Counter = mongoose.model("Counter", counterSchema);

const otpSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true,
  },
  contactInfo: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^\S+@\S+\.\S+$/.test(v); // Validates email format
      },
      message: (props) => `${props.value} is not a valid email!`,
    },
  },
  code: {
    type: String,
    required: true,
    length: 6, // Ensures the OTP is always 6 digits
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now, // Automatically sets the current date/time
  },
  expireAt: {
    type: Date,
  },
  verified: {
    type: Boolean,
    default: false,
  },
});

// Pre-save middleware to calculate `expireAt` 10 minutes from `createdAt`
otpSchema.pre("save", async function (next) {
  if (!this.id) {
    // Auto-increment `id` using the Counter collection
    const counter = await Counter.findOneAndUpdate(
      { name: "otpId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.id = counter.seq;
  }
  if (!this.expireAt) {
    this.expireAt = new Date(this.createdAt.getTime() + 10 * 60 * 1000); // Add 10 minutes
  }
  next();
});
// Set TTL (Time-To-Live) index to automatically delete expired documents
otpSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

const OTP = mongoose.model("OTP", otpSchema);

module.exports = OTP;
