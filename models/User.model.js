const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const skillSchema = new mongoose.Schema({
  Level: {
    type: String,
    required: false,
    enum: ["beginner", "Intermediate", "Advanced"], // Only allow these values
  },
  Skill: {
    type: String,
    required: false, // Ensure a skill name is always provided
  },
  Reference: {
    type: String,
    required: false, // Reference is optional
  },
});
const highlightsSchema = new mongoose.Schema({
  Highlight: {
    type: String,
    required: false, // Ensure a title is always provided
  },
  Reference: {
    type: String,
    required: false, // Ensure a company name is always provided
  },
  Date: {
    type: String,
    required: false, // Ensure a year is always provided
  },
});
const businessDriversSchema = new mongoose.Schema({
  Service: {
    type: String,
    required: false,
  },
  Client: {
    type: String,
    required: false,
  },
});
const educationSchema = new mongoose.Schema({
  Degree: {
    type: String,
    required: false,
  },
  Institution: {
    type: String,
    required: false,
  },
  StartDate: {
    type: String,
    required: false,
  },
});
const presentRoleSchema = new mongoose.Schema({
  Company: {
    type: String,
    required: false,
  },
  Position: {
    type: String,
    required: false,
  },
  StartDate: {
    type: String,
    required: false,
  },
});
const previousRolesSchema = new mongoose.Schema({
  Company: {
    type: String,
    required: false,
  },
  Position: {
    type: String,
    required: false,
  },
  Duration: {
    type: String,
    required: false,
  },
});
const userSchema = mongoose.Schema(
  {
    name: { type: String, require: true },
    email: { type: String, require: true, unique: true },
    password: { type: String, require: true },
    longitude: { type: String, require: true },
    latitude: { type: String, require: true },
    associatedEmails: [
      {
        email: { type: String, required: false },
      },
    ],
    skills: {
      type: [skillSchema],
      default: [],
    },
    highlights: {
      type: [highlightsSchema],
      default: [],
    },
    education: { type: [educationSchema], default: [] },
    businessDrivers: {
      type: [businessDriversSchema],
      default: [],
    },
    previousRoles: {
      type: [previousRolesSchema],
      default: [],
    },
    presentRole: { type: presentRoleSchema, default: {}, require: false },
  },
  { Timestamp: true }
);
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // If password is not modified, skip this step

  const salt = await bcrypt.genSalt(10); // Generate a salt with 10 rounds (adds randomness to the hash)
  this.password = await bcrypt.hash(this.password, salt); // Hash the password using the salt
  next(); // Move on to saving the user to the database
});
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
module.exports = User;
