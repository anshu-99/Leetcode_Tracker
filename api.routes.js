const express = require('express');
const multer = require('multer');
const config = require('../../config/app.config');

const uploadController = require('../controllers/upload.controller');
const leetcodeController = require('../controllers/leetcode.controller');
const exportController = require('../controllers/export.controller');

const router = express.Router();

// Configure Multer for in-memory file handling
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: config.MAX_FILE_SIZE_BYTES }
});

// Routes
router.post('/upload', upload.single('file'), uploadController.handleUpload);
router.post('/fetch-single', leetcodeController.handleFetchSingle);
router.post('/batch-fetch-sse', leetcodeController.handleBatchFetchSSE);
router.post('/export-excel', exportController.handleExportExcel);
router.get('/sample-excel', exportController.handleDownloadSample);

module.exports = router;
