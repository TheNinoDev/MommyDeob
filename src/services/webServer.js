const http = require('http');
const { keyManager } = require('./keyManager');
const { verifyLinkvertiseHash } = require('./linkvertise');

function renderErrorPage(title, message, help) {
  const accent = '#e0115f';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Access Denied // MommyDeob</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: radial-gradient(circle at 50% 20%, #200812 0%, #07070b 100%);
      color: #e2e8f0;
      font-family: 'Space Grotesk', sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      overflow: hidden;
      position: relative;
    }
    .grid-bg {
      position: absolute;
      inset: -50%;
      background-size: 40px 40px;
      background-image: linear-gradient(to right, rgba(224, 17, 95, 0.05) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(224, 17, 95, 0.05) 1px, transparent 1px);
      transform: perspective(600px) rotateX(60deg);
      pointer-events: none;
      animation: gridMove 20s linear infinite;
    }
    @keyframes gridMove {
      0% { transform: perspective(600px) rotateX(60deg) translateY(0); }
      100% { transform: perspective(600px) rotateX(60deg) translateY(40px); }
    }
    .card {
      position: relative;
      background: rgba(14, 15, 23, 0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(224, 17, 95, 0.35);
      border-radius: 20px;
      padding: 44px 36px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 0 50px rgba(224, 17, 95, 0.25), inset 0 0 20px rgba(224, 17, 95, 0.1);
      z-index: 2;
    }
    .badge {
      display: inline-block;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: ${accent};
      background: rgba(224, 17, 95, 0.12);
      padding: 6px 14px;
      border-radius: 99px;
      border: 1px solid rgba(224, 17, 95, 0.4);
      margin-bottom: 20px;
    }
    h1 {
      font-size: 26px;
      font-weight: 800;
      margin-bottom: 12px;
      color: #fff;
      text-shadow: 0 0 20px rgba(224, 17, 95, 0.5);
    }
    p {
      color: #94a3b8;
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .btn-return {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 12px 28px;
      background: ${accent};
      color: #fff;
      font-weight: 700;
      font-size: 14px;
      border-radius: 10px;
      text-decoration: none;
      transition: all 0.3s ease;
      box-shadow: 0 0 25px rgba(224, 17, 95, 0.4);
    }
    .btn-return:hover {
      background: #ff1a6f;
      transform: translateY(-2px);
      box-shadow: 0 0 35px rgba(224, 17, 95, 0.6);
    }
  </style>
</head>
<body>
  <div class="grid-bg"></div>
  <div class="card">
    <div class="badge">[ unauthorized access ]</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="https://discord.com" class="btn-return">${help || 'Return to Discord'}</a>
  </div>
</body>
</html>`;
}

function renderCrazyKeyPage(key) {
  const redeemCommand = `.redeem ${key}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MommyDeob // Key Authorization</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700;800&family=JetBrains+Mono:wght@400;600;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --accent: #e0115f;
      --accent-glow: rgba(224, 17, 95, 0.6);
      --accent-bright: #ff2a7a;
      --bg: #07070b;
      --card-bg: rgba(14, 15, 25, 0.75);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
    }

    body {
      background: var(--bg);
      color: #f1f5f9;
      font-family: 'Space Grotesk', -apple-system, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      overflow-x: hidden;
      perspective: 1200px;
    }

    /* Interactive canvas & 3D background grids */
    #particles-canvas {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 1;
    }

    .cyber-grid {
      position: fixed;
      inset: -50%;
      background-size: 50px 50px;
      background-image: 
        linear-gradient(to right, rgba(224, 17, 95, 0.08) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(224, 17, 95, 0.08) 1px, transparent 1px);
      transform: perspective(700px) rotateX(65deg) translateZ(-100px);
      pointer-events: none;
      z-index: 0;
      animation: gridScroll 16s linear infinite;
    }

    @keyframes gridScroll {
      0% { transform: perspective(700px) rotateX(65deg) translateY(0); }
      100% { transform: perspective(700px) rotateX(65deg) translateY(50px); }
    }

    .ambient-glow {
      position: fixed;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%);
      filter: blur(90px);
      border-radius: 50%;
      pointer-events: none;
      z-index: 0;
      transition: transform 0.15s ease-out;
      opacity: 0.45;
    }

    /* 3D Tilt Wrapper */
    .card-wrapper {
      position: relative;
      z-index: 2;
      transform-style: preserve-3d;
      transition: transform 0.1s ease-out;
    }

    /* Crazy Holographic Glassmorphic Card */
    .card {
      position: relative;
      background: var(--card-bg);
      backdrop-filter: blur(28px) saturate(180%);
      -webkit-backdrop-filter: blur(28px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 48px 40px;
      max-width: 520px;
      width: 100%;
      text-align: center;
      box-shadow: 
        0 30px 80px rgba(0, 0, 0, 0.9),
        0 0 50px rgba(224, 17, 95, 0.2),
        inset 0 1px 1px rgba(255, 255, 255, 0.2);
      transform-style: preserve-3d;
      overflow: hidden;
    }

    /* Shimmering animated border */
    .card::before {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: 26px;
      padding: 2px;
      background: linear-gradient(135deg, transparent 20%, var(--accent) 50%, transparent 80%);
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
      animation: borderShine 6s linear infinite;
    }

    @keyframes borderShine {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Floating Header Badge */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #ff5e9c;
      background: rgba(224, 17, 95, 0.15);
      padding: 7px 18px;
      border-radius: 100px;
      border: 1px solid rgba(224, 17, 95, 0.4);
      margin-bottom: 22px;
      box-shadow: 0 0 20px rgba(224, 17, 95, 0.25);
      transform: translateZ(35px);
    }

    .pulse-dot {
      width: 7px;
      height: 7px;
      background: var(--accent);
      border-radius: 50%;
      box-shadow: 0 0 8px var(--accent-bright);
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(0.9); opacity: 0.7; }
      50% { transform: scale(1.4); opacity: 1; }
      100% { transform: scale(0.9); opacity: 0.7; }
    }

    h1 {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 10px;
      background: linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      transform: translateZ(40px);
    }

    .subtitle {
      color: #94a3b8;
      font-size: 14px;
      margin-bottom: 30px;
      transform: translateZ(30px);
    }

    /* Glitch/Neon Key Display Container */
    .key-container {
      position: relative;
      background: rgba(6, 7, 12, 0.8);
      border: 1px solid rgba(224, 17, 95, 0.35);
      border-radius: 14px;
      padding: 24px 20px;
      margin-bottom: 24px;
      box-shadow: 
        0 10px 30px rgba(0, 0, 0, 0.6),
        inset 0 0 25px rgba(224, 17, 95, 0.15);
      transform: translateZ(50px);
      overflow: hidden;
      cursor: pointer;
    }

    .key-container:hover {
      border-color: var(--accent-bright);
      box-shadow: 
        0 10px 40px rgba(224, 17, 95, 0.35),
        inset 0 0 30px rgba(224, 17, 95, 0.25);
    }

    .key-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 2.5px;
      color: #94a3b8;
      margin-bottom: 8px;
    }

    .key-text {
      font-family: 'JetBrains Mono', monospace;
      font-size: 22px;
      font-weight: 800;
      color: #fff;
      letter-spacing: 3px;
      text-shadow: 0 0 15px var(--accent-glow), 0 0 30px var(--accent-glow);
      user-select: all;
    }

    /* Command snippet */
    .cmd-box {
      background: rgba(10, 11, 18, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 14px 16px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: #ff70a0;
      margin-bottom: 24px;
      transform: translateZ(35px);
      user-select: all;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .cmd-prefix {
      color: #64748b;
      font-size: 11px;
    }

    /* Crazy 3D Glow Button */
    .btn-redeem {
      position: relative;
      width: 100%;
      background: linear-gradient(135deg, var(--accent) 0%, #ba0d4d 100%);
      color: #fff;
      border: none;
      border-radius: 12px;
      padding: 18px 28px;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 0.5px;
      cursor: pointer;
      overflow: hidden;
      transform: translateZ(60px);
      box-shadow: 0 10px 30px rgba(224, 17, 95, 0.45);
      transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .btn-redeem:hover {
      background: linear-gradient(135deg, var(--accent-bright) 0%, var(--accent) 100%);
      transform: translateZ(75px) scale(1.02);
      box-shadow: 0 15px 45px rgba(224, 17, 95, 0.7);
    }

    .btn-redeem:active {
      transform: translateZ(40px) scale(0.98);
    }

    .btn-redeem::after {
      content: '';
      position: absolute;
      top: -50%;
      left: -60%;
      width: 50%;
      height: 200%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
      transform: rotate(30deg);
      transition: all 0.6s ease;
    }

    .btn-redeem:hover::after {
      left: 140%;
    }

    /* Confetti container */
    #confetti-canvas {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 10;
    }

    .footer-note {
      margin-top: 26px;
      font-size: 12px;
      color: #64748b;
      transform: translateZ(25px);
    }
  </style>
</head>
<body>
  <div class="cyber-grid"></div>
  <div class="ambient-glow" id="ambientGlow"></div>
  <canvas id="particles-canvas"></canvas>
  <canvas id="confetti-canvas"></canvas>

  <div class="card-wrapper" id="cardWrapper">
    <div class="card" id="card">
      <div class="badge">
        <span class="pulse-dot"></span>
        <span>[ verified linkvertise bypass ]</span>
      </div>

      <h1>License Generated</h1>
      <p class="subtitle">Valid 7-day single-use authorization token</p>

      <div class="key-container" id="keyContainer" onclick="copyRedeem()">
        <div class="key-tag">Authorization License Key</div>
        <div class="key-text" id="keyText">${key}</div>
      </div>

      <div class="cmd-box">
        <span class="cmd-prefix">Discord Command</span>
        <span id="cmdText">${redeemCommand}</span>
      </div>

      <button class="btn-redeem" id="copyBtn" onclick="copyRedeem()">
        <span id="btnLabel">Copy Redeem Command</span>
      </button>

      <p class="footer-note">Paste in the bot channel to activate instant Luau deobfuscator access.</p>
    </div>
  </div>

  <script>
    // 3D Mouse Parallax & Dynamic Light Effect
    const wrapper = document.getElementById('cardWrapper');
    const glow = document.getElementById('ambientGlow');

    document.addEventListener('mousemove', (e) => {
      const { innerWidth: width, innerHeight: height } = window;
      const x = (e.clientX - width / 2) / (width / 2);
      const y = (e.clientY - height / 2) / (height / 2);

      // Rotate card in 3D space
      wrapper.style.transform = 'rotateY(' + (x * 14) + 'deg) rotateX(' + (-y * 14) + 'deg)';

      // Move ambient radial glow
      glow.style.transform = 'translate(' + (e.clientX - 300) + 'px, ' + (e.clientY - 300) + 'px)';
    });

    // Reset card smoothly when mouse leaves
    document.addEventListener('mouseleave', () => {
      wrapper.style.transform = 'rotateY(0deg) rotateX(0deg)';
    });

    // Background Cyber Particles
    const pCanvas = document.getElementById('particles-canvas');
    const pCtx = pCanvas.getContext('2d');
    let particles = [];

    function resizeParticles() {
      pCanvas.width = window.innerWidth;
      pCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeParticles);
    resizeParticles();

    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * pCanvas.width,
        y: Math.random() * pCanvas.height,
        size: Math.random() * 2.5 + 1,
        speedX: (Math.random() - 0.5) * 0.8,
        speedY: (Math.random() - 0.5) * 0.8,
        opacity: Math.random() * 0.5 + 0.2
      });
    }

    function renderParticles() {
      pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
      pCtx.fillStyle = '#e0115f';
      for (let p of particles) {
        pCtx.globalAlpha = p.opacity;
        pCtx.beginPath();
        pCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        pCtx.fill();

        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = pCanvas.width;
        if (p.x > pCanvas.width) p.x = 0;
        if (p.y < 0) p.y = pCanvas.height;
        if (p.y > pCanvas.height) p.y = 0;
      }
      requestAnimationFrame(renderParticles);
    }
    renderParticles();

    // Confetti burst on copy
    const cCanvas = document.getElementById('confetti-canvas');
    const cCtx = cCanvas.getContext('2d');
    let confetti = [];

    function resizeConfetti() {
      cCanvas.width = window.innerWidth;
      cCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeConfetti);
    resizeConfetti();

    function fireConfetti() {
      const colors = ['#e0115f', '#ff2a7a', '#ffffff', '#ff99c2', '#ff548e'];
      for (let i = 0; i < 70; i++) {
        confetti.push({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
          size: Math.random() * 6 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          vx: (Math.random() - 0.5) * 16,
          vy: (Math.random() - 0.5) * 16 - 3,
          gravity: 0.35,
          alpha: 1,
          decay: Math.random() * 0.02 + 0.015
        });
      }
    }

    function renderConfetti() {
      cCtx.clearRect(0, 0, cCanvas.width, cCanvas.height);
      for (let i = confetti.length - 1; i >= 0; i--) {
        const c = confetti[i];
        cCtx.globalAlpha = c.alpha;
        cCtx.fillStyle = c.color;
        cCtx.fillRect(c.x, c.y, c.size, c.size);

        c.x += c.vx;
        c.y += c.vy;
        c.vy += c.gravity;
        c.alpha -= c.decay;

        if (c.alpha <= 0) confetti.splice(i, 1);
      }
      requestAnimationFrame(renderConfetti);
    }
    renderConfetti();

    // Copy to clipboard & trigger effects
    function copyRedeem() {
      const text = ${JSON.stringify(redeemCommand)};
      navigator.clipboard.writeText(text).then(() => {
        const label = document.getElementById('btnLabel');
        label.innerText = 'COPIED TO CLIPBOARD!';
        fireConfetti();
        setTimeout(() => {
          label.innerText = 'Copy Redeem Command';
        }, 3000);
      }).catch(() => {
        prompt('Copy command manually:', text);
      });
    }
  </script>
