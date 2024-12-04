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
} = require("../controllers/Network.controller");

const router = express.Router();
router.get("/getNetwork:/networkId", getNetwork);
router.get("/getOrgNetworks/:orgId", getOrgNetwork);
router.delete("/deleteNetwork/:networkId", protect, deleteNetwork);
router.post("/addNetwork", protect, createNetwork);

router.put("/JoinRequest/:networkId/:userId", protect, JoinRequest);
router.put("/ApproveRequest/:networkId/:userId", protect, approveRequest);
router.put("/RejectRequest/:networkId/:userId", protect, rejectRequest);
module.exports = router;
