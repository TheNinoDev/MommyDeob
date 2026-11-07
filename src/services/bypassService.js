const BYPASS_LC_BASE = 'https://bypass.lc';
const BYPASS_LC_SESSION = `${BYPASS_LC_BASE}/api/session`;
const BYPASS_LC_RESOLVE = `${BYPASS_LC_BASE}/api/resolve`;
const BYPASS_CITY_BASE = 'https://bypass.city';

let bypassLcSessionToken = null;
let sessionExpiresAt = 0;

/**
 * Get a fresh session token from bypass.lc free browser flow.
 */
async function getBypassLcSession() {
  const now = Date.now();
  if (bypassLcSessionToken && now < sessionExpiresAt) {
    return bypassLcSessionToken;
  }

  try {
    const res = await fetch(BYPASS_LC_SESSION, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://bypass.lc/'
      }
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (data && data.session) {
      bypassLcSessionToken = data.session;
      sessionExpiresAt = now + 10 * 60 * 1000; // 10 min TTL
      return bypassLcSessionToken;
    }
    if (data && data.token) {
      bypassLcSessionToken = data.token;
      sessionExpiresAt = now + 10 * 60 * 1000;
      return bypassLcSessionToken;
    }
  } catch (_) {
    // session endpoint unavailable
  }

  return null;
}

/**
 * Submit a link to bypass.lc free resolve endpoint.
 * turnstileToken is optional - Cloudflare Turnstile may be required but we try without first.
 */
async function tryBypassLcFree(url) {
  const sessionToken = await getBypassLcSession();

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Referer': 'https://bypass.lc/'
  };

  if (sessionToken) {
    headers['X-Bypass-Session'] = sessionToken;
  }

  const body = JSON.stringify({ url });

  try {
    const res = await fetch(BYPASS_LC_RESOLVE, {
      method: 'POST',
      headers,
      body,
      credentials: 'include'
    });

    if (!res.ok) {
      return { success: false, reason: `bypass.lc resolve HTTP ${res.status}` };
    }

    const data = await res.json();

    if (data.status === 'success' && data.result) {
      return {
        success: true,
        result: data.result,
        provider: data.provider || 'bypass.lc',
        cached: !!data.cached,
        method: 'bypass.lc free browser flow'
      };
    }

    if (data.error || data.message) {
      return { success: false, reason: `bypass.lc: ${data.error || data.message}` };
    }

    // Maybe it returned a jobId to poll
    if (data.jobId) {
      return await pollBypassLcJob(data.jobId, sessionToken);
    }

    return { success: false, reason: 'bypass.lc returned no destination' };
  } catch (err) {
    return { success: false, reason: `bypass.lc free error: ${err.message}` };
  }
}

/**
 * Poll a bypass.lc job until it completes or times out.
 */
async function pollBypassLcJob(jobId, sessionToken) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
    'Accept': 'application/json',
    'Referer': 'https://bypass.lc/'
  };

  if (sessionToken) {
    headers['X-Bypass-Session'] = sessionToken;
  }

  const deadline = Date.now() + 30 * 1000; // 30 second max poll

  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BYPASS_LC_BASE}/api/bypass/job/${jobId}`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });

      if (!res.ok) {
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      const data = await res.json();

      if (data.status === 'success' && data.result) {
        return {
          success: true,
          result: data.result,
          provider: data.provider || 'bypass.lc',
          cached: !!data.cached,
          method: 'bypass.lc free browser flow (polled)'
        };
      }

      if (data.status === 'failed' || data.status === 'error') {
        return { success: false, reason: `bypass.lc job failed: ${data.error || data.message || 'unknown'}` };
      }

      // Still pending, wait and poll again
      await new Promise(r => setTimeout(r, 2000));
    } catch (_) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  return { success: false, reason: 'bypass.lc job timed out' };
}

async function tryBypassCity(url) {
  try {
    const bypassUrl = `${BYPASS_CITY_BASE}/bypass?bypass=${encodeURIComponent(url)}`;
    const res = await fetch(bypassUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 MommyDeob/2.0' },
      redirect: 'manual'
    });
    const text = await res.text();
    const redirect = res.headers.get('location');
    if (redirect) {
      return { success: true, result: redirect, provider: 'bypass.city', method: 'bypass.city server-side' };
    }
    const resultMatch = text.match(/https?:\/\/[^\s"'<>]+/g);
    if (resultMatch) {
      const clean = resultMatch.find(u =>
        !u.includes('bypass.city') && !u.includes('discord') && !u.includes('google')
      );
      if (clean) {
        return { success: true, result: clean, provider: 'bypass.city', method: 'bypass.city page scrape' };
      }
    }
    return { success: false, reason: `bypass.city HTTP ${res.status}` };
  } catch (err) {
    return { success: false, reason: `bypass.city error: ${err.message}` };
  }
}

/**
 * Bypass an ad-link URL using free methods without a heavy browser.
 *
 * Priority:
 *  1. bypass.lc free browser flow (GET /api/session -> POST /api/resolve -> GET /api/bypass/job/:id)
 *  2. bypass.city server-side (free fallback)
 *  3. Manual links if both fail
 *
 * No puppeteer/browser is used - stays lightweight for Pterodactyl hosting.
 */
async function bypassUrl(url, options = {}) {
  // 1. Try bypass.lc free browser flow
  const lcResult = await tryBypassLcFree(url);
  if (lcResult.success) return lcResult;

  // 2. Try bypass.city (free fallback)
  const cityResult = await tryBypassCity(url);
  if (cityResult.success) return cityResult;

  // 3. All automated methods failed - return manual bypass URLs
  return {
    success: false,
    reason: 'All automated bypass methods failed. The link may require manual CAPTCHA solving.',
    bypassCityUrl: `${BYPASS_CITY_BASE}/bypass?bypass=${encodeURIComponent(url)}`,
    bypassLinksUrl: 'https://bypass-links.com/',
    bypassLcUrl: 'https://bypass.lc/',
    method: 'manual'
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
  getBypassLcSession,
  BYPASS_LC_BASE,
  BYPASS_LINKS_URL: 'https://bypass-links.com/',
  BYPASS_CITY_BASE
};