const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  createMeetRequest,
  acceptMeetRequest,
  getMeetingRequest,
  rejectMeetRequest,
  getMeetRequestsForUser,
} = require("../controllers/Meet.controller");

const router = express.Router();

router.post("/CreateMeetRequest", protect, createMeetRequest);
router.put("/AcceptMeetRequest/:meetRequestID", protect, acceptMeetRequest);
router.put("/rejectMeetRequest/:meetRequestID", protect, rejectMeetRequest);
router.get("/getMeetRequest", protect, getMeetingRequest);
router.get(
  "/getMeetRequestForUser/:userIDB/:networkID",

  getMeetRequestsForUser
);
module.exports = router;
