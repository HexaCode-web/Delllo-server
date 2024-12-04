const User = require("../models/User.model");
const jwt = require("jsonwebtoken");
const OTP = require("../models/OTP.model");
const registerUser = async (req, res) => {
  const { name, email, password, latitude, longitude } = req.body;
  try {
    //check if user Exists
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "user already exists" });

    const checkForOTP = await OTP.findOne({ contactInfo: email });
    console.log(checkForOTP, email);

    if (!checkForOTP.verified)
      return res.status(400).json({ message: "OTP not verified" });
    if (checkForOTP.verified) {
      await OTP.findByIdAndDelete(checkForOTP._id);
    }

    //Create the user
    const user = new User({ name, email, password, latitude, longitude });
    await user.save();
    //build the token
    const token = jwt.sign({ userID: user._id }, process.env.SecretKey, {
      expiresIn: "1h",
    });
    res.status(201).json({ token });
    //send the token back
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error registering user", error: error.message });
  }
};
const loginUser = async (req, res) => {
  const { email, password, latitude, longitude } = req.body;
  try {
    //check if user Exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User doesn't exist" });

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch || !latitude || !longitude)
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

const sendOTP = async (req, res) => {
  const { email } = req.body;
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ message: "Invalid email address" });
  }
  const userExists = await User.findOne({ email });
  if (userExists)
    return res.status(400).json({ message: "user already exists" });
  const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();

  const getEmailHTML = (otp) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border: 1px solid #dddddd;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .email-header {
            background-color: #007BFF;
            color: #ffffff;
            padding: 20px;
            text-align: center;
          }
          .email-header h1 {
            margin: 0;
            font-size: 24px;
          }
          .email-body {
            padding: 20px;
          }
          .otp-code {
            font-size: 32px;
            font-weight: bold;
            color: #007BFF;
            text-align: center;
            margin: 20px auto;
            padding: 10px;
            border: 1px dashed #007BFF;
            display: inline-block;
            background: #f9f9f9;
          }
          .email-footer {
            background-color: #f4f4f4;
            color: #555555;
            font-size: 12px;
            padding: 10px 20px;
            text-align: center;
            border-top: 1px solid #dddddd;
          }
          .email-footer a {
            color: #007BFF;
            text-decoration: none;
          }
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

  const emailData = {
    sender: {
      name: "delllootp",
      email: "delllootp@noreply.com",
    },
    to: [
      {
        email: email,
      },
    ],
    subject: "Delllo OTP",
    htmlContent: emailHtml,
  };

  const requestOptions = {
    method: "POST",
    headers: {
      accept: "application/json",
      // eslint-disable-next-line no-undef
      "api-key": process.env.MailKey,
      "content-type": "application/json",
    },
    body: JSON.stringify(emailData),
  };
  try {
    const response = await fetch(
      "https://api.brevo.com/v3/smtp/email",
      requestOptions
    );
    if (!response.ok) {
      throw new Error(
        `Email sending failed with status: ${response.status} ${response.message}`
      );
    }
    await OTP.create({
      contactInfo: email,
      code: generatedOTP,
    });

    res.status(200).json({ message: "Email was sent successfully" });
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
