const mongoose = require("mongoose");

const organizationSchema = mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  domain: {
    type: String,
    required: true,
    validate: {
      validator: function (value) {
        const thirdPartyDomains = [
          "gmail.com",
          "yahoo.com",
          "outlook.com",
          "hotmail.com",
        ];
        return !thirdPartyDomains.includes(value.toLowerCase());
      },
      message: (props) =>
        `${props.value} is a third-party domain and not allowed`,
    },
  },
  admins: [
    {
      Email: { type: String, required: true },
      acceptedInvite: { type: Boolean, default: false },
    },
  ],
  networks: { type: [String], required: false, default: [] },
});

// Create and export the model
const Organization = mongoose.model("Organization", organizationSchema);
module.exports = Organization;
