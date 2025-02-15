const Notification = require("../models/Notification.model");
const User = require("../models/User.model");

const GetNotifications = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const notifications = await Notification.find({ userId: userId }).sort({
      createdAt: -1,
    });
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
};
const markAllAsSeen = async (req, res) => {
  try {
    const { userId } = req.params;

    // Mark all notifications for the user as seen
    await Notification.updateMany(
      { userId, seen: false }, // Only update unseen notifications
      { $set: { seen: true } }
    );

    res.json({ success: true, message: "All notifications marked as seen" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error marking notifications as seen",
      error: error.message,
    });
  }
};
module.exports = { GetNotifications, markAllAsSeen };
