const BYPASS_LC_PAID_API = 'https://bypass.lc/api/bypass';
const BYPASS_LC_FREE_SESSION = 'https://bypass.lc/api/session';
const BYPASS_LC_FREE_RESOLVE = 'https://bypass.lc/api/resolve';
const BYPASS_CITY_BASE = 'https://bypass.city';
const BYPASS_LINKS_URL = 'https://bypass-links.com/';

/**
 * Bypass an ad-link URL using free/cheap methods.
 *
 * Methods tried (in order):
 *  1. bypass.lc PAID API (POST /api/bypass, Bearer token) - No captcha, ~$0.80/1000 requests
 *     Requires BYPASS_LC_API_KEY in .env
 *  2. bypass.lc FREE flow (GET /api/session -> POST /api/resolve)
 *     Returns session token but /api/resolve requires a Cloudflare Turnstile token
 *     which cannot be obtained without solving bypass.lc's own Cloudflare check.
 *     No free open-source Node.js Turnstile solver exists without a headless browser
 *     or paid API.
 *  3. bypass.city - Frontend-only React app, requires manual interaction
 *  4. Manual fallback links for user to complete bypass themselves
 *
 * No puppeteer/headless browser is used - stays lightweight for Pterodactyl.
 */
async function bypassUrl(url, options = {}) {
  const { apiKey } = options;

  // 1. Try bypass.lc paid API (if API key configured)
  if (apiKey && apiKey.trim() !== '') {
    try {
      const res = await fetch(BYPASS_LC_PAID_API, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 MommyDeob/2.0'
        },
        body: JSON.stringify({ url })
      });

      const data = await res.json();
      if (res.ok && data.status === 'success' && data.result) {
        return {
          success: true,
          result: data.result,
          provider: data.provider || 'bypass.lc',
          cached: !!data.cached,
          method: 'bypass.lc paid API'
        };
      }
      // If paid API fails, fall through to free methods
    } catch (_) {
      // Fall through
    }
  }

  // 2. Try bypass.lc free session (gets token but resolve needs Turnstile)
  const sessionResult = await tryBypassLcFreeSession(url);
  if (sessionResult.success) return sessionResult;

  // 3. Try bypass.city (frontend only, may need manual captcha)
  const cityResult = tryBypassCity(url);
  if (cityResult.success) return cityResult;

  // 4. All automated methods failed - return manual bypass URLs
  return {
    success: false,
    reason: 'Automated bypass unavailable. bypass.lc free flow requires a Cloudflare Turnstile token (no free open-source Node.js solver exists without a headless browser or paid API). bypass.city requires manual interaction.',
    bypassCityUrl: `${BYPASS_CITY_BASE}/bypass?bypass=${encodeURIComponent(url)}`,
    bypassLcUrl: 'https://bypass.lc/',
    bypassLinksUrl: BYPASS_LINKS_URL,
    method: 'manual',
    suggestion: 'Get a bypass.lc API key and set BYPASS_LC_API_KEY in .env for fully automated bypass, or click the buttons below to complete manually.'
  };
}

async function tryBypassLcFreeSession(url) {
  try {
    const res = await fetch(BYPASS_LC_FREE_SESSION, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://bypass.lc/'
      }
    });

    if (!res.ok) {
      return { success: false, reason: `bypass.lc session HTTP ${res.status}` };
    }

    const data = await res.json();
    if (data && data.token) {
      // We have a session token, but /api/resolve requires turnstileToken
      // which we cannot obtain without solving Cloudflare on bypass.lc itself
      return {
        success: false,
        reason: 'bypass.lc free flow obtained session token but /api/resolve requires a Cloudflare Turnstile token. No free open-source solver available without headless browser.',
        sessionToken: data.token,
        method: 'bypass.lc free (blocked by Turnstile)'
      };
    }
    return { success: false, reason: 'bypass.lc session returned no token' };
  } catch (err) {
    return { success: false, reason: `bypass.lc session error: ${err.message}` };
  }
}

function tryBypassCity(url) {
  // bypass.city is a frontend React app - server-side fetch returns HTML, not a result
  // We cannot automate it without a headless browser
  return {
    success: false,
    reason: 'bypass.city is frontend-only and requires manual interaction in a browser.'
  };
}

async function getSupportedSitesMerged() {
  const sites = new Set();

  // Fetch from bypass.city supported page
  try {
    const res = await fetch(`${BYPASS_CITY_BASE}/supported`, {
      headers: { 'User-Agent': 'Mozilla/5.0 MommyDeob/2.0' }
    });
    if (res.ok) {
      const text = await res.text();
      const lines = text.split('\n').map(l => l.trim()).filter(l => l && l !== '-' && l !== 'Supported Websites');
      lines.forEach(l => sites.add(l));
    }
  } catch (_) {}

  // Common fallback services if APIs fail
  const fallbacks = [
    'Linkvertise', 'LootLabs', 'Loot-Labs', 'Work.ink', 'Lockr', 'Rekonise',
    'Sub2Unlock', 'Boost.ink', 'AdMaven', 'Pastebin', 'PasteLua', 'Pastelink',
    'Pastesite', 'Rentry', 'Hastebin', 'tinyurl.com', 'bit.ly', 'is.gd',
    'rebrand.ly', 'ControlC', 'Justpaste.it', 'AdFoc.us', 'shrinkme.click',
    'cuty.io', 'bstlar.com'
  ];
  fallbacks.forEach(s => sites.add(s));

  return Array.from(sites).sort();
}

module.exports = {
  bypassUrl,
  getSupportedSitesMerged,
  BYPASS_LC_PAID_API,
  BYPASS_LINKS_URL,
  BYPASS_CITY_BASE
};