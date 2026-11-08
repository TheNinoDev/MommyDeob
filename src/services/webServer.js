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
  <title>MommyDeob // Quantum Key Authorization</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700;800&family=JetBrains+Mono:wght@400;600;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --accent: #e0115f;
      --accent-glow: rgba(224, 17, 95, 0.65);
      --accent-bright: #ff2a7a;
      --accent-cyan: #00f2fe;
      --bg: #040407;
      --card-bg: rgba(10, 11, 20, 0.7);
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
      overflow: hidden;
      perspective: 1400px;
      cursor: crosshair;
    }

    /* Fullscreen canvas layers */
    #matrix-canvas, #particles-canvas, #confetti-canvas {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
    }
    #matrix-canvas { z-index: 0; opacity: 0.18; }
    #particles-canvas { z-index: 1; }
    #confetti-canvas { z-index: 100; }

    /* 3D Infinity Cyber Grids - Floor and Ceiling */
    .cyber-grid-floor {
      position: fixed;
      inset: -50%;
      background-size: 60px 60px;
      background-image: 
        linear-gradient(to right, rgba(224, 17, 95, 0.1) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(224, 17, 95, 0.1) 1px, transparent 1px);
      transform: perspective(600px) rotateX(70deg) translateZ(-80px);
      pointer-events: none;
      z-index: 0;
      animation: gridFloorScroll 12s linear infinite;
    }
    @keyframes gridFloorScroll {
      0% { transform: perspective(600px) rotateX(70deg) translateY(0); }
      100% { transform: perspective(600px) rotateX(70deg) translateY(60px); }
    }

    .cyber-grid-ceiling {
      position: fixed;
      inset: -50%;
      background-size: 60px 60px;
      background-image: 
        linear-gradient(to right, rgba(0, 242, 254, 0.05) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(0, 242, 254, 0.05) 1px, transparent 1px);
      transform: perspective(600px) rotateX(-70deg) translateZ(-80px);
      pointer-events: none;
      z-index: 0;
      animation: gridCeilScroll 12s linear infinite;
    }
    @keyframes gridCeilScroll {
      0% { transform: perspective(600px) rotateX(-70deg) translateY(0); }
      100% { transform: perspective(600px) rotateX(-70deg) translateY(60px); }
    }

    /* CRT scanline and vignette overlay */
    .scanlines {
      position: fixed;
      inset: 0;
      background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%);
      background-size: 100% 4px;
      z-index: 90;
      pointer-events: none;
      opacity: 0.6;
    }

    .vignette {
      position: fixed;
      inset: 0;
      background: radial-gradient(circle at center, transparent 40%, #000000 100%);
      pointer-events: none;
      z-index: 89;
    }

    /* Custom Custom Neon Follower */
    .custom-cursor {
      position: fixed;
      width: 32px;
      height: 32px;
      border: 2px solid var(--accent-bright);
      border-radius: 50%;
      pointer-events: none;
      z-index: 999;
      transform: translate(-50%, -50%);
      transition: width 0.15s, height 0.15s, border-color 0.15s, transform 0.05s ease-out;
      box-shadow: 0 0 15px var(--accent-glow);
    }
    .custom-cursor-dot {
      position: fixed;
      width: 6px;
      height: 6px;
      background: #fff;
      border-radius: 50%;
      pointer-events: none;
      z-index: 1000;
      transform: translate(-50%, -50%);
      box-shadow: 0 0 10px #fff;
    }

    /* Ambient Dual-Orb Cursor Lighting */
    .ambient-orb-1 {
      position: fixed;
      width: 550px;
      height: 550px;
      background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%);
      filter: blur(100px);
      border-radius: 50%;
      pointer-events: none;
      z-index: 0;
      opacity: 0.55;
      transition: transform 0.15s ease-out;
    }
    .ambient-orb-2 {
      position: fixed;
      width: 450px;
      height: 450px;
      background: radial-gradient(circle, rgba(0, 242, 254, 0.35) 0%, transparent 70%);
      filter: blur(120px);
      border-radius: 50%;
      pointer-events: none;
      z-index: 0;
      opacity: 0.35;
      transition: transform 0.3s ease-out;
    }

    /* 3D Tilt Wrapper */
    .card-wrapper {
      position: relative;
      z-index: 10;
      transform-style: preserve-3d;
      will-change: transform;
    }

    /* Crazy Holographic Glassmorphic Cyber Card */
    .card {
      position: relative;
      background: var(--card-bg);
      backdrop-filter: blur(35px) saturate(200%);
      -webkit-backdrop-filter: blur(35px) saturate(200%);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 28px;
      padding: 50px 42px;
      max-width: 540px;
      width: 100%;
      text-align: center;
      box-shadow: 
        0 40px 100px rgba(0, 0, 0, 0.95),
        0 0 60px rgba(224, 17, 95, 0.25),
        inset 0 1px 2px rgba(255, 255, 255, 0.3);
      transform-style: preserve-3d;
      overflow: hidden;
    }

    /* RGB Hologram Edge Border */
    .card::before {
      content: '';
      position: absolute;
      inset: -3px;
      border-radius: 31px;
      padding: 3px;
      background: linear-gradient(135deg, 
        #e0115f 0%, 
        #00f2fe 30%, 
        #ff2a7a 60%, 
        #7928ca 100%
      );
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
      animation: borderRGB 8s linear infinite;
    }
    @keyframes borderRGB {
      0% { filter: hue-rotate(0deg); }
      100% { filter: hue-rotate(360deg); }
    }

    /* Floating Status Badge */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      color: #ff5e9c;
      background: rgba(224, 17, 95, 0.15);
      padding: 8px 22px;
      border-radius: 100px;
      border: 1px solid rgba(224, 17, 95, 0.5);
      margin-bottom: 24px;
      box-shadow: 0 0 25px rgba(224, 17, 95, 0.35);
      transform: translateZ(45px);
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      background: var(--accent-bright);
      border-radius: 50%;
      box-shadow: 0 0 12px var(--accent-bright);
      animation: pulse 1.2s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.8); opacity: 0.6; }
      50% { transform: scale(1.6); opacity: 1; }
      100% { transform: scale(0.8); opacity: 0.6; }
    }

    /* Glitch Typography */
    .glitch-title {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
      color: #fff;
      position: relative;
      text-shadow: 0 0 20px rgba(224, 17, 95, 0.6);
      transform: translateZ(55px);
    }
    .glitch-title::before, .glitch-title::after {
      content: 'LICENSE GRANTED';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
    .glitch-title::before {
      left: 2px;
      text-shadow: -2px 0 #00f2fe;
      clip: rect(24px, 550px, 90px, 0);
      animation: glitch-anim 3s infinite linear alternate-reverse;
    }
    .glitch-title::after {
      left: -2px;
      text-shadow: -2px 0 #e0115f;
      clip: rect(85px, 550px, 140px, 0);
      animation: glitch-anim 2s infinite linear alternate-reverse;
    }
    @keyframes glitch-anim {
      0% { clip: rect(12px, 9999px, 44px, 0); }
      20% { clip: rect(65px, 9999px, 100px, 0); }
      40% { clip: rect(20px, 9999px, 60px, 0); }
      60% { clip: rect(80px, 9999px, 110px, 0); }
      80% { clip: rect(10px, 9999px, 35px, 0); }
      100% { clip: rect(40px, 9999px, 75px, 0); }
    }

    .subtitle {
      color: #94a3b8;
      font-size: 14px;
      margin-bottom: 28px;
      transform: translateZ(40px);
    }

    /* 3D Floating Interactive Hologram Key Box */
    .key-box-3d {
      position: relative;
      background: rgba(5, 6, 12, 0.85);
      border: 1px solid rgba(224, 17, 95, 0.4);
      border-radius: 16px;
      padding: 24px 20px;
      margin-bottom: 24px;
      box-shadow: 
        0 15px 35px rgba(0, 0, 0, 0.7),
        inset 0 0 30px rgba(224, 17, 95, 0.2);
      transform: translateZ(70px);
      cursor: pointer;
      overflow: hidden;
      transition: all 0.25s ease;
    }
    .key-box-3d:hover {
      border-color: var(--accent-bright);
      box-shadow: 
        0 20px 50px rgba(224, 17, 95, 0.45),
        inset 0 0 40px rgba(224, 17, 95, 0.35);
      transform: translateZ(85px) scale(1.02);
    }

    /* Glowing laser line passing through key */
    .laser-beam {
      position: absolute;
      top: 0;
      left: -100%;
      width: 50%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 42, 122, 0.5), transparent);
      transform: skewX(-25deg);
      animation: laserSweep 3.5s infinite;
    }
    @keyframes laserSweep {
      0% { left: -100%; }
      50%, 100% { left: 200%; }
    }

    .key-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 3px;
      color: #94a3b8;
      margin-bottom: 10px;
    }

    .key-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 24px;
      font-weight: 800;
      color: #fff;
      letter-spacing: 3.5px;
      text-shadow: 
        0 0 10px var(--accent-bright),
        0 0 30px var(--accent-glow),
        0 0 50px var(--accent);
      user-select: all;
    }

    /* Command snippet */
    .cmd-box {
      background: rgba(8, 9, 16, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 15px 18px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: #ff70a0;
      margin-bottom: 26px;
      transform: translateZ(50px);
      user-select: all;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    }
    .cmd-prefix {
      color: #64748b;
      font-size: 11px;
      letter-spacing: 1px;
    }

    /* Ultra 3D Cyber Button */
    .btn-redeem {
      position: relative;
      width: 100%;
      background: linear-gradient(135deg, var(--accent) 0%, #a00b41 100%);
      color: #fff;
      border: none;
      border-radius: 14px;
      padding: 20px 32px;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 1px;
      cursor: pointer;
      overflow: hidden;
      transform: translateZ(85px);
      box-shadow: 0 12px 35px rgba(224, 17, 95, 0.5);
      transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .btn-redeem:hover {
      background: linear-gradient(135deg, var(--accent-bright) 0%, var(--accent) 100%);
      transform: translateZ(105px) scale(1.03);
      box-shadow: 0 20px 55px rgba(224, 17, 95, 0.8);
    }
    .btn-redeem:active {
      transform: translateZ(60px) scale(0.97);
    }
    .btn-redeem::after {
      content: '';
      position: absolute;
      top: -50%;
      left: -60%;
      width: 50%;
      height: 200%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
      transform: rotate(30deg);
      transition: all 0.6s ease;
    }
    .btn-redeem:hover::after {
      left: 140%;
    }

    /* Ripple shockwave effect on button click */
    .ripple {
      position: absolute;
      border-radius: 50%;
      transform: scale(0);
      animation: rippleEffect 0.6s linear;
      background-color: rgba(255, 255, 255, 0.4);
      pointer-events: none;
    }
    @keyframes rippleEffect {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }

    .footer-note {
      margin-top: 26px;
      font-size: 12px;
      color: #64748b;
      transform: translateZ(35px);
    }
  </style>
</head>
<body>
  <div class="cyber-grid-floor"></div>
  <div class="cyber-grid-ceiling"></div>
  <div class="scanlines"></div>
  <div class="vignette"></div>

  <!-- Dual interactive glow lights -->
  <div class="ambient-orb-1" id="orb1"></div>
  <div class="ambient-orb-2" id="orb2"></div>

  <!-- Canvas layers: matrix rain, cyber particles, confetti -->
  <canvas id="matrix-canvas"></canvas>
  <canvas id="particles-canvas"></canvas>
  <canvas id="confetti-canvas"></canvas>

  <!-- Interactive custom mouse cursor -->
  <div class="custom-cursor" id="customCursor"></div>
  <div class="custom-cursor-dot" id="customCursorDot"></div>

  <div class="card-wrapper" id="cardWrapper">
    <div class="card" id="card">
      <div class="badge">
        <span class="pulse-dot"></span>
        <span>[ 7-day verified access ]</span>
      </div>

      <h1 class="glitch-title">LICENSE GRANTED</h1>
      <p class="subtitle">Linkvertise verification successful // Single-use token</p>

      <div class="key-box-3d" id="keyBox" onclick="copyRedeem(event)">
        <div class="laser-beam"></div>
        <div class="key-tag">Authorization License Key</div>
        <div class="key-value" id="keyValue">${key}</div>
      </div>

      <div class="cmd-box">
        <span class="cmd-prefix">Discord Command</span>
        <span id="cmdText">${redeemCommand}</span>
      </div>

      <button class="btn-redeem" id="copyBtn" onclick="copyRedeem(event)">
        <span id="btnLabel">Copy Redeem Command</span>
      </button>

      <p class="footer-note">Paste in the bot channel to activate instant Luau deobfuscator access.</p>
    </div>
  </div>

  <script>
    const wrapper = document.getElementById('cardWrapper');
    const orb1 = document.getElementById('orb1');
    const orb2 = document.getElementById('orb2');
    const cursor = document.getElementById('customCursor');
    const cursorDot = document.getElementById('customCursorDot');

    // High precision mouse tracking for 3D card tilt & dual orb lighting
    document.addEventListener('mousemove', (e) => {
      const { clientX: x, clientY: y } = e;
      const { innerWidth: w, innerHeight: h } = window;

      // Update custom cursor
      cursor.style.left = x + 'px';
      cursor.style.top = y + 'px';
      cursorDot.style.left = x + 'px';
      cursorDot.style.top = y + 'px';

      // 3D Parallax Tilt
      const normX = (x - w / 2) / (w / 2);
      const normY = (y - h / 2) / (h / 2);
      wrapper.style.transform = 'rotateY(' + (normX * 18) + 'deg) rotateX(' + (-normY * 18) + 'deg)';

      // Multi-layer dynamic lighting
      orb1.style.transform = 'translate(' + (x - 275) + 'px, ' + (y - 275) + 'px)';
      orb2.style.transform = 'translate(' + (w - x - 225) + 'px, ' + (h - y - 225) + 'px)';
    });

    document.addEventListener('mouseleave', () => {
      wrapper.style.transform = 'rotateY(0deg) rotateX(0deg)';
      cursor.style.opacity = '0';
      cursorDot.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
      cursor.style.opacity = '1';
      cursorDot.style.opacity = '1';
    });

    // Expand cursor over interactive elements
    document.querySelectorAll('button, .key-box-3d, .cmd-box').forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.style.width = '55px';
        cursor.style.height = '55px';
        cursor.style.borderColor = '#00f2fe';
        cursor.style.boxShadow = '0 0 20px #00f2fe';
      });
      el.addEventListener('mouseleave', () => {
        cursor.style.width = '32px';
        cursor.style.height = '32px';
        cursor.style.borderColor = '#ff2a7a';
        cursor.style.boxShadow = '0 0 15px rgba(224, 17, 95, 0.65)';
      });
    });

    // MATRIX DIGITAL RAIN IN BACKGROUND
    const mCanvas = document.getElementById('matrix-canvas');
    const mCtx = mCanvas.getContext('2d');
    function resizeMatrix() {
      mCanvas.width = window.innerWidth;
      mCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeMatrix);
    resizeMatrix();

    const chars = '0123456789ABCDEFMOMMYDEOBΨλπΣΩ';
    const fontSize = 14;
    const columns = Math.floor(mCanvas.width / fontSize);
    const drops = Array(columns).fill(1);

    function drawMatrix() {
      mCtx.fillStyle = 'rgba(4, 4, 7, 0.08)';
      mCtx.fillRect(0, 0, mCanvas.width, mCanvas.height);
      mCtx.fillStyle = '#e0115f';
      mCtx.font = fontSize + 'px monospace';

      for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        mCtx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > mCanvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }
    setInterval(drawMatrix, 35);

    // FLOATING CONNECTED CONSTELLATION PARTICLES
    const pCanvas = document.getElementById('particles-canvas');
    const pCtx = pCanvas.getContext('2d');
    function resizeParticles() {
      pCanvas.width = window.innerWidth;
      pCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeParticles);
    resizeParticles();

    const particleList = [];
    for (let i = 0; i < 50; i++) {
      particleList.push({
        x: Math.random() * pCanvas.width,
        y: Math.random() * pCanvas.height,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        radius: Math.random() * 2 + 1
      });
    }

    function renderParticles() {
      pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
      
      // Connect nearby particles with luminous threads
      for (let i = 0; i < particleList.length; i++) {
        for (let j = i + 1; j < particleList.length; j++) {
          const dx = particleList[i].x - particleList[j].x;
          const dy = particleList[i].y - particleList[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            pCtx.beginPath();
            pCtx.strokeStyle = 'rgba(224, 17, 95, ' + (0.35 * (1 - dist / 110)) + ')';
            pCtx.lineWidth = 0.8;
            pCtx.moveTo(particleList[i].x, particleList[i].y);
            pCtx.lineTo(particleList[j].x, particleList[j].y);
            pCtx.stroke();
          }
        }
      }

      // Draw particle points
      for (let p of particleList) {
        pCtx.beginPath();
        pCtx.fillStyle = '#ff2a7a';
        pCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        pCtx.fill();

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = pCanvas.width;
        if (p.x > pCanvas.width) p.x = 0;
        if (p.y < 0) p.y = pCanvas.height;
        if (p.y > pCanvas.height) p.y = 0;
      }
      requestAnimationFrame(renderParticles);
    }
    renderParticles();

    // CONFETTI AND SPARKS BURST
    const cCanvas = document.getElementById('confetti-canvas');
    const cCtx = cCanvas.getContext('2d');
    function resizeConfetti() {
      cCanvas.width = window.innerWidth;
      cCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeConfetti);
    resizeConfetti();

    let sparks = [];
    function explodeSparks(originX, originY) {
      const colors = ['#e0115f', '#ff2a7a', '#00f2fe', '#ffffff', '#ffd700'];
      for (let i = 0; i < 90; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 18 + 4;
        sparks.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 5 + 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          decay: Math.random() * 0.02 + 0.015,
          gravity: 0.3
        });
      }
    }

    function renderSparks() {
      cCtx.clearRect(0, 0, cCanvas.width, cCanvas.height);
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        cCtx.globalAlpha = s.alpha;
        cCtx.fillStyle = s.color;
        cCtx.fillRect(s.x, s.y, s.size, s.size);

        s.x += s.vx;
        s.y += s.vy;
        s.vy += s.gravity;
        s.alpha -= s.decay;

        if (s.alpha <= 0) sparks.splice(i, 1);
      }
      requestAnimationFrame(renderSparks);
    }
    renderSparks();

    // Button ripple + copy handler
    function copyRedeem(e) {
      const text = ${JSON.stringify(redeemCommand)};
      const btn = document.getElementById('copyBtn');

      // Create button ripple
      if (e) {
        const rect = btn.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        ripple.style.left = (e.clientX - rect.left) + 'px';
        ripple.style.top = (e.clientY - rect.top) + 'px';
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      }

      navigator.clipboard.writeText(text).then(() => {
        const label = document.getElementById('btnLabel');
        label.innerText = 'COPIED TO CLIPBOARD!';
        explodeSparks(window.innerWidth / 2, window.innerHeight / 2);

        // Screen flash effect
        document.body.style.filter = 'brightness(1.25)';
        setTimeout(() => { document.body.style.filter = 'none'; }, 150);

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
