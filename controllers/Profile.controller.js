const User = require("../models/User.model");
const Organization = require("../models/Organization.model");

//skills
const addSkill = async (req, res) => {
  try {
    const { userId } = req;
    const { skill } = req.body;
    console.log(skill, userId);

    if (!userId || !skill) {
      return res.status(400).json({ message: "Invalid request" });
    }
    if (!["beginner", "Intermediate", "Advanced"].includes(skill.Level)) {
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

    if (!userId || !highLightId || !updatedHighLight) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const user = await User.findOneAndUpdate(
      { _id: userId, "highLights._id": highLightId },
      {
        $set: {
          "highlights.$": updatedHighLight,
        },
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User or highlight not found" });
    }

    res.status(200).json({ message: "highlight updated successfully", user });
  } catch (error) {
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
      { $pull: { highLights: { _id: highLightId } } },
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
  console.log(email);

  try {
    const user = await User.findById(userId);
    // Perform the logic to associate email with the user
    const organization = await Organization.findOne({
      admins: { $elemMatch: { Email: email } },
    });

    if (!organization || !user) {
      return res.status(404).send("Organization or user not found.");
    }
    if (user.associatedEmails.includes(email)) {
      return res
        .status(400)
        .send("Email is already associated with this user.");
    }
    const adminEntry = organization.admins.find(
      (admin) => admin.Email === email
    );

    if (!adminEntry || adminEntry.acceptedInvite) {
      return res.status(400).send("Invalid or already accepted invite.");
    }

    // Update the invite status
    adminEntry.acceptedInvite = true;
    user.associatedEmails.push({ email });

    await user.save();
    await organization.save();

    return res.send(
      `<html>
        <body style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
          <h1>Invite Accepted!</h1>
          <p>Thank you for accepting the invite to join the organization.</p>
        </body>
      </html>`
    );
  } catch (error) {
    return res.status(500).send(error);
  }
};
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
  editPresentRole,
  updateProfile,
  addAssociatedEmail,
};
