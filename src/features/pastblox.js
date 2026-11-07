const { fetchScript, extractUrlFromLoadstring } = require('../services/fetcher');
const { deobfuscate, detect, detectName } = require('../deobfuscator');

function extractPastbloxConfig(code) {
  if (!code) return null;
  const cfgMatch = code.match(/local\s+cfg\s*=\s*\{([\s\S]*?)\n\}/);
  if (!cfgMatch) return null;
  const body = cfgMatch[1];
  const config = {};
  const slugMatch = body.match(/slug\s*=\s*["']([^"']+)["']/);
  const originMatch = body.match(/origin\s*=\s*["']([^"']+)["']/);
  const nameMatch = body.match(/name\s*=\s*["']([^"']+)["']/);
  const titleMatch = body.match(/title\s*=\s*["']([^"']+)["']/);
  if (slugMatch) config.slug = slugMatch[1];
  if (originMatch) config.origin = originMatch[1];
  if (nameMatch) config.name = nameMatch[1];
  if (titleMatch) config.title = titleMatch[1];
  if (config.slug && config.origin) {
    config.keyUrl = `${config.origin.replace(/\/+$/, '')}/k/${config.slug}`;
  }
  return config;
}

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

  const config = extractPastbloxConfig(code);

  // Try to extract loadstring URL from inside the script content
  const innerUrls = extractUrlFromLoadstring(code);

  let resolved = null;
  let innerCode = null;
  let deobfResult = null;

  if (innerUrls.length > 0) {
    try {
      const inner = await fetchScript(innerUrls[0]);
      innerCode = inner.code;

      const detected = detect(innerCode);
      if (detected !== 'unknown') {
        try {
          const result = await deobfuscate(innerCode);
          deobfResult = {
            engine: detectName(detected),
            code: result.code,
            report: result.report || ''
          };
        } catch (_) {
          // Keep raw innerCode
        }
      }

      resolved = {
        outerUrl: url,
        innerUrl: innerUrls[0],
        innerCode,
        detected,
        deobf: deobfResult
      };
    } catch (_) {
      resolved = { outerUrl: url, innerUrl: innerUrls[0], innerCode: null, error: 'Could not fetch inner loadstring URL' };
    }
  } else {
    // No direct loadstring in raw text - check if the script is obfuscated (e.g. Luraph or WeAreDevs)
    const detected = detect(code);
    if (detected !== 'unknown') {
      try {
        const result = await deobfuscate(code);
        if (result && result.code && result.code.trim().length > 0) {
          deobfResult = {
            engine: detectName(detected),
            code: result.code,
            report: result.report || '',
            traceLines: result.traceLines || []
          };
          innerCode = result.code;
        }
      } catch (_) {
        // Deobfuscation halted
      }
    }

    resolved = {
      outerUrl: url,
      config,
      innerUrl: config ? config.keyUrl : null,
      innerCode,
      detected,
      deobf: deobfResult
    };
  }

  return {
    source: 'pastblox',
    outerUrl: url,
    outerCode: code,
    config,
    innerLoadstringUrls: innerUrls,
    innerCode,
    deobf: deobfResult,
    resolved
  };
}

module.exports = { resolvePastblox, extractPastbloxConfig };
