const { default: mongoose } = require("mongoose");
const Network = require("../models/Network.model");
const User = require("../models/User.model");
const MeetRequest = require("../models/MeetRequest.model");
const createNetwork = async (req, res) => {
  const {
    name,
    startDate,
    endDate,
    size,
    orgId,
    adminId,
    type,
    latitude,
    longitude,
  } = req.body;

  // Validate request fields
  if (
    [
      name,
      startDate,
      endDate,
      size,
      orgId,
      adminId,
      type,
      latitude,
      longitude,
    ].some((field) => !field)
  ) {
    return res.status(400).json({ message: "Invalid request: Missing fields" });
  }

  try {
    // Parse latitude and longitude as floats
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ message: "Invalid coordinates" });
    }

    // Create a new network
    const network = new Network({
      name,
      startDate,
      endDate,
      size,
      orgId,
      adminId,
      type,
      Accepted: [{ userId: adminId }],
      coordinates: {
        type: "Point",
        coordinates: [lng, lat], // GeoJSON format [longitude, latitude]
      },
    });

    // Save the network
    const savedNetwork = await network.save();

    // Update the admin's joinedNetworks
    const updatedUser = await User.findByIdAndUpdate(
      adminId,
      {
        $push: { joinedNetworks: { networkId: savedNetwork._id } },
      },
      { new: true }
    );

    // Respond with success
    return res.status(201).json({
      message: "Network created successfully",
      network: savedNetwork,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error creating network:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const getNearbyNetworks = async (req, res) => {
  const { latitude, longitude, radius } = req.query;

  // Ensure required parameters are provided
  if (!latitude || !longitude || !radius) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  try {
    // Query MongoDB to find networks within the specified radius
    const networks = await Network.find({
      coordinates: {
        $geoWithin: {
          $centerSphere: [
            [parseFloat(longitude), parseFloat(latitude)],
            parseFloat(radius) / 3963.2,
          ], // Radius in miles (3963.2 is Earth's radius in miles)
        },
      },
    });

    // Return the networks as a response
    return res.json(networks);
  } catch (error) {
    console.error("Error finding nearby networks:", error);
    return res.status(500).json({ message: "Error finding nearby networks" });
  }
};

const getNetwork = async (req, res) => {
  const { networkId } = req.params;
  try {
    const network = await Network.findById(networkId);
    if (!network) {
      return res.status(404).json({ message: "Network not found" });
    }
    return res.status(200).json(network);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};
const getOrgNetwork = async (req, res) => {
  const { orgId } = req.params;
  try {
    const networks = await Network.find({ orgId });
    if (!networks) {
      return res.status(404).json({ message: "No networks found" });
    }
    return res.status(200).json(networks);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};
const deleteNetwork = async (req, res) => {
  const { networkId } = req.params;
  try {
    const network = await Network.findByIdAndDelete(networkId);
    if (!network) {
      return res.status(404).json({ message: "Network not found" });
    }
    return res.status(200).json({ message: "Network deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};
const JoinRequest = async (req, res) => {
  const { networkId, userId } = req.params;

  try {
    const network = await Network.findById(networkId);

    if (!network) {
      return res.status(404).json({ message: "Network not found" });
    }

    // Check if userId is already in the Pending list
    const isUserPending = network.Pending.some(
      (pendingUser) => pendingUser.userId.toString() === userId.toString()
    );
    const isUserRejected = network.Rejected.some(
      (RejectedUser) => RejectedUser.userId.toString() === userId.toString()
    );
    const isUserApproved = network.Accepted.some(
      (AcceptedUser) => AcceptedUser.userId.toString() === userId.toString()
    );
    const isUserDismissed = network.Dismissed.some(
      (AcceptedUser) => AcceptedUser.userId.toString() === userId.toString()
    );
    if (isUserPending || isUserApproved || isUserRejected || isUserDismissed) {
      return res.status(400).json({
        message: "User is already in the Pending/approved/rejected list",
      });
    }

    const updatedNetwork = await Network.findByIdAndUpdate(
      networkId,
      {
        $push: { Pending: { userId } }, // Add userId to Accepted array
      },
      {
        new: true, // Return the updated document
      }
    );
    // Save the network document with the updated Pending list
    await network.save();
    return res.status(200).json({
      message: "Join request sent successfully",
      network: updatedNetwork,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};
const approveRequest = async (req, res) => {
  const { networkId, userId } = req.params;
  try {
    const network = await Network.findById(networkId);

    if (!network) {
      return res.status(404).json({ message: "Network not found" });
    }

    // Check if the userId exists in the Pending list
    const isPending = network.Pending.some(
      (pendingUser) => pendingUser.userId.toString() === userId.toString()
    );
    if (!isPending) {
      return res
        .status(400)
        .json({ message: "User is not in the Pending list" });
    }
    const updatedNetwork = await Network.findByIdAndUpdate(
      networkId,
      {
        $push: { Accepted: { userId } }, // Add userId to Accepted array
        $pull: { Pending: { userId } }, // Remove userId from Pending array
      },
      {
        new: true, // Return the updated document
      }
    );
    const updatedUser = await User.findByIdAndUpdate(userId, {
      $push: { joinedNetworks: { networkId } }, // Add userId to Accepted array
    });
    return res.status(200).json({
      message: "Join request approved successfully",
      network: updatedNetwork,
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};
const rejectRequest = async (req, res) => {
  const { networkId, userId } = req.params;
  try {
    const network = await Network.findById(networkId);

    if (!network) {
      return res.status(404).json({ message: "Network not found" });
    }

    // Check if the userId exists in the Pending list
    const isPending = network.Pending.some(
      (pendingUser) => pendingUser.userId.toString() === userId.toString()
    );
    if (!isPending) {
      return res
        .status(400)
        .json({ message: "User is not in the Pending list" });
    }
    const updatedNetwork = await Network.findByIdAndUpdate(
      networkId,
      {
        $push: { Rejected: { userId } }, // Add userId to Accepted array
        $pull: { Pending: { userId } }, // Remove userId from Pending array
      },
      {
        new: true, // Return the updated document
      }
    );

    return res.status(200).json({
      message: "Join request approved successfully",
      network: updatedNetwork,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};
const dismissRequest = async (req, res) => {
  const { networkId, userId } = req.params;
  try {
    const network = await Network.findById(networkId);
    if (!network) {
      return res.status(404).json({ message: "Network not found" });
    }
    // Check if the userId exists in the Pending list
    const isUserPending = network.Pending.some(
      (pendingUser) => pendingUser.userId.toString() === userId.toString()
    );
    const isUserRejected = network.Rejected.some(
      (RejectedUser) => RejectedUser.userId.toString() === userId.toString()
    );
    const isUserApproved = network.Accepted.some(
      (AcceptedUser) => AcceptedUser.userId.toString() === userId.toString()
    );
    const isUserDismissed = network.Dismissed.some(
      (AcceptedUser) => AcceptedUser.userId.toString() === userId.toString()
    );
    if (isUserPending || isUserApproved || isUserRejected || isUserDismissed) {
      return res.status(400).json({
        message:
          "User is already in the Pending/approved/rejected/dismissed  list",
      });
    }
    const updatedNetwork = await Network.findByIdAndUpdate(
      networkId,
      {
        $push: { Dismissed: { userId } }, // Add userId to Accepted array
      },
      {
        new: true, // Return the updated document
      }
    );
    return res.status(200).json({
      message: "Request dismissed successfully",
      network: updatedNetwork,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  createNetwork,
  getOrgNetwork,
  deleteNetwork,
  getNetwork,
  JoinRequest,
  approveRequest,
  rejectRequest,
  getNearbyNetworks,
  dismissRequest,
};
