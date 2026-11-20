# 🚀 LeetTrack Pro — Automated Student LeetCode Analytics

An enterprise-grade web application designed for colleges, coding bootcamps, and universities to upload student Excel rosters (`.xlsx`, `.xls`, `.csv`) and automatically extract **Easy (Low), Medium, and Hard (High) solved counts, active daily coding streaks (🔥), total active days, and global rankings** directly from the LeetCode GraphQL API.

---

## 📁 Project Architecture & Folder Structure

```
leetcode-tracker/
├── config/
│   └── app.config.js          # Centralized configuration (Port, cache TTL, rate-limits)
│
├── src/
│   ├── controllers/
│   │   ├── upload.controller.js   # Handles multi-tab Excel upload & column auto-detection
│   │   ├── leetcode.controller.js # Single & real-time SSE batch queries
│   │   └── export.controller.js   # Multi-tab enriched Excel export & sample templates
│   │
│   ├── services/
│   │   ├── leetcode.service.js    # LeetCode GraphQL API fetcher & in-memory caching
│   │   └── excel.service.js       # Workbook parsing, multi-tab normalization & XLSX generation
│   │
│   ├── utils/
│   │   └── usernameParser.js      # Robust regex & URL normalization utility
│   │
│   └── routes/
│       └── api.routes.js          # Modular Express API endpoints
│
├── public/                        # Client-side static assets
│   ├── index.html                 # Executive dark glassmorphism dashboard
│   ├── css/
│   │   └── style.css              # Custom styling, animations & responsive design
│   └── js/
│       └── app.js                 # Frontend state, SSE listeners, Chart.js & export
│
├── server.js                      # Clean Express server entry point
├── package.json                   # Dependencies & npm scripts
├── .env.example                   # Environment variable template
└── README.md                      # Project documentation
```

---

## ⚡ Core Features

- **Multi-Tab Excel Aware**: Reads every tab/sheet in your Excel file simultaneously (e.g. `CSE-Section A`, `CSE-Section B`).
- **Live Progress Streaming (SSE)**: Streams real-time extraction progress directly to the browser UI without polling.
- **Interactive Multi-Tab Filtering**: View all students together or filter by individual sections with a single click.
- **Dual Engine Excel Export**:
  - Exports a standard `.xlsx` workbook.
  - Automatically includes a **`Consolidated Summary`** master sheet followed by individual tabs for each section.
  - Generates true numeric cells for Easy, Medium, Hard, Total, and Streaks so formulas (`SUM`, `AVERAGE`) work instantly in Excel.
- **Executive Visual Dashboard**:
  - Key Performance Indicators (KPIs) for class averages, max streaks, and total problems solved.
  - Interactive Doughnut Chart for Difficulty Distribution.
  - Horizontal Stacked Bar Chart for Top Performers.

---

## 🛠️ How to Run Locally

### 1. Install Dependencies
```bash
cd "C:\Users\udbha\.gemini\antigravity-ide\scratch\leetcode-tracker"
npm install
```

### 2. Start the Server
```bash
npm start
```

### 3. Open in Browser
Visit [http://localhost:3000](http://localhost:3000) in your web browser.
