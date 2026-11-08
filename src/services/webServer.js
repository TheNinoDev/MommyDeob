const http = require('http');
const fs = require('fs');
const path = require('path');
const { keyManager } = require('./keyManager');
const { verifyLinkvertiseHash, getSession, saveSessions } = require('./linkvertise');
const { renderCrazyKeyPage } = require('./ticketTemplate');

function renderErrorPage(title, message, help) {
  const accent = '#e0115f';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CYBER LOCKDOWN // ACCESS DENIED</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;800&family=JetBrains+Mono:wght@400;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #020204;
      color: #f8fafc;
      font-family: 'Space Grotesk', sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      overflow: hidden;
      position: relative;
    }
    .red-alert-grid {
      position: absolute;
      inset: -50%;
      background-size: 50px 50px;
      background-image: 
        linear-gradient(to right, rgba(224, 17, 95, 0.18) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(224, 17, 95, 0.18) 1px, transparent 1px);
      transform: perspective(600px) rotateX(65deg);
      animation: alertGrid 4s linear infinite;
      pointer-events: none;
    }
    @keyframes alertGrid {
      0% { transform: perspective(600px) rotateX(65deg) translateY(0); }
      100% { transform: perspective(600px) rotateX(65deg) translateY(50px); }
    }
    .red-strobe {
      position: fixed;
      inset: 0;
      background: radial-gradient(circle at 50% 50%, rgba(224, 17, 95, 0.22) 0%, transparent 70%);
      animation: alertPulse 1.8s ease-in-out infinite alternate;
      pointer-events: none;
    }
    @keyframes alertPulse {
      0% { opacity: 0.3; }
      100% { opacity: 0.9; }
    }
    .glitch-card {
      position: relative;
      background: rgba(10, 11, 18, 0.88);
      backdrop-filter: blur(25px);
      border: 1px solid rgba(224, 17, 95, 0.5);
      border-radius: 20px;
      padding: 40px 32px;
      max-width: 520px;
      width: 100%;
      text-align: center;
      box-shadow: 0 0 60px rgba(224, 17, 95, 0.35), inset 0 0 30px rgba(224, 17, 95, 0.15);
      z-index: 5;
    }
    .alert-badge {
      display: inline-block;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 3px;
      color: #ff2a7a;
      background: rgba(224, 17, 95, 0.18);
      padding: 6px 16px;
      border-radius: 99px;
      border: 1px solid rgba(224, 17, 95, 0.6);
      margin-bottom: 20px;
      animation: badgeBlink 1.2s ease-in-out infinite;
    }
    @keyframes badgeBlink {
      0%, 100% { border-color: rgba(224, 17, 95, 0.8); box-shadow: 0 0 15px rgba(224, 17, 95, 0.6); }
      50% { border-color: rgba(224, 17, 95, 0.2); box-shadow: none; }
    }
    h1 {
      font-size: 28px;
      font-weight: 800;
      color: #fff;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 14px;
      text-shadow: 0 0 25px rgba(224, 17, 95, 0.7);
    }
    p {
      color: #94a3b8;
      font-size: 14.5px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .hud-box {
      background: rgba(0, 0, 0, 0.7);
      border: 1px dashed rgba(224, 17, 95, 0.4);
      border-radius: 10px;
      padding: 12px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: #e2e8f0;
      margin-bottom: 28px;
      text-align: left;
    }
    .btn-return {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 14px 32px;
      background: linear-gradient(135deg, #e0115f, #ff2a7a);
      color: #fff;
      font-weight: 800;
      font-size: 13px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      border-radius: 12px;
      text-decoration: none;
      box-shadow: 0 0 35px rgba(224, 17, 95, 0.6);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .btn-return:hover {
      transform: translateY(-2px) scale(1.03);
      box-shadow: 0 0 50px rgba(255, 42, 122, 0.85);
    }
  </style>
</head>
<body>
  <div class="red-alert-grid"></div>
  <div class="red-strobe"></div>
  <div class="glitch-card">
    <div class="alert-badge">[ SECURITY INTERCEPT ]</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <div class="hud-box">
      <div>PROTOCOL: ANTI-BYPASS ENFORCEMENT</div>
      <div>DEFENSE: RED SQUARE CLOUD VERIFICATION</div>
      <div>REASON: SINGLE-USE / 10S TIME-LOCK EXPIRED</div>
    </div>
    <a href="https://discord.com" class="btn-return">${help || 'Return to Discord'}</a>
  </div>
</body>
</html>`;
}


function startWebServer(port = 3000) {
  const server = http.createServer(async (req, res) => {
    try {
      const parsed = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const pathname = parsed.pathname;

      if (pathname === '/callback' || pathname === '/' || pathname === '/key') {
        let sessionId = parsed.searchParams.get('session');
        let hash = parsed.searchParams.get('hash');

        // Defensive query extraction in case Linkvertise malformed the query string
        if (!sessionId) {
          const sMatch = req.url.match(/[?&]session=([a-f0-9]{24,64})/i);
          if (sMatch) sessionId = sMatch[1];
        }
        if (!hash) {
          const hMatch = req.url.match(/[?&]hash=([a-f0-9]{64})/i);
          if (hMatch) hash = hMatch[1];
        }

        // 1. STRICT SECURITY: Reject direct access without session and anti-bypass hash
        if (!sessionId || !sessionId.trim() || !hash || !hash.trim()) {
          const html = renderErrorPage(
            'Direct Access Forbidden',
            'You cannot obtain a key by opening this URL directly, skid. You must finish the Linkvertise checkpoint from Discord (`.getkey`).',
            'Go back and run .getkey'
          );
          res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
          return res.end(html);
        }

        const cleanSessionId = sessionId.trim();
        const cleanHash = hash.trim();

        // 2. Verify that the session exists and is active
        const session = getSession(cleanSessionId);
        if (!session) {
          console.warn(`[WebServer] Access rejected: unknown session ${cleanSessionId}`);
          const html = renderErrorPage(
            'Invalid Session',
            'The checkpoint session was not found or has expired. Generate a new link in Discord using `.getkey`.',
            'Run .getkey in Discord'
          );
          res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
          return res.end(html);
        }

        if (session.expiresAt && Date.now() > session.expiresAt) {
          console.warn(`[WebServer] Access rejected: expired session ${cleanSessionId}`);
          const html = renderErrorPage(
            'Session Expired',
            'This checkpoint session has expired. Links are valid for 1 hour from creation. Run `.getkey` in Discord for a fresh link.',
            'Run .getkey in Discord'
          );
          res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
          return res.end(html);
        }

        // 3. Atomicity check: Never allow the same session to be redeemed twice
        if (session.completed) {
          // If the session was already successfully verified and redeemed, show the granted key without re-verifying
          if (session.key) {
            const html = renderCrazyKeyPage(session.key);
            res.writeHead(200, {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'no-store'
            });
            return res.end(html);
          }

          const html = renderErrorPage(
            'Session Already Redeemed',
            'This session has already been redeemed and cannot be processed again.',
            'Run .getkey for a new link'
          );
          res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
          return res.end(html);
        }

        // 4. Immediately send POST request to Linkvertise Anti-Bypass API
        // Hashes expire after ~10 seconds and are single-use
        const verifyResult = await verifyLinkvertiseHash(cleanHash);
        if (!verifyResult.valid) {
          console.warn(`[WebServer] Anti-Bypass verification failed for session ${cleanSessionId}: ${verifyResult.message}`);
          const html = renderErrorPage(
            'Anti-Bypass Verification Failed',
            `Linkvertise anti-bypass verification rejected: ${verifyResult.message}. Bypass extensions, stale hashes (>10s window), and fake hashes are blocked.`,
            'Run .getkey in Discord for a fresh link'
          );
          res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
          return res.end(html);
        }

        // 5. Mark the session as completed atomically
        session.completed = true;
        session.completedAt = Date.now();
        session.hash = cleanHash;

        // 6. Generate one-time key and automatically grant user access
        const key = keyManager.createOneTimeKey(`session_${cleanSessionId}`);
        session.key = key;
        saveSessions();

        if (session.userId) {
          keyManager.grantUserAccess(session.userId, key, 7, 'Linkvertise Anti-Bypass Dynamic Link');
        }

        console.log(`[WebServer] Successfully verified Linkvertise hash for user ${session.userId}, issued ${key}`);

        const html = renderCrazyKeyPage(key);
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store'
        });
        return res.end(html);
      }

      if (pathname === '/assets/t3tge8oizwo51.gif' || pathname === '/t3tge8oizwo51.gif') {
        const gifPath = path.join(__dirname, '..', '..', 'assets', 't3tge8oizwo51.gif');
        const altPath = path.join(__dirname, '..', '..', 't3tge8oizwo51.gif');
        const targetPath = fs.existsSync(gifPath) ? gifPath : (fs.existsSync(altPath) ? altPath : null);

        if (targetPath) {
          res.writeHead(200, {
            'Content-Type': 'image/gif',
            'Cache-Control': 'public, max-age=86400'
          });
          return fs.createReadStream(targetPath).pipe(res);
        }
      }

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
    console.log(`[MommyDeob] Web server listening on port ${port} (Key landing page secured)`);
  });

  return server;
}

module.exports = { startWebServer };
