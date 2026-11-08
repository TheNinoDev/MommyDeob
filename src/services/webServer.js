const http = require('http');
const url = require('url');
const { keyManager } = require('./keyManager');

function createHtmlPage(key, error = null) {
  const accent = '#e0115f';
  const bg = '#0d0e15';
  const cardBg = '#141724';
  const textMuted = '#8b92a8';
  const border = '#25293d';

  if (error) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MommyDeob | Error</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: ${bg}; color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: ${cardBg}; border: 1px solid #ff4466; border-radius: 12px; padding: 32px; max-width: 460px; width: 100%; text-align: center; }
    h1 { color: #ff4466; font-size: 22px; margin-bottom: 12px; }
    p { color: ${textMuted}; font-size: 14px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <h1>[ verification failed ]</h1>
    <p>${error}</p>
  </div>
</body>
</html>`;
  }

  const redeemCommand = `.redeem ${key}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MommyDeob | Your 7-Day Access Key</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif; }
    body {
      background: radial-gradient(circle at top, #1e1322 0%, ${bg} 100%);
      color: #f0f2f8;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .container {
      background: ${cardBg};
      border: 1px solid ${border};
      border-top: 3px solid ${accent};
      border-radius: 14px;
      padding: 36px 32px;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
      text-align: center;
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: ${accent};
      background: rgba(224, 17, 95, 0.12);
      padding: 4px 12px;
      border-radius: 20px;
      border: 1px solid rgba(224, 17, 95, 0.3);
      margin-bottom: 16px;
    }
    h1 {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }
    .subtitle {
      color: ${textMuted};
      font-size: 14px;
      margin-bottom: 24px;
    }
    .key-box {
      background: #090a10;
      border: 1px dashed ${accent};
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
    }
    .key-label {
      font-size: 11px;
      text-transform: uppercase;
      color: ${textMuted};
      letter-spacing: 1px;
      margin-bottom: 6px;
    }
    .key-value {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 20px;
      font-weight: 700;
      color: #fff;
      letter-spacing: 2px;
      word-break: break-all;
    }
    .command-preview {
      background: #090a10;
      border: 1px solid ${border};
      border-radius: 8px;
      padding: 12px;
      font-family: monospace;
      color: #ff85ad;
      font-size: 13px;
      margin-bottom: 20px;
      user-select: all;
    }
    .btn-copy {
      background: ${accent};
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 14px 24px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      width: 100%;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .btn-copy:hover {
      background: #c00e50;
      transform: translateY(-1px);
    }
    .btn-copy:active {
      transform: translateY(1px);
    }
    .instructions {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid ${border};
      text-align: left;
      font-size: 12px;
      color: ${textMuted};
      line-height: 1.6;
    }
    .instructions ol {
      margin-left: 18px;
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">[ task complete ]</div>
    <h1>Your Key Is Ready</h1>
    <p class="subtitle">Your 7-day license for MommyDeob has been generated.</p>

    <div class="key-box">
      <div class="key-label">One-Time License Key</div>
      <div class="key-value" id="keyValue">${key}</div>
    </div>

    <div class="command-preview" id="cmdPreview">${redeemCommand}</div>

    <button class="btn-copy" id="copyBtn" onclick="copyRedeem()">
      <span id="btnText">Copy Redeem Command</span>
    </button>

    <div class="instructions">
      <strong>Next Steps:</strong>
      <ol>
        <li>Click <b>Copy Redeem Command</b> above.</li>
        <li>Paste it directly in the Discord bot channel.</li>
        <li>Enjoy 7 days of unlimited Luau deobfuscations.</li>
      </ol>
    </div>
  </div>

  <script>
    function copyRedeem() {
      const text = ${JSON.stringify(redeemCommand)};
      navigator.clipboard.writeText(text).then(() => {
        const btnText = document.getElementById('btnText');
        btnText.innerText = 'Copied to Clipboard!';
        setTimeout(() => {
          btnText.innerText = 'Copy Redeem Command';
        }, 2500);
      }).catch(err => {
        alert('Could not auto-copy, please copy manually: ' + text);
      });
    }
  </script>
</body>
</html>`;
}

function startWebServer(port = 3000) {
  const server = http.createServer((req, res) => {
    try {
      const parsed = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const pathname = parsed.pathname;

      if (pathname === '/' || pathname === '/key') {
        // Linkvertise redirects to target with ?hash=xxxx
        const hash = parsed.searchParams.get('hash');
        
        let keyToDisplay;
        if (hash) {
          const claim = keyManager.getOrCreateKeyForHash(hash);
          keyToDisplay = claim.key;
        } else {
          // If no hash provided, generate a one-time key directly for landing
          keyToDisplay = keyManager.createOneTimeKey('web_claim');
        }

        const html = createHtmlPage(keyToDisplay);
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store'
        });
        return res.end(html);
      }

      // Health check endpoint
      if (pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ status: 'ok', time: Date.now() }));
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    } catch (e) {
      console.error('[WebServer] Error handling request:', e);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Server error');
    }
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`[MommyDeob] Web server listening on port ${port} (Key landing page ready)`);
  });

  return server;
}

module.exports = { startWebServer };
