const { extractUsername } = require('../utils/usernameParser');
const config = require('../../config/app.config');

// In-memory cache for profiles
const profileCache = new Map();

/**
 * Fetch profile and submission statistics for a given username or profile URL
 */
async function fetchUserProfile(input) {
  if (!input) {
    throw new Error('Username or profile link is required');
  }

  const cleanUsername = extractUsername(input);
  if (!cleanUsername) {
    throw new Error(`Invalid LeetCode username or URL format: "${input}"`);
  }

  const cacheKey = cleanUsername.toLowerCase();
  const cached = profileCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < config.CACHE_TTL_MS) {
    return cached.data;
  }

  const graphqlQuery = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          realName
          userAvatar
          ranking
          reputation
          aboutMe
          school
          countryName
        }
        submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
            submissions
          }
        }
        userCalendar {
          streak
          totalActiveDays
        }
      }
      userContestRanking(username: $username) {
        rating
        globalRanking
        topPercentage
        badge {
          name
        }
      }
    }
  `;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': `https://leetcode.com/u/${cleanUsername}/`,
        'Origin': 'https://leetcode.com'
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables: { username: cleanUsername }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`LeetCode server responded with HTTP status ${response.status}`);
    }

    const json = await response.json();

    if (json.errors && json.errors.length > 0) {
      const msg = json.errors[0].message || 'LeetCode API Error';
      throw new Error(msg);
    }

    const matchedUser = json.data?.matchedUser;
    if (!matchedUser) {
      throw new Error(`User "${cleanUsername}" was not found on LeetCode`);
    }

    const acStats = matchedUser.submitStatsGlobal?.acSubmissionNum || [];
    const getCount = (diff) => {
      const item = acStats.find(s => s.difficulty.toLowerCase() === diff.toLowerCase());
      return item ? item.count : 0;
    };

    const contest = json.data?.userContestRanking || null;

    const result = {
      username: matchedUser.username,
      realName: matchedUser.profile?.realName || matchedUser.username,
      avatar: matchedUser.profile?.userAvatar || '',
      ranking: matchedUser.profile?.ranking || null,
      reputation: matchedUser.profile?.reputation || 0,
      totalSolved: getCount('All'),
      easySolved: getCount('Easy'),
      mediumSolved: getCount('Medium'),
      hardSolved: getCount('Hard'),
      streak: matchedUser.userCalendar?.streak || 0,
      totalActiveDays: matchedUser.userCalendar?.totalActiveDays || 0,
      contestRating: contest ? Math.round(contest.rating) : null,
      contestBadge: contest?.badge?.name || null,
      contestRanking: contest?.globalRanking || null,
      profileUrl: `https://leetcode.com/u/${matchedUser.username}/`,
      fetchedAt: new Date().toISOString()
    };

    profileCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

module.exports = {
  fetchUserProfile,
  extractUsername
};
