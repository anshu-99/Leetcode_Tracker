const excelService = require('../services/excel.service');

function handleUpload(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file was uploaded.' });
    }

    const parsedData = excelService.parseUploadedWorkbook(req.file.buffer);

    return res.json({
      success: true,
      fileName: req.file.originalname,
      ...parsedData
    });
  } catch (error) {
    console.error('[Upload Controller Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to parse Excel file: ' + error.message
    });
  }
}

module.exports = {
  handleUpload
};
