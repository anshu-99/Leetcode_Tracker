const XLSX = require('xlsx');

/**
 * Parse an uploaded Excel or CSV buffer across all worksheets/tabs
 */
function parseUploadedWorkbook(fileBuffer) {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetNames = workbook.SheetNames;
  if (!sheetNames || sheetNames.length === 0) {
    throw new Error('The uploaded file contains no sheets.');
  }

  const sheetsInfo = [];
  const allRowsCombined = [];
  const allColumnsSet = new Set();

  sheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    if (rows && rows.length > 0) {
      const columns = Object.keys(rows[0]);
      columns.forEach(c => allColumnsSet.add(c));

      // Detect LeetCode Profile column
      let detectedProfileCol = columns.find(c => {
        const lower = c.toLowerCase().trim();
        return (
          lower.includes('leetcode') ||
          lower.includes('lc_link') ||
          lower.includes('lc_profile') ||
          lower.includes('lc_url') ||
          lower.includes('profile link') ||
          lower.includes('profile url') ||
          lower.includes('profile') ||
          lower.includes('leetcode_url') ||
          lower.includes('leetcode profile') ||
          lower.includes('user_link')
        );
      });

      if (!detectedProfileCol) {
        for (const col of columns) {
          const hasLeetcode = rows.some(r => String(r[col]).toLowerCase().includes('leetcode.com'));
          if (hasLeetcode) {
            detectedProfileCol = col;
            break;
          }
        }
      }

      // Detect Student Name column
      let detectedNameCol = columns.find(c => {
        const lower = c.toLowerCase().trim();
        return (
          lower === 'name' ||
          lower === 'student name' ||
          lower === 'student_name' ||
          lower === 'full name' ||
          lower === 'candidate name' ||
          lower.includes('name')
        );
      });

      // Detect ID / Roll No / Email column
      let detectedIdCol = columns.find(c => {
        const lower = c.toLowerCase().trim();
        return (
          lower.includes('roll') ||
          lower.includes('id') ||
          lower.includes('reg') ||
          lower.includes('enrollment') ||
          lower.includes('student id') ||
          lower.includes('email')
        );
      });

      const taggedRows = rows.map((r, rIdx) => ({
        ...r,
        _sheetName: sheetName,
        _originalRowIndex: rIdx + 1
      }));

      allRowsCombined.push(...taggedRows);

      sheetsInfo.push({
        name: sheetName,
        rowCount: rows.length,
        columns,
        detectedProfileCol: detectedProfileCol || columns[0] || '',
        detectedNameCol: detectedNameCol || '',
        detectedIdCol: detectedIdCol || '',
        previewRows: rows.slice(0, 3)
      });
    }
  });

  if (allRowsCombined.length === 0) {
    throw new Error('The uploaded file contains no data rows in any sheet.');
  }

  const allColumns = Array.from(allColumnsSet);
  const firstSheet = sheetsInfo[0] || {};

  return {
    isMultiSheet: sheetsInfo.length > 1,
    totalSheets: sheetsInfo.length,
    sheets: sheetsInfo,
    totalRows: allRowsCombined.length,
    columns: allColumns,
    detectedProfileCol: firstSheet.detectedProfileCol || allColumns[0] || '',
    detectedNameCol: firstSheet.detectedNameCol || '',
    detectedIdCol: firstSheet.detectedIdCol || '',
    previewRows: allRowsCombined.slice(0, 5),
    allRows: allRowsCombined
  };
}

/**
 * Format student item rows with clean numerical values and standard column names
 */
