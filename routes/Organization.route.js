const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  registerOrganization,
  addAdmin,
  updateOrganization,
  removeAdmin,
  deleteOrganization,
  getOrgById,
} = require("../controllers/organization.controller.js");
const router = express.Router();
router.get("/:orgId", protect, getOrgById);
router.post("/add", protect, registerOrganization);
router.put("/addAdmin", protect, addAdmin);
router.put("/update/:OrgId", protect, updateOrganization);
router.delete("/removeAdmin", protect, removeAdmin);
router.delete("/delete/:OrgId", protect, deleteOrganization);
module.exports = router;
