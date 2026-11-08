const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const LINKVERTISE_API_ENDPOINT = 'https://publisher.linkvertise.com/api/v1/anti_bypassing';
const SESSIONS_PATH = path.join(__dirname, '..', '..', 'data', 'sessions.json');

// Session store in memory backed by file persistence
let sessions = {};

function loadSessions() {
  try {
    if (fs.existsSync(SESSIONS_PATH)) {
      sessions = JSON.parse(fs.readFileSync(SESSIONS_PATH, 'utf8'));
    }
  } catch (err) {
    console.error('[Linkvertise] Failed to load sessions database:', err.message);
    sessions = {};
  }
}

function saveSessions() {
  try {
    fs.mkdirSync(path.dirname(SESSIONS_PATH), { recursive: true });
    fs.writeFileSync(SESSIONS_PATH, JSON.stringify(sessions, null, 2), 'utf8');
  } catch (err) {
    console.error('[Linkvertise] Failed to save sessions database:', err.message);
  }
}

// Initial load
loadSessions();

// Prune expired sessions older than 2 hours periodically
setInterval(() => {
  const now = Date.now();
  let changed = false;
  for (const [id, s] of Object.entries(sessions)) {
    if (s.expiresAt && now > s.expiresAt + (2 * 60 * 60 * 1000)) {
      delete sessions[id];
      changed = true;
    }
  }
  if (changed) saveSessions();
}, 15 * 60 * 1000).unref();

/**
 * Generate a dynamic Linkvertise ad link.
 *
 * URL structure:
 * https://link-to.net/{publisherId}/{random}/dynamic/?r={encodedUrl}
 * Where:
 * - publisherId: numeric Linkvertise account ID
 * - random: Math.random() * 1000
 * - encodedUrl: btoa(encodeURI(destinationUrl))
 */
function generateDynamicLinkvertiseUrl(destinationUrl) {
  const publisherId = (process.env.LINKVERTISE_PUBLISHER_ID || process.env.LINKVERTISE_USER_ID || '10452071').trim();
  const random = Math.floor(Math.random() * 1000);
  const encodedUrl = Buffer.from(encodeURI(destinationUrl)).toString('base64');
  return `https://link-to.net/${publisherId}/${random}/dynamic/?r=${encodedUrl}`;
}

/**
 * Creates a unique checkpoint session for a user.
 * Generates an unpredictable cryptographic session ID and dynamic Linkvertise URL.
 */
function createCheckpointSession(userId, explicitBaseUrl = null) {
  const baseUrl = (explicitBaseUrl || process.env.APP_URL || process.env.BASE_URL || 'https://mommydeob.bot-keep.xyz').replace(/\/+$/, '');
  const sessionId = crypto.randomBytes(24).toString('hex');
  const destinationUrl = `${baseUrl}/callback?session=${sessionId}`;
  const dynamicUrl = generateDynamicLinkvertiseUrl(destinationUrl);

  const sessionData = {
    sessionId,
    userId: String(userId),
    destinationUrl,
    dynamicUrl,
    created: Date.now(),
    expiresAt: Date.now() + (60 * 60 * 1000), // Session valid for 1 hour to complete
    completed: false,
    completedAt: null,
    hash: null,
    key: null
  };

  sessions[sessionId] = sessionData;
  saveSessions();

  return {
    sessionId,
    destinationUrl,
    dynamicUrl
  };
}

/**
 * Retrieve session by sessionId.
 */
function getSession(sessionId) {
  if (!sessionId || typeof sessionId !== 'string') return null;
  return sessions[sessionId.trim()] || null;
}

/**
 * Send immediate POST request to Linkvertise Anti-Bypass verification API.
 * Endpoint: https://publisher.linkvertise.com/api/v1/anti_bypassing?token={token}&hash={hash}
 *
 * Requirements:
 * - Use configured Anti-Bypass token, NOT a Bearer token.
 * - Accept only if Linkvertise explicitly returns TRUE.
 * - Reject FALSE, invalid tokens, missing hashes, expired hashes, and API errors.
 */
async function verifyLinkvertiseHash(hash, token = (process.env.LINKVERTISE_ANTI_BYPASS_TOKEN || '').trim()) {
  if (!hash || typeof hash !== 'string' || !hash.trim()) {
    return { valid: false, message: 'Missing or empty Linkvertise hash.' };
  }

  const cleanHash = hash.trim();
  const cleanToken = (token || '').trim();

  // Validate Linkvertise 64-character constraints
  if (cleanToken.length !== 64) {
    return {
      valid: false,
      message: `Invalid configuration: LINKVERTISE_ANTI_BYPASS_TOKEN must be exactly 64 characters (got ${cleanToken.length}).`
    };
  }

  if (cleanHash.length !== 64) {
    return {
      valid: false,
      message: `Invalid hash format: Linkvertise hashes are exactly 64 hex characters (got ${cleanHash.length}).`
    };
  }

  const verifyUrl = `${LINKVERTISE_API_ENDPOINT}?token=${encodeURIComponent(cleanToken)}&hash=${encodeURIComponent(cleanHash)}`;

  try {
    const res = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MommyDeob/2.0'
      }
    });

    const rawText = await res.text();
    let data = null;
    try {
      data = JSON.parse(rawText);
    } catch {}

    // Linkvertise documentation response scenarios:
    // - CORRECT_TOKEN + CORRECT_HASH -> TRUE / {"status": true}
    // - CORRECT_TOKEN + WRONG_HASH   -> FALSE / {"status": false}
    // - WRONG_TOKEN                  -> "Invalid token." / {"status": "Invalid token."}
    const isExplicitTrue = (
      (data && (data.status === true || data.status === 'TRUE' || data.success === true)) ||
      rawText.trim().toUpperCase() === 'TRUE' ||
      rawText.trim() === 'true'
    );

    if (res.ok && isExplicitTrue) {
      return { valid: true, data };
    }

    if (data && data.status === 'Invalid token.') {
      return {
        valid: false,
        message: 'Linkvertise returned: "Invalid token." Verify LINKVERTISE_ANTI_BYPASS_TOKEN in server configuration.'
      };
    }

    if (data && data.status === false) {
      return {
        valid: false,
        message: 'Linkvertise returned: FALSE. Hash was not found or expired (>10s window). Automated bypass tools are blocked.'
      };
    }

    return {
      valid: false,
      message: (data && (data.message || data.error || data.status)) || `Linkvertise rejected hash (HTTP ${res.status}): ${rawText.slice(0, 100)}`
    };
  } catch (err) {
    return {
      valid: false,
      message: `Network error connecting to Linkvertise Anti-Bypass API: ${err.message}`
    };
  }
}

/**
 * Backward compatibility helper for legacy call sites.
 */
function getLinkvertiseUrl(userId) {
  const session = createCheckpointSession(userId);
  return session.dynamicUrl;
}

module.exports = {
  createCheckpointSession,
  generateDynamicLinkvertiseUrl,
  getSession,
  verifyLinkvertiseHash,
  getLinkvertiseUrl,
  saveSessions,
  sessions
};
