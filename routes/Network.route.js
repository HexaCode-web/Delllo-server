const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  createNetwork,
  getOrgNetwork,
  deleteNetwork,
  JoinRequest,
  approveRequest,
  rejectRequest,
  getNetwork,
  getNearbyNetworks,
  dismissRequest,
  createMeetRequest,
  acceptMeetRequest,
  getMeetingRequest,
  rejectMeetRequest,
} = require("../controllers/Network.controller");

const router = express.Router();
router.get("/getNetwork/:networkId", getNetwork);
router.get("/nearby", getNearbyNetworks);
router.get("/getOrgNetworks/:orgId", getOrgNetwork);
router.delete("/deleteNetwork/:networkId", protect, deleteNetwork);
router.post("/addNetwork", protect, createNetwork);

router.put("/JoinRequest/:networkId/:userId", protect, JoinRequest);
router.put("/ApproveRequest/:networkId/:userId", protect, approveRequest);
router.put("/RejectRequest/:networkId/:userId", protect, rejectRequest);
router.put("/DismissNetwork/:networkId/:userId", protect, dismissRequest);

router.post("/CreateMeetRequest", protect, createMeetRequest);
router.put("/AcceptMeetRequest/:meetRequestID", protect, acceptMeetRequest);
router.put("/rejectMeetRequest/:meetRequestID", protect, rejectMeetRequest);
router.get("/getMeetRequest", protect, getMeetingRequest);
module.exports = router;
