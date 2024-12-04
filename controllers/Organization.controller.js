const Organization = require("../models/Organization.model");
const OTP = require("../models/OTP.model");
const User = require("../models/User.model");
const registerOrganization = async (req, res) => {
  const { name, email, latitude, longitude, address } = req.body;
  if (!name || !email || !latitude || !longitude || !address) {
    return res.status(400).json({ message: "Invalid request" });
  }
  const domain = email.split("@")[1];
  try {
    // Check if organization exists by domain
    const organizationExists = await Organization.findOne({ domain });
    if (organizationExists)
      return res.status(400).json({ message: "Organization already exists" });

    // Check if OTP exists and if it's verified
    const checkForOTP = await OTP.findOne({ contactInfo: email });
    if (!checkForOTP || !checkForOTP.verified) {
      return res.status(400).json({ message: "OTP not verified" });
    }

    // Delete OTP after successful verification
    await OTP.findByIdAndDelete(checkForOTP._id);

    // Create the organization
    const organization = new Organization({
      name,
      address,
      domain,
      admins: [{ Email: email }],
      latitude,
      longitude,
    });

    await organization.save();
    res.status(201).json({ organization }); // Return created organization
  } catch (error) {
    res.status(500).json({
      message: "Error registering organization",
      error: error.message,
    });
  }
};

const updateOrganization = async (req, res) => {
  const { OrgId } = req.params;

  const { newOrg } = req.body;

  try {
    // update the organization
    const organization = await Organization.findByIdAndUpdate(OrgId, newOrg, {
      new: true, // Return the updated document
      runValidators: true, // Ensure schema validation is applied to updated data
    });

    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    // Return the updated user
    res
      .status(200)
      .json({ message: "Organization updated successfully", organization });
  } catch (error) {
    res.status(500).json({
      message: "Error updating organization",
      error: error.message,
    });
  }
};
const deleteOrganization = async (req, res) => {
  const { OrgId } = req.params;

  try {
    // Check if the organization exists
    const organization = await Organization.findByIdAndDelete(OrgId);
    if (!organization) {
      return res.status(400).json({ message: "Organization doesn't exist" });
    }

    res.status(200).json({ message: "Organization deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting organization",
      error: error.message,
    });
  }
};

const addAdmin = async (req, res) => {
  const { email, id } = req.body;

  try {
    // Check if the organization exists using the domain from the email
    const domain = extractDomainFromEmail(email); // Use the domain extraction logic

    const organization = await Organization.findOne({ domain });
    const invitedUser = await User.findById(id);
    if (!organization || !invitedUser) {
      return res
        .status(400)
        .json({ message: "Organization or invited user doesn't exist" });
    }

    // Check if the email is already an admin
    if (organization.admins.includes(email)) {
      return res.status(400).json({ message: "Email is already an admin" });
    }

    // Add the email to the organization's admins array
    organization.admins.push({ Email: email, acceptedInvite: false });
    const inviteLink = `https://delllo.harptec.com/api/profile/addAssociatedEmail/${invitedUser.id}/${email}`;

    const getEmailHTML = (organizationName, inviteLink) => {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .email-container {
              max-width: 600px;
              margin: 20px auto;
              background: #ffffff;
              border: 1px solid #dddddd;
              border-radius: 8px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .email-header {
              background-color: #007BFF;
              color: #ffffff;
              padding: 20px;
              text-align: center;
            }
            .email-header h1 {
              margin: 0;
              font-size: 24px;
            }
            .email-body {
              padding: 20px;
              color: #333333;
            }
            .action-button {
              display: inline-block;
              background-color: #007BFF;
              color: #ffffff!important;
              text-decoration: none;
              font-weight: bold;
              padding: 10px 20px;
              border-radius: 5px;
              margin: 20px auto;
              display: block;
              text-align: center;
            }
            .email-footer {
              background-color: #f4f4f4;
              color: #555555;
              font-size: 12px;
              padding: 10px 20px;
              text-align: center;
              border-top: 1px solid #dddddd;
            }
            .email-footer a {
              color: #007BFF;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="email-header">
              <h1>Invitation to Join ${organizationName}</h1>
            </div>
            <div class="email-body">
              <p>Hello,</p>
              <p>You have been invited to become an admin of the organization <strong>${organizationName}</strong>.</p>
              <p>As an admin, you will have access to manage organization settings, team members, and more.</p>
              <a href="${inviteLink}" class="action-button">Accept Invitation</a>
              <p>If you did not expect this invitation or believe it was sent in error, please ignore this email or contact our support team.</p>
            </div>
            <div class="email-footer">
              <p>Thank you for being part of our community!</p>
              <p><a href="https://example.com">Visit our website</a></p>
            </div>
          </div>
        </body>
        </html>
      `;
    };

    const emailHtml = getEmailHTML(domain, inviteLink);

    const emailData = {
      sender: {
        name: "Dello",
        email: "delllo@noreply.com",
      },
      to: [
        {
          email: email,
        },
      ],
      subject: "Organization invite request",
      htmlContent: emailHtml,
    };

    const requestOptions = {
      method: "POST",
      headers: {
        accept: "application/json",
        // eslint-disable-next-line no-undef
        "api-key": process.env.MailKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(emailData),
    };
    try {
      const response = await fetch(
        "https://api.brevo.com/v3/smtp/email",
        requestOptions
      );
      if (!response.ok) {
        throw new Error(
          `Email sending failed with status: ${response.status} ${response.message}`
        );
      }
      // Save the updated organization
      await organization.save();

      // Return success message and the updated organization
      return res
        .status(200)
        .json({ message: "Admin added successfully", organization });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } catch (error) {
    res.status(500).json({
      message: "Error adding admin to the organization",
      error: error.message,
    });
  }
};
const removeAdmin = async (req, res) => {
  const { email } = req.body;
  const removedUser = await User.findOne({ email: email });

  try {
    const domain = extractDomainFromEmail(email);

    // Find the organization by domain
    const organization = await Organization.findOne({ domain });

    if (!organization) {
      return res.status(400).json({ message: "Organization doesn't exist" });
    }
    if (organization.admins.length == 1) {
      return res
        .status(400)
        .json({ message: "Organization must have at least one admin" });
    }
    // Check if the email is in the admins array
    const adminIndex = organization.admins.findIndex(
      (admin) => admin.Email === email
    );
    const EmailIndex = removedUser.associatedEmails.findIndex(
      (email) => email === email
    );

    if (adminIndex === -1) {
      return res.status(400).json({ message: "Email is not an admin" });
    }

    // Remove the admin from the admins array
    organization.admins.splice(adminIndex, 1);
    removedUser.associatedEmails.splice(EmailIndex, 1);

    // Save the updated organization
    await removedUser.save();

    await organization.save();

    // Return success message and the updated organization
    res
      .status(200)
      .json({ message: "Admin removed successfully", organization });
  } catch (error) {
    res.status(500).json({
      message: "Error removing admin from the organization",
      error: error.message,
    });
  }
};

// Helper function to extract domain from email
function extractDomainFromEmail(email) {
  if (!email || !email.includes("@")) {
    throw new Error("Invalid email format");
  }
  return email.split("@")[1];
}

module.exports = {
  registerOrganization,
  addAdmin,
  updateOrganization,
  removeAdmin,
  deleteOrganization,
};
