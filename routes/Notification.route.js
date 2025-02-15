const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  GetNotifications,
  markAllAsSeen,
} = require("../controllers/Notification.controller");

const router = express.Router();

router.get("/getNotifications/:userId", protect, GetNotifications);
router.put("/markAllAsSeen/:userId", protect, markAllAsSeen);

module.exports = router;
