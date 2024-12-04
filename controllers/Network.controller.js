const { default: mongoose } = require("mongoose");
const Network = require("../models/Network.model");

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
  if (
    !name ||
    !startDate ||
    !endDate ||
    !size ||
    !orgId ||
    !adminId ||
    !type ||
    !latitude ||
    !longitude
  ) {
    return res.status(400).json({ message: "Invalid request" });
  }
  try {
    const network = new Network({
      name,
      startDate,
      endDate,
      size,
      orgId,
      adminId,
      type,
      longitude,
      latitude,
    });
    await network.save();
    return res.status(201).json({ message: "Network created successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
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

    if (isUserPending || isUserApproved || isUserRejected) {
      return res.status(400).json({
        message: "User is already in the Pending/approved/rejected list",
      });
    }

    // Add the userId to the Pending list
    // Here, userId is already an ObjectId in string format
    network.Pending.push({ userId: userId });

    // Save the network document with the updated Pending list
    await network.save();
    return res.status(200).json({ message: "Join request sent successfully" });
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
    console.log(network.Pending);

    // Check if the userId exists in the Pending list
    const isPending = network.Pending.some(
      (pendingUser) => pendingUser.userId.toString() === userId.toString()
    );
    if (!isPending) {
      return res
        .status(400)
        .json({ message: "User is not in the Pending list" });
    }
    await Network.findByIdAndUpdate(networkId, {
      $push: { Accepted: { userId } }, // Add userId to Accepted array
      $pull: { Pending: { userId } }, // Remove userId from Pending array
    });

    return res
      .status(200)
      .json({ message: "Join request approved successfully" });
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
    await Network.findByIdAndUpdate(networkId, {
      $push: { Rejected: { userId } }, // Add userId to Accepted array
      $pull: { Pending: { userId } }, // Remove userId from Pending array
    });

    return res
      .status(200)
      .json({ message: "Join request approved successfully" });
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
};
/*

4. Location-Based APIs
a) Find Nearby Networks







*/
