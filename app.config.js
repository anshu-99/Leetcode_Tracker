module.exports = {
  PORT: process.env.PORT || 3000,
  CACHE_TTL_MS: 15 * 60 * 1000, // 15 minutes in-memory cache
  CONCURRENCY_LIMIT: 4,          // Simultaneous LeetCode queries
  REQUEST_SPACING_MS: 100,       // Interval between queries to prevent throttling
  MAX_FILE_SIZE_BYTES: 30 * 1024 * 1024 // 30MB
};
