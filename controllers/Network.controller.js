const { default: mongoose } = require("mongoose");
const Network = require("../models/Network.model");
const User = require("../models/User.model");
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
    radius,
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
      radius,
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
      radius,
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
  const { latitude, longitude } = req.query;

  // Ensure required parameters are provided and are numbers
  if (!latitude || !longitude) {
    return res
      .status(400)
      .json({ message: "Missing required parameters: latitude or longitude" });
  }

  const userLat = parseFloat(latitude);
  const userLng = parseFloat(longitude);

  if (isNaN(userLat) || isNaN(userLng)) {
    return res.status(400).json({ message: "Invalid parameter values" });
  }

  // Haversine distance calculation
  function calculateDistance(lat1, lng1, lat2, lng2) {
    const toRad = (value) => (value * Math.PI) / 180;

    const R = 6371e3; // Earth's radius in meters
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lng2 - lng1);

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  try {
    const networks = await Network.find(); // Fetch all networks from the database

    if (!networks.length) {
      return res.status(404).json({ message: "No networks found" });
    }

    // Find networks where the user is within the network's radius
    const userWithinNetworks = networks.filter((network) => {
      const distance = calculateDistance(
        userLat,
        userLng,
        network.coordinates.coordinates[1],
        network.coordinates.coordinates[0]
      );

      return distance <= network.radius; // Check if user is within the network's radius
    });

    if (!userWithinNetworks.length) {
      return res
        .status(404)
        .json({ message: "No networks found within range" });
    }

    return res.json(userWithinNetworks);
  } catch (error) {
    console.error("Error finding nearby networks:", error);
    return res.status(500).json({ message: "Error finding nearby networks" });
  }
};
const editNetwork = async (req, res) => {
  try {
    const { networkId } = req.params;
    const { updatedNetwork } = req.body;
    if (!networkId || !updatedNetwork) {
      return res.status(400).json({
        message: "Invalid request: Missing networkId or updatedNetwork",
      });
    }

    const updatedNetworkResult = await Network.findByIdAndUpdate(
      networkId,
      updatedNetwork,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedNetworkResult) {
      return res.status(404).json({ message: "Network not found" });
    }

    res.status(200).json({
      message: "Network updated successfully",
      data: updatedNetworkResult,
    });
  } catch (error) {
    console.error("Error updating Network:", error);
    res.status(500).json({
      message: "An error occurred while updating the Network",
      error: error.message,
    });
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
    const network = await Network.findByIdAndUpdate(networkId, {
      $set: { Deleted: true },
    });
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
const changeUserActivity = async (req, res) => {
  const { networkId, userId } = req.params;
  const { isActive } = req.body; // Get from request body

  try {
    const network = await Network.findById(networkId);
    if (!network) {
      return res.status(404).json({ message: "Network not found" });
    }

    const userIndex = network.Accepted.findIndex(
      (user) => user.userId.toString() === userId
    );

    if (userIndex === -1) {
      return res.status(404).json({ message: "User not found in the network" });
    }

    network.Accepted[userIndex].ManualInActive = !isActive; // Use `isActive` from body
    const updatedNetwork = await network.save();

    return res.status(200).json({
      message: "User activity updated successfully",
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
  changeUserActivity,
  editNetwork,
};
