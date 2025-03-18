const User = require("../models/User.model");
const Organization = require("../models/Organization.model");
const bcrypt = require("bcrypt");
const upload = require("../functions/fileUpload");
//skills
const addSkill = async (req, res) => {
  try {
    const { userId } = req;
    const { skill } = req.body;
    if (!userId || !skill) {
      return res.status(400).json({ message: "Invalid request" });
    }
    if (
      !["beginner", "intermediate", "advanced"].includes(
        skill.Level.toLowerCase()
      )
    ) {
      return res.status(400).json({ message: "Invalid skill level" });
    }
    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { skills: skill } }, // Use `$push` to add a new object to the array
      { new: true }
    );
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const editSkill = async (req, res) => {
  try {
    const { userId } = req; // Assuming the user ID is extracted from the token
    const { skillId, updatedSkill } = req.body; // `skillId` to locate the skill, `updatedSkill` contains new values

    if (!userId || !skillId || !updatedSkill) {
      return res.status(400).json({ message: "Invalid request" });
    }

    // Validate `updatedSkill.Level`
    if (
      !["beginner", "Intermediate", "Advanced"].includes(updatedSkill.Level)
    ) {
      return res.status(400).json({ message: "Invalid skill level" });
    }

    // Find the user and update the specific skill
    const user = await User.findOneAndUpdate(
      { _id: userId, "skills._id": skillId }, // Match the user and the specific skill
      {
        $set: {
          "skills.$": updatedSkill, // Update the matched skill
        },
      },
      { new: true } // Return the updated document
    );

    if (!user) {
      return res.status(404).json({ message: "User or skill not found" });
    }

    res.status(200).json({ message: "Skill updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const deleteSkill = async (req, res) => {
  try {
    const { userId } = req;
    const { skillId } = req.body; // `skillId` to identify which skill to remove

    if (!userId || !skillId) {
      return res.status(400).json({ message: "Invalid request" });
    }

    // Use `$pull` to remove the skill that matches the given `skillId`
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { skills: { _id: skillId } } }, // Remove skill with matching `_id`
      { new: true } // Return the updated document
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Skill removed successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
//highlights
const addHighLight = async (req, res) => {
  try {
    const { userId } = req;
    const { highLight } = req.body;

    if (!userId || !highLight) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { highlights: highLight } },
      { new: true }
    );
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const editHighLight = async (req, res) => {
  try {
    const { userId } = req;
    const { highLightId, updatedHighLight } = req.body;

    if (!updatedHighLight) {
      return res
        .status(400)
        .json({ message: "Updated highlight data is missing" });
    }

    // Debug inputs

    // Perform the update
    const user = await User.findOneAndUpdate(
      { _id: userId, "highlights._id": highLightId }, // Ensure this matches your schema
      {
        $set: {
          "highlights.$": updatedHighLight, // Use positional operator to update specific highlight
        },
      },
      { new: true } // Return the updated document
    );

    if (!user) {
      return res.status(404).json({ message: "User or highlight not found" });
    }

    res.status(200).json({ message: "Highlight updated successfully", user });
  } catch (error) {
    console.error("Error in editHighLight: ", error);
    res.status(500).json({ message: error.message });
  }
};
const deleteHighLight = async (req, res) => {
  try {
    const { userId } = req;
    const { highLightId } = req.body;

    if (!userId || !highLightId) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { highlights: { _id: highLightId } } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "highlight removed successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
//education
const addEducation = async (req, res) => {
  try {
    const { userId } = req;
    const { education } = req.body;

    if (!userId || !education) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { education: education } },
      { new: true }
    );
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const editEducation = async (req, res) => {
  try {
    const { userId } = req;
    const { educationId, updatedEducation } = req.body;

    if (!userId || !educationId || !updatedEducation) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const user = await User.findOneAndUpdate(
      { _id: userId, "education._id": educationId },
      {
        $set: {
          "education.$": updatedEducation,
        },
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User or education not found" });
    }

    res.status(200).json({ message: "education updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const deleteEducation = async (req, res) => {
  try {
    const { userId } = req;
    const { educationId } = req.body;

    if (!userId || !educationId) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { education: { _id: educationId } } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "education removed successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
// immediate needs

const addImmediateNeeds = async (req, res) => {
  try {
    const { userId } = req;
    const { ImmediateNeed } = req.body;

    if (!userId || !ImmediateNeed) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { ImmediateNeeds: ImmediateNeed } },
      { new: true }
    );
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const editImmediateNeeds = async (req, res) => {
  try {
    const { userId } = req;
    const { immediateNeedId, updatedImmediateNeed } = req.body;

    if (!userId || !immediateNeedId || !updatedImmediateNeed) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const user = await User.findOneAndUpdate(
      { _id: userId, "ImmediateNeeds._id": immediateNeedId },
      {
        $set: {
          "ImmediateNeeds.$": updatedImmediateNeed,
        },
      },
      { new: true }
    );

    if (!user) {
      return res
        .status(404)
        .json({ message: "User or ImmediateNeed not found" });
    }

    res
      .status(200)
      .json({ message: "ImmediateNeed updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const deleteImmediateNeeds = async (req, res) => {
  try {
    const { userId } = req;
    const { immediateNeedId } = req.body;

    if (!userId || !immediateNeedId) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { ImmediateNeeds: { _id: immediateNeedId } } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res
      .status(200)
      .json({ message: "Immediate Need removed successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
//businessDrivers
const addBusinessDriver = async (req, res) => {
  try {
    const { userId } = req;
    const { businessDriver } = req.body;

    if (!userId || !businessDriver) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { businessDrivers: businessDriver } },
      { new: true }
    );
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const editBusinessDriver = async (req, res) => {
  try {
    const { userId } = req;
    const { businessDriverId, updatedBusinessDriver } = req.body;

    if (!userId || !businessDriverId || !updatedBusinessDriver) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const user = await User.findOneAndUpdate(
      { _id: userId, "businessDrivers._id": businessDriverId },
      {
        $set: {
          "businessDrivers.$": updatedBusinessDriver,
        },
      },
      { new: true }
    );

    if (!user) {
      return res
        .status(404)
        .json({ message: "User or business driver not found" });
    }

    res
      .status(200)
      .json({ message: "Business driver updated successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
const deleteBusinessDriver = async (req, res) => {
  try {
    const { userId } = req;
    const { businessDriverId } = req.body;

    if (!userId || !businessDriverId) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { businessDrivers: { _id: businessDriverId } } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res
      .status(200)
      .json({ message: "businessDriver removed successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

//PreviousRole
const addPreviousRole = async (req, res) => {
  try {
    const { userId } = req;
    const { PreviousRole } = req.body;

    if (!userId || !PreviousRole) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { previousRoles: PreviousRole } },
      { new: true }
    );
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const editPreviousRole = async (req, res) => {
  try {
    const { userId } = req;
    const { PreviousRoleId, updatedPreviousRole } = req.body;

    if (!userId || !PreviousRoleId || !updatedPreviousRole) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const user = await User.findOneAndUpdate(
      { _id: userId, "previousRoles._id": PreviousRoleId },
      {
        $set: {
          "previousRoles.$": updatedPreviousRole,
        },
      },
      { new: true }
    );

    if (!user) {
      return res
        .status(404)
        .json({ message: "User or business driver not found" });
    }

    res
      .status(200)
      .json({ message: "Business driver updated successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
const deletePreviousRole = async (req, res) => {
  try {
    const { userId } = req;
    const { PreviousRoleId } = req.body;

    if (!userId || !PreviousRoleId) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { previousRoles: { _id: PreviousRoleId } } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res
      .status(200)
      .json({ message: "businessDriver removed successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { Id } = req.params; // Assuming `userId` is attached to `req` via middleware
    const { updatedProfile } = req.body;

    // Validate inputs
    if (!Id || !updatedProfile) {
      return res
        .status(400)
        .json({ message: "Invalid request: Missing userId or updatedProfile" });
    }

    // Find and update the user
    const user = await User.findByIdAndUpdate(Id, updatedProfile, {
      new: true, // Return the updated document
      runValidators: true, // Ensure schema validation is applied to updated data
    });

    // Check if the user was found
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return the updated user
    res.status(200).json({ message: "User updated successfully", user });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      message: "An error occurred while updating the profile",
      error: error.message,
    });
  }
};
const updateLocation = async (req, res) => {
  try {
    const { Id } = req.params; // Assuming `userId` is attached to `req` via middleware
    const { longitude, latitude } = req.body; // Extracting only longitude and latitude from the request body

    // Validate inputs
    if (!Id || longitude === undefined || latitude === undefined) {
      return res.status(400).json({
        message: "Invalid request: Missing userId, longitude, or latitude",
      });
    }

    // Find the user and update only the longitude and latitude
    const user = await User.findByIdAndUpdate(
      Id,
      { longitude, latitude }, // Only update these fields
      {
        new: true, // Return the updated document
        runValidators: true, // Ensure schema validation is applied to updated data
      }
    );

    // Check if the user was found
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return the updated user with the new location
    res.status(200).json({ message: "Location updated successfully", user });
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({
      message: "An error occurred while updating the location",
      error: error.message,
    });
  }
};

const changePassword = async (req, res) => {
  const { userId } = req;

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Please provide both current and new passwords" });
  }

  try {
    // Find the user by the authenticated user id (from JWT or session)
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the current password is correct
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Update the user's password in the database
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};
const editPresentRole = async (req, res) => {
  try {
    const { Id } = req.params;
    const { updatedPresentRole } = req.body;

    if (!Id || !updatedPresentRole) {
      return res.status(400).json({ message: "Invalid request" });
    }
    const user = await User.findOneAndUpdate(
      { _id: Id },
      {
        $set: {
          presentRole: updatedPresentRole,
        },
      },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Role updated successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
const addAssociatedEmail = async (req, res) => {
  const { userId, email } = req.params;

  try {
    // Call the logic function, which no longer handles res directly
    const result = await addAssociatedEmailLogic(userId, email);

    // Send the response based on the result returned by the logic function
    res.status(result.status).send(result.message);
  } catch (error) {
    // Catch and handle any errors, ensuring response handling is done here
    res.status(500).send("Internal Server Error: " + error.message);
  }
};
const manualAddWorkEmail = async (req, res) => {
  try {
    const { userId } = req;
    const { associatedEmail } = req.body;

    if (!userId || !associatedEmail) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { associatedEmails: associatedEmail } },
      { new: true }
    );
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const deleteWorkEmail = async (req, res) => {
  try {
    const { userId } = req;
    const { workEmailId } = req.body;

    if (!userId || !workEmailId) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { associatedEmails: { _id: workEmailId } } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Work Email removed successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
const addAssociatedEmailLogic = async (userId, email) => {
  try {
    // Find user and organization by their respective IDs or email
    const user = await User.findById(userId);
    const organization = await Organization.findOne({
      admins: { $elemMatch: { Email: email } },
    });

    // If user or organization not found, return an error result
    if (!organization || !user) {
      return {
        status: 404,
        message: "Organization or user not found.",
      };
    }

    // If email is already associated with the user, return error message
    const existingEmailEntry = user.associatedEmails.find(
      (associatedEmail) => associatedEmail.email === email
    );

    if (existingEmailEntry) {
      // If the email is already associated, check the OrgId
      if (existingEmailEntry.OrgId === "") {
        // If OrgId is empty, update it with the new value
        existingEmailEntry.OrgId = organization._id;
        await user.save();
        return {
          status: 200,
          message: "Email association updated successfully.",
        };
      } else {
        // If OrgId is not empty, return an error
        return {
          status: 400,
          message: "Email is already associated with another organization.",
        };
      }
    }
    // Check if the admin entry exists and if the invite is valid
    const adminEntry = organization.admins.find(
      (admin) => admin.Email === email
    );

    if (!adminEntry || adminEntry.acceptedInvite) {
      return {
        status: 400,
        message: "Invalid or already accepted invite.",
      };
    }

    // Update invite status and push email to user's associated emails
    adminEntry.acceptedInvite = true;
    user.associatedEmails.push({ email: email, OrgId: organization._id });

    // Save changes to user and organization
    await user.save();
    await organization.save();

    // Return success message as HTML
    return {
      status: 200,
      message: `<html>
        <body style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
          <h1>Invite Accepted!</h1>
          <p>Thank you for accepting the invite to join the organization.</p>
        </body>
      </html>`,
    };
  } catch (error) {
    // Return error object with status and message
    throw new Error("Error associating email: " + error.message);
  }
};
const getUsersByDomain = async (req, res) => {
  try {
    const { domain } = req.params; // Get the domain from query parameters

    // Validate the domain input
    if (!domain) {
      return res.status(400).json({
        message: "Domain is required in the query parameters.",
      });
    }

    // Use MongoDB's $regex to find users with associated emails containing the domain
    const users = await User.find({
      associatedEmails: {
        $elemMatch: {
          email: { $regex: `@${domain}$`, $options: "i" }, // Match emails ending with the domain
        },
      },
    });

    // Return the filtered users
    res.status(200).json({
      message: "Users retrieved successfully.",
      users,
    });
  } catch (error) {
    console.error("Error fetching users by domain:", error);
    res.status(500).json({
      message: "An error occurred while fetching users.",
      error: error.message,
    });
  }
};
const getProfileById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
const deleteUser = async (req, res) => {
  try {
    const { userId } = req;

    if (!userId) {
      return res.status(400).json({ message: "Invalid request" });
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "User removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
const uploadPhoto = async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ message: "No file uploaded or invalid file type" });
  }

  // If everything is successful, return the file path
  res.json({
    message: "File uploaded successfully",
    filePath: `/uploads/${req.file.filename}`,
  });
};

// Retrieve all uploaded photos
// app.get("/photos", (req, res) => {
//   const uploadDir = path.join(__dirname, "uploads");
//   fs.readdir(uploadDir, (err, files) => {
//     if (err) {
//       return res.status(500).json({ message: "Unable to scan files" });
//     }
//     const photos = files.map((file) => ({
//       name: file,
//       url: `/uploads/${file}`,
//     }));
//     res.json(photos);
//   });
// });
module.exports = {
  addSkill,
  deleteSkill,
  editSkill,
  deleteHighLight,
  editHighLight,
  addHighLight,
  deleteEducation,
  editEducation,
  addEducation,
  deleteBusinessDriver,
  editBusinessDriver,
  addBusinessDriver,
  editPreviousRole,
  addPreviousRole,
  deletePreviousRole,
  editPresentRole,
  addImmediateNeeds,
  editImmediateNeeds,
  deleteImmediateNeeds,
  getProfileById,
  updateProfile,
  addAssociatedEmail,
  addAssociatedEmailLogic,
  changePassword,
  updateLocation,
  getUsersByDomain,
  manualAddWorkEmail,
  deleteUser,
  deleteWorkEmail,
  uploadPhoto,
};
