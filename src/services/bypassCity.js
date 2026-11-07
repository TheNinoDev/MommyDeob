const { getSupportedSitesMerged, buildBypassUrl: _unused, tryServerSideBypass: _unused2 } = require('./bypassService');

const BYPASS_CITY_BASE = 'https://bypass.city';

async function getSupportedSites() {
  const sites = await getSupportedSitesMerged();
  return sites.map(s => `• ${s}`).join('\n');
}

function buildBypassUrl(longUrl) {
  return `${BYPASS_CITY_BASE}/bypass?bypass=${encodeURIComponent(longUrl)}`;
}

async function tryServerSideBypass(longUrl) {
  try {
    const res = await fetch(buildBypassUrl(longUrl), {
      headers: { 'User-Agent': 'Mozilla/5.0 MommyDeob/2.0' },
      redirect: 'manual'
    });
    const text = await res.text();
    return { status: res.status, redirect: res.headers.get('location') || null, bodySnippet: text.slice(0, 500) };
  } catch (err) {
    return { error: err.message };
  }
}

module.exports = {
  BYPASS_CITY_BASE,
  getSupportedSites,
  buildBypassUrl,
  tryServerSideBypass
};