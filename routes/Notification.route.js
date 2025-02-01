const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { GetNotifications } = require("../controllers/Notification.controller");

const router = express.Router();

router.get("/getNotifications/:userId", protect, GetNotifications);

module.exports = router;
