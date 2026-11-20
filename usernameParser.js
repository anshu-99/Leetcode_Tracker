/**
 * Utility to extract clean LeetCode usernames from various URL and string formats.
 * Supported patterns:
 * - https://leetcode.com/u/neal_wu/
 * - https://leetcode.com/neal_wu/
 * - https://leetcode.com/u/neal_wu
 * - https://leetcode.com/neal_wu
 * - leetcode.com/u/neal_wu
 * - @neal_wu
 * - neal_wu
 */
function extractUsername(input) {
  if (!input) return null;
  let str = String(input).trim();
  
  // Strip query parameters and anchors
  str = str.split('?')[0].split('#')[0];
  // Strip trailing slashes
  str = str.replace(/\/+$/, '');
  
  // Match LeetCode profile URL regex
  const urlMatch = str.match(/(?:leetcode\.(?:com|cn)\/(?:u\/)?|@)?([a-zA-Z0-9_\-]+)$/i);
  if (urlMatch && urlMatch[1]) {
    const candidate = urlMatch[1];
    const reservedWords = [
      'problems', 'contest', 'explore', 'discuss', 'tag', 'company',
      'developer', 'subscribe', 'problemset', 'assessment', 'circle',
      'interview', 'features', 'studyplan'
    ];
    if (!reservedWords.includes(candidate.toLowerCase())) {
      return candidate;
    }
  }

  // Fallback cleanup
  const clean = str.replace(/^(https?:\/\/)?(www\.)?leetcode\.(com|cn)\/(u\/)?/i, '')
                   .replace(/^@/, '')
                   .replace(/\/.*$/, '')
                   .trim();
  return clean || null;
}

module.exports = {
  extractUsername
};
