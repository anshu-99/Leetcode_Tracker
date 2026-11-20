const excelService = require('../services/excel.service');

function handleExportExcel(req, res) {
  try {
    const { items, originalFileName } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items available to export' });
    }

    const buffer = excelService.createEnrichedWorkbook(items);

    const baseName = (originalFileName || 'LeetCode_Student_Roster').replace(/\.[^/.]+$/, '');
    const downloadName = `${baseName}_Enriched_${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    res.setHeader('Content-Length', buffer.length);
    return res.end(buffer);
  } catch (error) {
    console.error('[Export Controller Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate Excel file: ' + error.message });
  }
}

function handleDownloadSample(req, res) {
  try {
    const buffer = excelService.createSampleWorkbook();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Sample_MultiTab_LeetCode_Roster.xlsx"');
    res.setHeader('Content-Length', buffer.length);
    return res.end(buffer);
  } catch (error) {
    console.error('[Sample Excel Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to create sample template: ' + error.message });
  }
}

module.exports = {
  handleExportExcel,
  handleDownloadSample
};
