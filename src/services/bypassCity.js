const BYPASS_CITY_BASE = 'https://bypass.city';

async function getSupportedSites() {
  const res = await fetch(`${BYPASS_CITY_BASE}/supported`, {
    headers: { 'User-Agent': 'Mozilla/5.0 MommyDeob/2.0' }
  });
  if (!res.ok) throw new Error(`Failed to fetch bypass.city supported list (HTTP ${res.status})`);
  return await res.text();
}

function buildBypassUrl(longUrl) {
  return `${BYPASS_CITY_BASE}/bypass?bypass=${encodeURIComponent(longUrl)}`;
}

async function tryServerSideBypass(longUrl) {
  // bypass.city is primarily a browser-based bypasser. We attempt a lightweight
  // fetch to see if any redirect or result comes back server-side.
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