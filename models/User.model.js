const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = mongoose.Schema(
  {
    name: { type: String, require: true },
    email: { type: String, require: true, unique: true },
    password: { type: String, require: true },
    verified: { type: Boolean, default: false },
    skills: { type: Array, require: false, default: [] },
    highlights: { type: Array, require: false, default: [] },
    education: { type: Array, require: false, default: [] },
    businessDrivers: { type: Array, require: false, default: [] },
    presentRole: { type: Object, default: {}, require: false },
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
