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
  changeUserActivity,
  editNetwork,
  removeUser,
} = require("../controllers/Network.controller");

const router = express.Router();
router.get("/getNetwork/:networkId", getNetwork);
router.get("/nearby", getNearbyNetworks);
router.get("/getOrgNetworks/:orgId", getOrgNetwork);
router.patch("/deleteNetwork/:networkId", protect, deleteNetwork);
router.post("/addNetwork", protect, createNetwork);
router.patch("/updateNetwork/:networkId", protect, editNetwork);
router.put("/JoinRequest/:networkId/:userId", protect, JoinRequest);
router.put("/ApproveRequest/:networkId/:userId", protect, approveRequest);
router.put("/RejectRequest/:networkId/:userId", protect, rejectRequest);
router.put("/DismissNetwork/:networkId/:userId", protect, dismissRequest);
router.put("/ToggleActivity/:networkId/:userId", protect, changeUserActivity);
router.put("/RemoveUser/:networkId/:userId", protect, removeUser);

module.exports = router;
