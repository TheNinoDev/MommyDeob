const { fetchScript } = require('./fetcher');

async function resolvePastblox(inputUrl) {
  // Normalize pasteblox.com/raw/<id> URLs
  let url = inputUrl.trim();
  if (url.includes('pasteblox.com/raw/')) {
    // Already raw format
  } else if (url.includes('pasteblox.com/')) {
    // Convert normal pasteblox link to raw
    const match = url.match(/pasteblox\.com\/(?:view|raw)?\/([A-Za-z0-9_-]+)/i);
    if (match) {
      url = `https://pasteblox.com/raw/${match[1]}`;
    }
  }

  let code;
  try {
    const fetched = await fetchScript(url);
    code = fetched.code;
  } catch (err) {
    throw new Error(`Could not fetch pastblox script: ${err.message}`);
  }

  // Try to extract loadstring URL from inside the script content
  const { extractUrlFromLoadstring } = require('./fetcher');
  const innerUrls = extractUrlFromLoadstring(code);

  let resolved = null;
  let innerCode = null;
  if (innerUrls.length > 0) {
    try {
      const inner = await fetchScript(innerUrls[0]);
      innerCode = inner.code;
      resolved = {
        outerUrl: url,
        innerUrl: innerUrls[0],
        innerCode
      };
    } catch (_) {
      resolved = { outerUrl: url, innerUrl: innerUrls[0], innerCode: null, error: 'Could not fetch inner loadstring URL' };
    }
  }

  return {
    source: 'pastblox',
    outerUrl: url,
    outerCode: code,
    innerLoadstringUrls: innerUrls,
    innerCode,
    resolved
  };
}

module.exports = { resolvePastblox };