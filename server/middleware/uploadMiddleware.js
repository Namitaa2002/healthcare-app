import multer from "multer";
import path from "path";
import fs from "fs";

// =========================================
// UPLOAD DIRECTORY
// =========================================

const uploadDirectory = path.join(
  process.cwd(),
  "uploads"
);

// Create uploads folder if it does not exist
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

// =========================================
// STORAGE
// =========================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(
      file.originalname
    );

    const uniqueName =
      `${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${extension}`;

    cb(null, uniqueName);
  },
});

// =========================================
// FILE FILTER
// =========================================

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    // Images
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",

    // PDF
    "application/pdf",

    // Documents
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    // Excel
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

    // Text
    "text/plain",

    // Audio
    "audio/webm",
    "audio/ogg",
    "audio/mp4",
    "audio/mpeg",
    "audio/wav",
    "audio/x-wav",
    "audio/aac",
  ];

  // =========================================
  // ALLOW COMMON AUDIO TYPES
  // =========================================

  if (
    file.mimetype &&
    file.mimetype.startsWith("audio/")
  ) {
    return cb(null, true);
  }

  // =========================================
  // ALLOW OTHER SUPPORTED FILE TYPES
  // =========================================

  if (
    allowedMimeTypes.includes(
      file.mimetype
    )
  ) {
    return cb(null, true);
  }

  return cb(
    new Error(
      "File type is not supported."
    ),
    false
  );
};

// =========================================
// MULTER CONFIGURATION
// =========================================

const upload = multer({
  storage,

  fileFilter,

  limits: {
    // 10 MB
    fileSize: 10 * 1024 * 1024,
  },
});

export default upload;