const express = require("express");
const { check, validationResult } = require("express-validator");
const {
  loginUser,
  registerUser,
  sendOTP,
  verifyOTP,
} = require("../controllers/Auth.controller.js");
const router = express.Router();

router.post(
  "/register",
  [
    check("LastName").notEmpty().withMessage("LastName is required"),
    check("FirstName").notEmpty().withMessage("FirstName is required"),
    check("email").isEmail().withMessage("Email is not valid"),
    check("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    registerUser(req, res);
  }
);
router.post("/login", (req, res) => {
  loginUser(req, res);
});

router.post("/send-Otp", (req, res) => {
  sendOTP(req, res);
});
router.post("/verify-Otp", (req, res) => {
  verifyOTP(req, res);
});
module.exports = router;