function formatRowsForExcel(itemList, includeSheetColumn = false) {
  return itemList.map((item, idx) => {
    const row = {};
    row['S.No'] = idx + 1;

    if (includeSheetColumn) {
      row['Class / Section Tab'] = String(item.sheetName || item.originalRow?._sheetName || 'Sheet1');
    }

    row['Student Name'] = String(item.studentName || item.realName || item.username || 'N/A');
    row['Student ID / Roll'] = String(item.studentId || '');
    row['LeetCode Username'] = String(item.username || '');
    row['Easy Solved (Low)'] = typeof item.easySolved === 'number' ? item.easySolved : (parseInt(item.easySolved) || 0);
    row['Medium Solved'] = typeof item.mediumSolved === 'number' ? item.mediumSolved : (parseInt(item.mediumSolved) || 0);
    row['Hard Solved (High)'] = typeof item.hardSolved === 'number' ? item.hardSolved : (parseInt(item.hardSolved) || 0);
    row['Total Solved'] = typeof item.totalSolved === 'number' ? item.totalSolved : (parseInt(item.totalSolved) || 0);
    row['Daily Streak (Days)'] = typeof item.streak === 'number' ? item.streak : (parseInt(item.streak) || 0);
    row['Total Active Days'] = typeof item.totalActiveDays === 'number' ? item.totalActiveDays : (parseInt(item.totalActiveDays) || 0);
    row['Global Ranking'] = item.ranking ? (parseInt(item.ranking) || item.ranking) : 'N/A';
    row['Contest Rating'] = item.contestRating ? (parseInt(item.contestRating) || item.contestRating) : 'N/A';
    row['Contest Badge'] = String(item.contestBadge || 'None');
    row['Verification Status'] = item.status === 'success' ? 'Active / Verified' : String(item.error || 'Failed');
    row['LeetCode Profile URL'] = String(item.profileUrl || `https://leetcode.com/u/${item.username}/`);

    if (item.originalRow && typeof item.originalRow === 'object') {
      for (const [key, val] of Object.entries(item.originalRow)) {
        if (!key.startsWith('_') && !row.hasOwnProperty(key)) {
          row[key] = val;
        }
      }
    }

    return row;
  });
}

/**
 * Generate an executive dashboard worksheet for the Excel workbook
 */
