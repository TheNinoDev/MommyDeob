const LINK_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:linkvertise\.com|pastebin\.com|pastefy\.app|rentry\.co|hastebin\.com|justpaste\.it|controlc\.com|bypass\.city|jnkie\.com|pasteblox\.com|raw\.githubusercontent\.com|github\.com)[^\s"'<>]+/gi;

const LOADSTRING_URL_REGEX = /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(/gi;

function normalizeScriptUrl(inputUrl) {
  let url = inputUrl.trim();

  // GitHub blob -> raw
  const ghMatch = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/i);
  if (ghMatch) {
    return `https://raw.githubusercontent.com/${ghMatch[1]}/${ghMatch[2]}/${ghMatch[3]}/${ghMatch[4]}`;
  }

  // Pastebin normal -> raw
  const pbMatch = url.match(/^https?:\/\/pastebin\.com\/(?:raw\/)?([A-Za-z0-9]+)$/i);
  if (pbMatch && !url.includes('/raw/')) {
    return `https://pastebin.com/raw/${pbMatch[1]}`;
  }

  // Pastefy normal -> raw
  const pfyMatch = url.match(/^https?:\/\/pastefy\.app\/([A-Za-z0-9_-]+)$/i);
  if (pfyMatch && !url.endsWith('/raw')) {
    return `https://pastefy.app/${pfyMatch[1]}/raw`;
  }

  // Rentry normal -> raw
  const rentryMatch = url.match(/^https?:\/\/rentry\.co\/([A-Za-z0-9_-]+)$/i);
  if (rentryMatch && !url.includes('/raw')) {
    return `https://rentry.co/paste/${rentryMatch[1]}/raw`;
  }

  return url;
}

function extractUrlFromLoadstring(code) {
  LOADSTRING_URL_REGEX.lastIndex = 0;
  const urls = [];
  let m;
  while ((m = LOADSTRING_URL_REGEX.exec(code)) !== null) {
    urls.push(m[1]);
  }
  return urls;
}

async function fetchScript(inputUrl, maxBytes = 8_000_000) {
  const directUrl = normalizeScriptUrl(inputUrl);

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://jnkie.com/'
  };

  const res = await fetch(directUrl, { headers });

  if (!res.ok) {
    throw new Error(`Failed to fetch script from URL (HTTP ${res.status}: ${res.statusText})`);
  }

  const contentLength = res.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > maxBytes) {
    throw new Error(`Script is too large (${Math.round(parseInt(contentLength, 10) / 1024)} KB). Maximum allowed is ${Math.round(maxBytes / 1024)} KB.`);
  }

  const text = await res.text();
  if (text.length > maxBytes) {
    throw new Error(`Script exceeds maximum allowed length (${Math.round(maxBytes / 1024)} KB).`);
  }

  return {
    url: directUrl,
    originalUrl: inputUrl,
    code: text,
    bytes: text.length
  };
}

function extractLinksFromText(text) {
  const links = [];
  let m;
  while ((m = LINK_REGEX.exec(text)) !== null) {
    links.push(m[0]);
  }
  return links;
}

module.exports = {
  normalizeScriptUrl,
  fetchScript,
  extractUrlFromLoadstring,
  extractLinksFromText
};