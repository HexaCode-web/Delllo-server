const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  addSkill,
  deleteSkill,
  editSkill,
  addHighLight,
  editHighLight,
  deleteHighLight,
  deleteEducation,
  editEducation,
  addEducation,
  deleteBusinessDriver,
  editBusinessDriver,
  addBusinessDriver,
  editPresentRole,
  updateProfile,
  addAssociatedEmail,
  editPreviousRole,
  addPreviousRole,
  deletePreviousRole,
  deleteImmediateNeeds,
  editImmediateNeeds,
  addImmediateNeeds,
  getProfileById,
  changePassword,
  updateLocation,
  getUsersByDomain,
  manualAddWorkEmail,
  deleteUser,
  deleteWorkEmail,
  uploadPhoto,
} = require("../controllers/Profile.controller");
const upload = require("../functions/fileUpload");
const router = express.Router();

// Routes
//skills
router.post("/skills/add/:id", protect, addSkill);
router.put("/skills/update/:id", protect, editSkill);
router.delete("/skills/delete/:id", protect, deleteSkill);
//highlights
router.post("/highLights/add/:id", protect, addHighLight);
router.put("/highLights/update/:id", protect, editHighLight);
router.delete("/highLights/delete/:id", protect, deleteHighLight);
//Education
router.post("/education/add/:id", protect, addEducation);
router.put("/education/update/:id", protect, editEducation);
router.delete("/education/delete/:id", protect, deleteEducation);
///businessDriver
router.post("/businessDriver/add/:id", protect, addBusinessDriver);
router.put("/businessDriver/update/:id", protect, editBusinessDriver);
router.delete("/businessDriver/delete/:id", protect, deleteBusinessDriver);
//ImmediateNeed
router.post("/ImmediateNeed/add/:id", protect, addImmediateNeeds);
router.put("/ImmediateNeed/update/:id", protect, editImmediateNeeds);
router.delete("/ImmediateNeed/delete/:id", protect, deleteImmediateNeeds);
//PreviousRole
router.post("/previousRole/add/:id", protect, addPreviousRole);
router.put("/previousRole/update/:id", protect, editPreviousRole);
router.delete("/previousRole/delete/:id", protect, deletePreviousRole);
//present role routes
router.put("/presentRole/update/:Id", protect, editPresentRole);
//general routes
router.put("/updateProfile/:Id", protect, updateProfile);
router.patch("/updateLocation/:Id", protect, updateLocation);
router.put("/updatePassword/:Id", protect, changePassword);
router.get("/:id", getProfileById);
router.get("/GetByDomain/:domain", getUsersByDomain);
router.delete("/delete/:id", protect, deleteUser);
//work Email routes
router.post("/manualAddWorkEmail/:Id", protect, manualAddWorkEmail);
router.get("/addAssociatedEmail/:userId/:email", addAssociatedEmail);
router.delete("/deleteWorkEmail/:id", protect, deleteWorkEmail);
//photos
router.post("/uploadPhoto", upload.single("photo"), uploadPhoto);

module.exports = router;
