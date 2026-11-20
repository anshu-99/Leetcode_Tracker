const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/app.config');
const apiRoutes = require('./src/routes/api.routes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// Mount API routes
app.use('/api', apiRoutes);

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(config.PORT, () => {
  console.log(`[LeetTrack Pro] Server running at http://localhost:${config.PORT}`);
});
