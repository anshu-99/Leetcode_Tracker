const leetcodeService = require('../services/leetcode.service');
const { extractUsername } = require('../utils/usernameParser');
const config = require('../../config/app.config');

async function handleFetchSingle(req, res) {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ success: false, message: 'Username is required' });
  }

  try {
    const data = await leetcodeService.fetchUserProfile(username);
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(404).json({
      success: false,
      username,
      message: error.message || 'Failed to retrieve LeetCode profile'
    });
  }
}

async function handleBatchFetchSSE(req, res) {
  const { students, profileColumn, nameColumn, idColumn } = req.body;

  if (!students || !Array.isArray(students) || students.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid students list' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const total = students.length;
  let completed = 0;
  let successCount = 0;
  let failedCount = 0;

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  sendEvent('start', { total });

  const CONCURRENCY = config.CONCURRENCY_LIMIT;
  let index = 0;

  async function worker() {
    while (index < students.length) {
      const currentIndex = index++;
      const studentRow = students[currentIndex];
      const sheetName = studentRow._sheetName || 'Sheet1';
      
      let rawInput = studentRow[profileColumn] || '';
      if (!rawInput) {
        for (const [k, v] of Object.entries(studentRow)) {
          if (k.toLowerCase().includes('leetcode') || String(v).includes('leetcode.com')) {
            rawInput = v;
            break;
          }
        }
      }

      let studentName = (nameColumn && studentRow[nameColumn]) ? studentRow[nameColumn] : '';
      if (!studentName) {
        for (const [k, v] of Object.entries(studentRow)) {
          if (k.toLowerCase().includes('name') && !k.startsWith('_')) {
            studentName = v;
            break;
          }
        }
      }

      let studentId = (idColumn && studentRow[idColumn]) ? studentRow[idColumn] : '';
      if (!studentId) {
        for (const [k, v] of Object.entries(studentRow)) {
          if ((k.toLowerCase().includes('roll') || k.toLowerCase().includes('email') || k.toLowerCase().includes('id')) && !k.startsWith('_')) {
            studentId = v;
            break;
          }
        }
      }

      const username = extractUsername(rawInput);
      let studentResult = {
        rowIndex: currentIndex,
        sheetName,
        rawInput,
        studentName,
        studentId,
        username: username || rawInput,
        originalRow: studentRow,
        status: 'pending'
      };

      if (!username) {
        studentResult.status = 'error';
        studentResult.error = 'No valid LeetCode username or URL found';
        failedCount++;
      } else {
        try {
          const stats = await leetcodeService.fetchUserProfile(username);
          studentResult = {
            ...studentResult,
            ...stats,
            studentName: studentName || stats.realName || stats.username,
            status: 'success'
          };
          successCount++;
        } catch (err) {
          studentResult.status = 'error';
          studentResult.error = err.message || 'Profile fetch failed';
          failedCount++;
        }
      }

      completed++;
      sendEvent('item', {
        item: studentResult,
        progress: {
          completed,
          total,
          percent: Math.round((completed / total) * 100),
          successCount,
          failedCount
        }
      });

      await new Promise(resolve => setTimeout(resolve, config.REQUEST_SPACING_MS));
    }
  }

  const workers = Array(Math.min(CONCURRENCY, students.length))
    .fill(0)
    .map(() => worker());

  await Promise.all(workers);

  sendEvent('complete', {
    total,
    successCount,
    failedCount
  });

  res.end();
}

module.exports = {
  handleFetchSingle,
  handleBatchFetchSSE
};