function createDashboardWorksheet(items, originalFileName) {
  const verified = items.filter(s => s.status === 'success');
  const totalStudents = items.length;
  const verifiedCount = verified.length;

  let totalEasy = 0;
  let totalMedium = 0;
  let totalHard = 0;
  let totalSolved = 0;
  let maxStreak = 0;
  let maxStreaker = 'N/A';
  let totalStreak = 0;

  verified.forEach(s => {
    const e = Number(s.easySolved) || 0;
    const m = Number(s.mediumSolved) || 0;
    const h = Number(s.hardSolved) || 0;
    const t = Number(s.totalSolved) || 0;
    const st = Number(s.streak) || 0;

    totalEasy += e;
    totalMedium += m;
    totalHard += h;
    totalSolved += t;
    totalStreak += st;

    if (st > maxStreak) {
      maxStreak = st;
      maxStreaker = s.studentName || s.username || 'N/A';
    }
  });

  const avgSolved = verifiedCount > 0 ? (totalSolved / verifiedCount).toFixed(1) : 0;
  const avgStreak = verifiedCount > 0 ? (totalStreak / verifiedCount).toFixed(1) : 0;

  const easyPct = totalSolved > 0 ? ((totalEasy / totalSolved) * 100).toFixed(1) + '%' : '0%';
  const medPct = totalSolved > 0 ? ((totalMedium / totalSolved) * 100).toFixed(1) + '%' : '0%';
  const hardPct = totalSolved > 0 ? ((totalHard / totalSolved) * 100).toFixed(1) + '%' : '0%';

  // Group by sheetName
  const sheetsMap = new Map();
  items.forEach(item => {
    const sheet = item.sheetName || item.originalRow?._sheetName || 'Sheet1';
    if (!sheetsMap.has(sheet)) {
      sheetsMap.set(sheet, []);
    }
    sheetsMap.get(sheet).push(item);
  });

  // Top 10 Performers
  const top10 = [...verified]
    .sort((a, b) => (Number(b.totalSolved) || 0) - (Number(a.totalSolved) || 0))
    .slice(0, 10);

  const aoa = [
    ['================================================================================================='],
    ['                 LEETCODE STUDENT PERFORMANCE & STREAK ANALYTICS DASHBOARD                       '],
    ['================================================================================================='],
    ['Generated On:', new Date().toLocaleString(), 'Source Roster:', originalFileName || 'Student_Roster.xlsx'],
    [''],
    ['>>> 1. EXECUTIVE KPI OVERVIEW'],
    ['Metric Description', 'Value', 'Unit / Context'],
    ['Total Students Enrolled', totalStudents, 'Students'],
    ['Verified LeetCode Profiles', verifiedCount, 'Profiles successfully analyzed'],
    ['Unresolved / Failed Profiles', totalStudents - verifiedCount, 'Profiles requiring review'],
    ['Total Problems Solved (Class)', totalSolved, 'Cumulative problems solved'],
    ['Class Average Problems Solved', Number(avgSolved), 'Problems per verified student'],
    ['Top Daily Streak', maxStreak, `Days (Held by: ${maxStreaker})`],
    ['Class Average Streak', Number(avgStreak), 'Active consecutive days'],
    [''],
    ['>>> 2. PROBLEM DIFFICULTY DISTRIBUTION'],
    ['Difficulty Level', 'Problems Solved', 'Share of Total'],
    ['Low (Easy)', totalEasy, easyPct],
    ['Medium', totalMedium, medPct],
    ['High (Hard)', totalHard, hardPct],
    ['TOTAL PROBLEMS SOLVED', totalSolved, '100.0%'],
    ['']
  ];

  // If multi-tab, add section comparison
  if (sheetsMap.size > 1) {
    aoa.push(['>>> 3. SECTION / TAB-WISE BENCHMARK']);
    aoa.push(['Section / Tab Name', 'Enrolled Students', 'Total Problems Solved', 'Avg Solved per Student', 'Max Streak (Days)', 'Top Section Performer']);
    for (const [sName, sItems] of sheetsMap.entries()) {
      const sVerified = sItems.filter(s => s.status === 'success');
      let sTotal = 0;
      let sMaxStreak = 0;
      let sTopStudent = 'N/A';
      let sTopSolved = 0;

      sVerified.forEach(s => {
        const solved = Number(s.totalSolved) || 0;
        const streak = Number(s.streak) || 0;
        sTotal += solved;
        if (streak > sMaxStreak) sMaxStreak = streak;
        if (solved > sTopSolved) {
          sTopSolved = solved;
          sTopStudent = s.studentName || s.username;
        }
      });

      const sAvg = sVerified.length > 0 ? (sTotal / sVerified.length).toFixed(1) : 0;
      aoa.push([sName, sItems.length, sTotal, Number(sAvg), sMaxStreak, sTopStudent]);
    }
    aoa.push(['']);
  }

  // Top 10 Leaderboard
  aoa.push(['>>> ' + (sheetsMap.size > 1 ? '4' : '3') + '. TOP 10 STUDENT PERFORMERS (LEADERBOARD)']);
  aoa.push(['Rank', 'Student Name', 'ID / Roll', 'LeetCode Username', 'Low (Easy)', 'Medium', 'High (Hard)', 'Total Solved', 'Daily Streak', 'Global Rank']);

  top10.forEach((s, idx) => {
    aoa.push([
      idx + 1,
      s.studentName || s.realName || s.username || 'N/A',
      s.studentId || '',
      s.username || '',
      Number(s.easySolved) || 0,
      Number(s.mediumSolved) || 0,
      Number(s.hardSolved) || 0,
      Number(s.totalSolved) || 0,
      Number(s.streak) || 0,
      s.ranking ? Number(s.ranking) : 'N/A'
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  ws['!cols'] = [
    { wch: 32 }, // Col A
    { wch: 28 }, // Col B
    { wch: 24 }, // Col C
    { wch: 22 }, // Col D
    { wch: 16 }, // Col E
    { wch: 16 }, // Col F
    { wch: 16 }, // Col G
    { wch: 16 }, // Col H
    { wch: 16 }, // Col I
    { wch: 18 }  // Col J
  ];

  return ws;
}

/**
 * Build a multi-tab enriched Excel workbook buffer with Dashboard as Sheet 1
 */
function createEnrichedWorkbook(items, originalFileName) {
  const workbook = XLSX.utils.book_new();

  const sheetsMap = new Map();
  items.forEach(item => {
    const sheet = item.sheetName || item.originalRow?._sheetName || 'Sheet1';
    if (!sheetsMap.has(sheet)) {
      sheetsMap.set(sheet, []);
    }
    sheetsMap.get(sheet).push(item);
  });

  const isMultiSheet = sheetsMap.size > 1;

  const standardCols = [
    { wch: 6 },  // S.No
    { wch: 22 }, // Class Tab
    { wch: 25 }, // Student Name
    { wch: 24 }, // Student ID / Roll
    { wch: 20 }, // LeetCode Username
    { wch: 18 }, // Easy
    { wch: 18 }, // Medium
    { wch: 18 }, // Hard
    { wch: 15 }, // Total Solved
    { wch: 20 }, // Daily Streak
    { wch: 18 }, // Active Days
    { wch: 16 }, // Global Ranking
    { wch: 15 }, // Contest Rating
    { wch: 16 }, // Contest Badge
    { wch: 20 }, // Verification Status
    { wch: 38 }  // Profile URL
  ];

  // 1. ALWAYS ADD THE EXECUTIVE DASHBOARD SHEET AS SHEET #1
  const dashboardWs = createDashboardWorksheet(items, originalFileName);
  XLSX.utils.book_append_sheet(workbook, dashboardWs, '📊 Executive Dashboard');

  // 2. Consolidated Summary Master Sheet if multiple tabs exist
  if (isMultiSheet) {
    const masterRows = formatRowsForExcel(items, true);
    const masterWs = XLSX.utils.json_to_sheet(masterRows);
    masterWs['!cols'] = standardCols;
    XLSX.utils.book_append_sheet(workbook, masterWs, 'Consolidated Summary');
  }

  // 3. Individual sheets for each tab
  for (const [sheetName, sheetItems] of sheetsMap.entries()) {
    let cleanName = sheetName.replace(/[:\\/?*\[\]]/g, '_').trim().slice(0, 31);
    if (!cleanName) cleanName = 'Sheet';

    const singleRows = formatRowsForExcel(sheetItems, false);
    const ws = XLSX.utils.json_to_sheet(singleRows);
    ws['!cols'] = standardCols.filter((_, i) => i !== 1);
    XLSX.utils.book_append_sheet(workbook, ws, cleanName);
  }

  return XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'buffer',
    compression: true
  });
}

/**
 * Generate sample multi-tab Excel workbook
 */
function createSampleWorkbook() {
  const workbook = XLSX.utils.book_new();

  const secAData = [
    { 'Roll No': 'CS2026-001', 'Student Name': 'Aarav Sharma', 'LeetCode Profile': 'https://leetcode.com/u/neal_wu/', 'Batch': '2026 - CS-A' },
    { 'Roll No': 'CS2026-002', 'Student Name': 'Priya Patel', 'LeetCode Profile': 'https://leetcode.com/u/lee215/', 'Batch': '2026 - CS-A' },
    { 'Roll No': 'CS2026-003', 'Student Name': 'Ananya Singh', 'LeetCode Profile': 'https://leetcode.com/u/StefanPochmann/', 'Batch': '2026 - CS-A' },
    { 'Roll No': 'CS2026-004', 'Student Name': 'Sneha Reddy', 'LeetCode Profile': 'https://leetcode.com/u/DBabichev/', 'Batch': '2026 - CS-A' }
  ];

  const secBData = [
    { 'Roll No': 'CS2026-101', 'Student Name': 'Rohan Gupta', 'LeetCode Profile': 'https://leetcode.com/u/hiepit/', 'Batch': '2026 - CS-B' },
    { 'Roll No': 'CS2026-102', 'Student Name': 'Vikram Verma', 'LeetCode Profile': 'https://leetcode.com/u/votrubac/', 'Batch': '2026 - CS-B' },
    { 'Roll No': 'CS2026-103', 'Student Name': 'Aditya Joshi', 'LeetCode Profile': 'https://leetcode.com/u/rock/', 'Batch': '2026 - CS-B' },
    { 'Roll No': 'CS2026-104', 'Student Name': 'Kavya Nair', 'LeetCode Profile': 'https://leetcode.com/u/ye15/', 'Batch': '2026 - CS-B' }
  ];

  const wsA = XLSX.utils.json_to_sheet(secAData);
  wsA['!cols'] = [{ wch: 15 }, { wch: 22 }, { wch: 40 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(workbook, wsA, 'Section A (CSE)');

  const wsB = XLSX.utils.json_to_sheet(secBData);
  wsB['!cols'] = [{ wch: 15 }, { wch: 22 }, { wch: 40 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(workbook, wsB, 'Section B (CSE)');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', compression: true });
}

module.exports = {
  parseUploadedWorkbook,
  createEnrichedWorkbook,
  createDashboardWorksheet,
  createSampleWorkbook
};
