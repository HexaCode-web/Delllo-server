const mongoose = require("mongoose");

// Define the licenseFeatures schema
const licenseFeaturesSchema = new mongoose.Schema({
  licenseFeaturesID: { type: String, required: true },
  featuresDescription: { type: String, required: true },
});

// Define the main License schema
const licenseSchema = new mongoose.Schema(
  {
    licenseID: { type: String, required: true, unique: true },
    licenseName: { type: String, required: true },
    licenseDescription: { type: String, required: true },
    minimumTerm: { type: Number, required: true },
    maximumTerm: { type: Number, required: true },
    maxNetworks: { type: Number, required: true },
    maxUsers: { type: Number, required: true },
    maxAdmins: { type: Number, required: true },
    cost: { type: Number, required: true },
    licenseFeatures: [licenseFeaturesSchema], // Embedding the licenseFeatures schema as an array
  },
  { timestamps: true }
);

// Create the model
const License = mongoose.model("License", licenseSchema);

module.exports = License;
