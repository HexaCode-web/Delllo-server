const MeetRequest = require("../models/MeetRequest.model");
const Notification = require("../models/Notification.model");
const createMeetRequest = async (req, res) => {
  const { networkID, userIDA, userIDB, purpose, senderName } = req.body;

  // Validate request body
  if (!networkID || !userIDA || !userIDB || !purpose) {
    return res
      .status(400)
      .json({ message: "Please provide all required fields" });
  }

  try {
    const existingRequest = await MeetRequest.findOne({
      networkID,
      meetResponse: { $in: ["waiting", "accepted"] },
      $or: [
        { userIDA, userIDB },
        { userIDA: userIDB, userIDB: userIDA },
      ],
    });
    if (existingRequest) {
      return res.status(400).json({
        message: "A meeting request between these users already exists",
      });
    }
    // Create a new meeting request
    const meetRequest = new MeetRequest({
      networkID,
      userIDA,
      userIDB,
      purpose,
      expiryPeriodinMins: 60,
      isSuggestion: false,
    });

    // Save the request to the database
    await meetRequest.save();
    if (global.activeUsers.has(userIDB)) {
      const userSocket = global.activeUsers.get(userIDB);

      // Emit real-time notification
      req.io.to(userSocket).emit("newNotification", {
        type: "meet Request", // Use the enum value from the schema
        message: `${senderName} wants to meet you for: ${purpose}`,
        metadata: {
          senderID: userIDA, // Store senderID in metadata
          senderName, // Store senderName in metadata
          requestId: meetRequest._id, // Store requestId in metadata
        },
      });

      // Create notification in the database
      await Notification.create({
        userId: userIDB,
        type: "meet Request", // Use the enum value from the schema
        message: `${senderName} wants to meet you for: ${purpose}`,
        metadata: {
          senderID: userIDA, // Store senderID in metadata
          senderName, // Store senderName in metadata
          requestId: meetRequest._id, // Store requestId in metadata
        },
        seen: false, // Default is false, but you can set it to true if needed
      });
    } else {
      // Create notification in the database (no real-time update)
      await Notification.create({
        userId: userIDB,
        type: "meet Request", // Use the enum value from the schema
        message: `${senderName} wants to meet you for: ${purpose}`,
        metadata: {
          senderID: userIDA, // Store senderID in metadata
          senderName, // Store senderName in metadata
          requestId: meetRequest._id, // Store requestId in metadata
        },
        seen: false, // Default is false
      });
    }
    res.status(201).json({
      message: "Meeting request created successfully",
      data: meetRequest,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
const acceptMeetRequest = async (req, res) => {
  const { meetRequestID } = req.params;

  try {
    // Use _id if the parameter is an ObjectID
    const meetRequest = await MeetRequest.findById(meetRequestID);

    if (!meetRequest) {
      return res.status(404).json({ message: "Meeting request not found" });
    }

    // Check if the meeting request has already been accepted or rejected
    if (meetRequest.meetResponse !== "waiting") {
      return res
        .status(400)
        .json({ message: "Meeting request has already been responded to" });
    }

    // Update the meetResponse to 'accepted'
    meetRequest.meetResponse = "accepted";
    await meetRequest.save();

    res.status(200).json({
      message: "Meeting request accepted successfully",
      data: meetRequest,
    });
  } catch (error) {
    console.error("Error accepting meeting request:", error);
    res.status(500).json({ message: "Server error" });
  }
};
const rejectMeetRequest = async (req, res) => {
  const { meetRequestID } = req.params;

  try {
    // Use _id if the parameter is an ObjectID
    const meetRequest = await MeetRequest.findById(meetRequestID);

    if (!meetRequest) {
      return res.status(404).json({ message: "Meeting request not found" });
    }

    if (meetRequest.meetResponse == "accepted") {
      return res
        .status(400)
        .json({ message: "Meeting request has already been responded to" });
    }

    // Update the meetResponse to 'accepted'
    meetRequest.meetResponse = "rejected";
    await meetRequest.save();

    res.status(200).json({
      message: "Meeting request rejected successfully",
      data: meetRequest,
    });
  } catch (error) {
    console.error("Error rejecting meeting request:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getMeetingRequest = async (req, res) => {
  const { userIDA, userIDB } = req.query;

  // Validate request query parameters
  if (!userIDA || !userIDB) {
    return res.status(400).json({ message: "Please provide userIDA, userIDB" });
  }

  try {
    const query = {
      meetResponse: { $in: ["waiting", "accepted"] },
      $or: [
        { userIDA: userIDA.toString(), userIDB: userIDB.toString() },
        { userIDA: userIDB.toString(), userIDB: userIDA.toString() },
      ],
    };

    const meetingRequest = await MeetRequest.findOne(query);

    if (!meetingRequest) {
      return res.status(404).json({ message: "Meeting request not found" });
    }

    res.status(200).json({
      message: "Meeting request retrieved successfully",
      data: meetingRequest,
    });
  } catch (error) {
    console.error("Error fetching meeting request:", error);
    res.status(500).json({ message: "Server error" });
  }
};
const getMeetRequestsForUser = async (req, res) => {
  const { user, networkID } = req.params;

  if (!user || !networkID) {
    return res.status(400).json({
      message: "Please provide userIDB and networkID",
    });
  }

  try {
    const meetingRequests = await MeetRequest.find({
      $or: [{ userIDA: user.trim() }, { userIDB: user.trim() }],
      networkID: networkID.trim(),
      meetResponse: "waiting",
    });
    console.log(meetingRequests);

    if (!meetingRequests.length) {
      return res.status(200).json({
        message: "No meeting requests found for this user in the network",
      });
    }

    res.status(200).json({
      message: "Meeting requests retrieved successfully",
      data: meetingRequests,
    });
  } catch (error) {
    console.error("Error fetching meeting requests:", error);
    res.status(500).json({ message: "Server error" });
  }
};
const getAcceptedMeetRequestsForUser = async (req, res) => {
  const { user } = req.params;

  if (!user) {
    return res.status(400).json({
      message: "Please provide userIDB and networkID",
    });
  }

  try {
    const meetingRequests = await MeetRequest.find({
      $or: [{ userIDA: user.trim() }, { userIDB: user.trim() }],
      meetResponse: "accepted",
    });
    if (!meetingRequests.length) {
      return res.status(200).json({
        message: "No meeting requests found for this user in the network",
      });
    }

    res.status(200).json({
      message: "Meeting requests retrieved successfully",
      data: meetingRequests,
    });
  } catch (error) {
    console.error("Error fetching meeting requests:", error);
    res.status(500).json({ message: "Server error" });
  }
};
const getConversation = async (req, res) => {
  const { id } = req.params;
  try {
    const meetRequest = await MeetRequest.findById(id);
    if (!meetRequest) {
      return res.status(404).json({ error: "Meet request not found" });
    }

    res.status(200).json(meetRequest.Conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createMeetRequest,
  acceptMeetRequest,
  getMeetingRequest,
  rejectMeetRequest,
  getMeetRequestsForUser,
  getAcceptedMeetRequestsForUser,
  getConversation,
};
