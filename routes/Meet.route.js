const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  createMeetRequest,
  acceptMeetRequest,
  getMeetingRequest,
  rejectMeetRequest,
  getMeetRequestsForUser,
  getAcceptedMeetRequestsForUser,
} = require("../controllers/Meet.controller");

const router = express.Router();

router.post("/CreateMeetRequest", protect, createMeetRequest);
router.put("/AcceptMeetRequest/:meetRequestID", protect, acceptMeetRequest);
router.put("/rejectMeetRequest/:meetRequestID", protect, rejectMeetRequest);
router.get("/getMeetRequest", protect, getMeetingRequest);
router.get("/getMeetRequestForUser/:user/:networkID", getMeetRequestsForUser);
router.get(
  "/getAcceptedMeetRequestForUser/:user/:networkID",
  getAcceptedMeetRequestsForUser
);
module.exports = router;
