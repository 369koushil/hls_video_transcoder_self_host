const express = require("express");
const router = express.Router();
const videoService = require("../services/video.service");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

router.post("/upload", upload.single("video"), videoService.uploadVideo);

module.exports = router;