</body>
</html>`;
}

function startWebServer(port = 3000) {
  const server = http.createServer(async (req, res) => {
    try {
      const parsed = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const pathname = parsed.pathname;

      if (pathname === '/' || pathname === '/key') {
        const hash = parsed.searchParams.get('hash');

        // STRICT SECURITY: Must provide a hash to receive a key
        if (!hash || !hash.trim()) {
          const html = renderErrorPage(
            'Direct Access Forbidden',
            'You cannot obtain a key by opening this URL directly, skid. You must finish the Linkvertise checkpoint from Discord (`.getkey`).',
            'Go back and run .getkey'
          );
          res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
          return res.end(html);
        }

        const cleanHash = hash.trim();

        // Check if this hash has ALREADY been issued a key previously
        // (Allows users to refresh the page without breaking their key)
        const existingClaim = keyManager.getOrCreateKeyForHash(cleanHash);
        
        // If it's a completely new hash, verify with Linkvertise Anti-Bypass API
        if (!existingClaim.alreadyExisted) {
          const verifyResult = await verifyLinkvertiseHash(cleanHash);
          if (!verifyResult.valid) {
            // Note: If Linkvertise is in test mode or rejects, reject the visitor
            console.warn(`[WebServer] Rejected invalid hash: ${cleanHash} - ${verifyResult.message}`);
            const html = renderErrorPage(
              'Invalid or Bypassed Hash',
              'Linkvertise anti-bypass verification failed. Stop using bypass extensions or stale hashes.',
              'Get a new link via .getkey'
            );
            res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
            return res.end(html);
          }
        }

        const html = renderCrazyKeyPage(existingClaim.key);
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store'
        });
        return res.end(html);
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
