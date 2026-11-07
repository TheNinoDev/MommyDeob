const TRW_LAT_API = 'https://trw.lat/api/bypass';
const BYPASS_CITY_BASE = 'https://bypass.city';
const BYPASS_LINKS_URL = 'https://bypass-links.com/';

/**
 * Bypass an ad-link URL using trw.lat (free, no API key, no headless browser).
 *
 * Method:
 *   GET https://trw.lat/api/bypass?url=<encoded_url>
 *   Returns: { "result": "https://destination.com", "success": true }
 *
 * If trw.lat fails, falls back to bypass.city manual link.
 */
async function bypassUrl(url, options = {}) {
  // 1. Try trw.lat free API (no key required)
  try {
    const res = await fetch(`${TRW_LAT_API}?url=${encodeURIComponent(url)}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 MommyDeob/2.0',
        'Accept': 'application/json'
      },
      redirect: 'manual'
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.result) {
        return {
          success: true,
          result: data.result,
          provider: 'trw.lat',
          method: 'trw.lat free API'
        };
      }
    }
  } catch (_) {
    // Fall through to manual fallback
  }

  // 2. Manual fallback - provide links for user to complete themselves
  return {
    success: false,
    reason: 'trw.lat could not bypass this link automatically. Open one of the links below to complete manually.',
    bypassCityUrl: `${BYPASS_CITY_BASE}/bypass?bypass=${encodeURIComponent(url)}`,
    bypassLinksUrl: BYPASS_LINKS_URL,
    trwLatUrl: `${TRW_LAT_API}?url=${encodeURIComponent(url)}`,
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

  // Common fallback services
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
  TRW_LAT_API,
  BYPASS_LINKS_URL,
  BYPASS_CITY_BASE
};