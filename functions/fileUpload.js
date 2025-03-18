const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Add debugging logs
console.log("Initializing multer configuration");

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("Multer destination function called");
    const uploadDir = "uploads/";

    // Check if uploads directory exists
    console.log(`Checking if directory exists: ${uploadDir}`);
    if (!fs.existsSync(uploadDir)) {
      console.log(`Creating directory: ${uploadDir}`);
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log("Directory created successfully");
      } catch (err) {
        console.error("Error creating directory:", err);
        return cb(err);
      }
    } else {
      console.log("Directory already exists");
    }

    // Check if directory is writable
    try {
      fs.accessSync(uploadDir, fs.constants.W_OK);
      console.log("Directory is writable");
    } catch (err) {
      console.error("Directory is not writable:", err);
      return cb(new Error("Upload directory is not writable"));
    }

    console.log("File details:", {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size ? file.size : "unknown",
    });

    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    console.log("Multer filename function called");
    console.log(`Original filename: ${file.originalname}`);

    // Optional: Check if a file with this name already exists
    const filePath = path.join("uploads/", file.originalname);
    if (fs.existsSync(filePath)) {
      console.log(`Warning: File already exists: ${filePath}`);
    }

    cb(null, file.originalname); // Using original filename
  },
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
  console.log("Multer fileFilter function called");
  console.log(`File mimetype: ${file.mimetype}`);

  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
  if (allowedTypes.includes(file.mimetype)) {
    console.log("File type is allowed");
    cb(null, true);
  } else {
    console.error(`Invalid file type: ${file.mimetype}`);
    cb(
      new Error(
        `Invalid file type: ${file.mimetype}. Only JPEG, PNG, and GIF are allowed.`
      ),
      false
    );
  }
};

// Initialize Multer with storage and file filter
console.log("Creating multer instance with config");
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  debug: true, // Enable debug mode if multer supports it
});

// Add a helper function to debug uploads
upload.debugUpload = function (req, res, next) {
  console.log("Starting file upload");
  console.log("Request headers:", req.headers);

  // Check if the request contains multipart data
  if (
    !req.headers["content-type"] ||
    !req.headers["content-type"].includes("multipart/form-data")
  ) {
    console.error("Request does not contain multipart/form-data");
  }

  this.single("photo")(req, res, (err) => {
    if (err) {
      console.error("Upload error:", err);
      return next(err);
    }

    console.log("Upload completed successfully");
    if (req.file) {
      console.log("File details:", {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        encoding: req.file.encoding,
        mimetype: req.file.mimetype,
        destination: req.file.destination,
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
      });
    } else {
      console.error("No file object in request");
    }

    next();
  });
};

console.log("Multer configuration complete");

module.exports = upload;
