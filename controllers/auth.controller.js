const User = require("../models/User.model");
const jwt = require("jsonwebtoken");
const OTP = require("../models/OTP.model");
const nodemailer = require("nodemailer");

const registerUser = async (req, res) => {
  const {
    FirstName,
    LastName,
    email,
    password,
    latitude,
    longitude,
    DOB,
    Address,
  } = req.body;

  try {
    // Check if user already exists based on primary email
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    // Check for OTP
    const checkForOTP = await OTP.findOne({ contactInfo: email });
    if (!checkForOTP || !checkForOTP.verified) {
      return res.status(400).json({ message: "OTP not verified" });
    }

    // Clean up associatedEmails to avoid null or empty values

    // If OTP is verified, delete OTP record
    await OTP.findByIdAndDelete(checkForOTP._id);

    // Create user with clean associatedEmails
    const user = new User({
      FirstName,
      LastName,
      email,
      password,
      latitude,
      longitude,
      DOB,
      Address,
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign({ userID: user._id }, process.env.SecretKey, {
      expiresIn: "2h",
    });

    res.status(200).json({ token });
  } catch (error) {
    console.log(error); // Log the error for debugging
    res
      .status(500)
      .json({ message: "Error registering user", error: error.message });
  }
};

const loginUser = async (req, res) => {
  const { email, password, latitude, longitude } = req.body;
  console.log("login attempt");

  try {
    //check if user Exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User doesn't exist" });

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res
        .status(400)
        .json({ message: "Invalid credentials/missing coordinates" });

    user.longitude = longitude;
    user.latitude = latitude;
    await user.save();
    // Return JWT
    const token = jwt.sign({ userId: user._id }, process.env.SecretKey, {
      expiresIn: "1h",
    });
    user.password = "undefined";
    res.status(201).json({ token: token, user: user });
  } catch (error) {
    res.status(500).json({ message: "Error while trying to login", error });
  }
};
const transporter = nodemailer.createTransport({
  host: "mail.harptec.com",
  port: 587,
  secure: false,
  auth: {
    user: "delllootp@harptec.com",
    pass: "admin123",
  },
  tls: {
    rejectUnauthorized: false,
    ciphers: "SSLv3",
  },
});
const sendOTP = async (req, res) => {
  const { email } = req.body;

  // Validate email
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ message: "Invalid email address" });
  }

  // Check if the user exists (optional based on your use case)
  const userExists = await User.findOne({ email });
  if (userExists)
    return res.status(400).json({ message: "User already exists" });

  // Generate new OTP
  const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();

  // HTML email content
  const getEmailHTML = (otp) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          /* Styling for the email */
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h1>Your OTP Code</h1>
          </div>
          <div class="email-body">
            <p>Hello,</p>
            <p>We received a request to access your account. Use the code below to complete the verification process. This OTP is valid for 10 minutes.</p>
            <div class="otp-code">${otp}</div>
            <p>If you didn't request this code, please ignore this email or contact our support team.</p>
          </div>
          <div class="email-footer">
            <p>Thank you for using our service!</p>
            <p><a href="https://example.com">Visit our website</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const emailHtml = getEmailHTML(generatedOTP);

  const mailOptions = {
    from: "delllootp@harptec.com",
    to: email,
    subject: "Delllo OTP",
    html: emailHtml,
  };

  try {
    // Check if OTP already exists for the email
    let otpRecord = await OTP.findOne({ contactInfo: email });

    if (otpRecord) {
      // If OTP exists, update it with new OTP and reset verified status
      otpRecord.code = generatedOTP;
      otpRecord.verified = false;
      otpRecord.expiryTime = Date.now() + 10 * 60 * 1000; // 10 minutes validity
      await otpRecord.save(); // Save the updated OTP record
    } else {
      // If no OTP exists for the email, create a new record
      otpRecord = new OTP({
        contactInfo: email,
        code: generatedOTP,
        verified: false,
        expiryTime: Date.now() + 10 * 60 * 1000, // 10 minutes validity
      });
      await otpRecord.save(); // Save the new OTP record
    }

    // Send the OTP email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Error: ", error);
      } else {
        console.log("Email sent: ", info.response);
      }
    });

    // Respond to the client
    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const verifyOTP = async (req, res) => {
  const { email, sentOTP } = req.body;

  // Validate input
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ message: "Invalid email address" });
  }
  if (!sentOTP) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  try {
    // Retrieve the OTP document
    const oldOtp = await OTP.findOne({ contactInfo: email });

    if (!oldOtp) {
      return res.status(404).json({ message: "OTP not found or expired" });
    }

    // Check if OTP has expired
    if (new Date() > oldOtp.expireAt) {
      await OTP.findByIdAndDelete(oldOtp._id); // Clean up expired OTP
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Verify OTP
    if (oldOtp.code !== sentOTP) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Delete OTP document after successful verification
    await OTP.findByIdAndUpdate(oldOtp._id, { verified: true }, { new: true });

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { loginUser, registerUser, sendOTP, verifyOTP };
