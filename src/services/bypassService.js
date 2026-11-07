const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const BYPASS_LC_API = 'https://bypass.lc/api/bypass';
const BYPASS_CITY_BASE = 'https://bypass.city';

let browser = null;

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ],
      defaultViewport: { width: 1920, height: 1080 }
    });
  }
  return browser;
}

async function closeBrowser() {
  if (browser) {
    try { await browser.close(); } catch (_) {}
    browser = null;
  }
}

async function tryBypassLc(url, apiKey) {
  if (!apiKey) return { success: false, reason: 'No bypass.lc API key configured' };

  try {
    const res = await fetch(BYPASS_LC_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 MommyDeob/2.0'
      },
      body: JSON.stringify({ url })
    });

    const data = await res.json();
    if (res.ok && data.status === 'success' && data.result) {
      return { success: true, result: data.result, provider: data.provider || 'bypass.lc', cached: !!data.cached };
    }
    return { success: false, reason: data.message || `bypass.lc HTTP ${res.status}` };
  } catch (err) {
    return { success: false, reason: `bypass.lc error: ${err.message}` };
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
      return { success: true, result: redirect, provider: 'bypass.city' };
    }
    // Try to extract a result URL from the page
    const resultMatch = text.match(/https?:\/\/[^\s"'<>]+/g);
    if (resultMatch) {
      const clean = resultMatch.find(u => !u.includes('bypass.city') && !u.includes('discord'));
      if (clean) return { success: true, result: clean, provider: 'bypass.city' };
    }
    return { success: false, reason: `bypass.city HTTP ${res.status}` };
  } catch (err) {
    return { success: false, reason: `bypass.city error: ${err.message}` };
  }
}

async function tryHeadlessBrowser(url) {
  let page = null;
  try {
    const br = await getBrowser();
    page = await br.newPage();

    // Set realistic headers
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.google.com/'
    });

    // Navigate to the linkvertise/ad-link URL
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait a bit for any redirect or JS execution
    await new Promise(r => setTimeout(r, 5000));

    const finalUrl = page.url();

    // Check if we've been redirected away from the ad-link (success)
    const adDomains = ['linkvertise.com', 'bstlar.com', 'cutty', 'shrinkme.click', 'sub2unlock', 'lootlinks', 'adfocus', 'boost.ink'];
    const isStillAd = adDomains.some(d => finalUrl.includes(d));

    if (!isStillAd && finalUrl !== url) {
      return { success: true, result: finalUrl, provider: 'headless-browser' };
    }

    // Look for a "Continue" or "Verify" button and try clicking it
    const buttons = await page.$$('button, a');
    for (const btn of buttons) {
      const text = (await btn.evaluate(el => el.textContent || el.innerText || '')).trim().toLowerCase();
      if (text.includes('continue') || text.includes('verify') || text.includes('proceed') || text.includes('bypass') || text.includes('get link')) {
        try {
          await btn.click();
          await new Promise(r => setTimeout(r, 5000));
          const newUrl = page.url();
          if (newUrl !== finalUrl && !adDomains.some(d => newUrl.includes(d))) {
            return { success: true, result: newUrl, provider: 'headless-browser' };
          }
        } catch (_) {}
      }
    }

    return { success: false, reason: 'Headless browser could not bypass automatically; CAPTCHA or manual interaction required' };
  } catch (err) {
    return { success: false, reason: `Headless browser error: ${err.message}` };
  } finally {
    if (page) {
      try { await page.close(); } catch (_) {}
    }
  }
}

async function bypassUrl(url, options = {}) {
  const { apiKey } = options;

  // 1. Try bypass.lc API first (fastest, server-side)
  const lcResult = await tryBypassLc(url, apiKey || process.env.BYPASS_LC_API_KEY);
  if (lcResult.success) return lcResult;

  // 2. Try bypass.city server-side
  const cityResult = await tryBypassCity(url);
  if (cityResult.success) return cityResult;

  // 3. Fallback to headless browser with stealth + Cloudflare evasion
  const browserResult = await tryHeadlessBrowser(url);
  if (browserResult.success) return browserResult;

  // All failed
  return {
    success: false,
    reason: 'All bypass methods failed. The link may require manual CAPTCHA solving.',
    bypassCityUrl: `${BYPASS_CITY_BASE}/bypass?bypass=${encodeURIComponent(url)}`,
    bypassLcUrl: 'https://bypass.lc/'
  };
}

async function getSupportedSitesMerged() {
  const sites = new Set();

  // Fetch from bypass.city
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

  // Fetch from bypass.lc (if it has a supported endpoint)
  try {
    const res = await fetch('https://bypass.lc/api/supported', {
      headers: { 'User-Agent': 'Mozilla/5.0 MommyDeob/2.0' }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        data.forEach(s => sites.add(s));
      } else if (data && data.sites) {
        data.sites.forEach(s => sites.add(s));
      }
    }
  } catch (_) {}

  // Common fallbacks if both APIs fail
  if (sites.size === 0) {
    ['Linkvertise', 'bstlar.com', 'Cutty', 'shrinkme.click', 'RedirectResolver', 'Sub2Get', 'Sub2Unlock.me', 'Lootlinks', 'AdFoc.us', 'Boost.ink', 'BoostFusedGT', 'Pastebin', 'PasteLua', 'Pastelink', 'Pastesite', 'Rentry', 'Hastebin', 'tinyurl.com', 'bit.ly', 'is.gd', 'rebrand.ly', 'ControlC', 'Justpaste.it'].forEach(s => sites.add(s));
  }

  return Array.from(sites).sort();
}

module.exports = {
  bypassUrl,
  getSupportedSitesMerged,
  closeBrowser,
  BYPASS_LC_API,
  BYPASS_CITY_BASE
};