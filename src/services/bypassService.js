const BYPASS_LC_API = 'https://bypass.lc/api/bypass';
const BYPASS_LINKS_URL = 'https://bypass-links.com/';
const BYPASS_CITY_BASE = 'https://bypass.city';

async function tryBypassLc(url, apiKey) {
  if (!apiKey || apiKey.trim() === '') {
    return { success: false, reason: 'No bypass.lc API key configured' };
  }

  try {
    const res = await fetch(BYPASS_LC_API, {
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
        method: 'bypass.lc API'
      };
    }
    return { success: false, reason: `bypass.lc API: ${data.message || `HTTP ${res.status}`}` };
  } catch (err) {
    return { success: false, reason: `bypass.lc API error: ${err.message}` };
  }
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
    // Try to extract a result URL from the page body
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
 * Bypass an ad-link URL using free/cheap methods without a heavy browser.
 *
 * Priority:
 *  1. bypass.lc API (paid, cheap: ~$0.80/1000 requests) - requires BYPASS_LC_API_KEY
 *  2. bypass.city server-side (free, may need captcha)
 *  3. Fallback: provide website URLs for manual completion
 *
 * No puppeteer/browser is used - this stays lightweight for Pterodactyl hosting.
 */
async function bypassUrl(url, options = {}) {
  const { apiKey } = options;

  // 1. Try bypass.lc API (fastest, server-side)
  const lcResult = await tryBypassLc(url, apiKey || process.env.BYPASS_LC_API_KEY);
  if (lcResult.success) return lcResult;

  // 2. Try bypass.city (free fallback)
  const cityResult = await tryBypassCity(url);
  if (cityResult.success) return cityResult;

  // 3. All automated methods failed - return manual bypass URLs
  return {
    success: false,
    reason: 'All automated bypass methods failed. The link may require manual CAPTCHA solving.',
    bypassCityUrl: `${BYPASS_CITY_BASE}/bypass?bypass=${encodeURIComponent(url)}`,
    bypassLinksUrl: `${BYPASS_LINKS_URL}#bypass=${encodeURIComponent(url)}`,
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
  BYPASS_LC_API,
  BYPASS_LINKS_URL,
  BYPASS_CITY_BASE
};