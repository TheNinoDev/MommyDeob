const http = require('http');
const { keyManager } = require('./keyManager');
const { verifyLinkvertiseHash, getSession, saveSessions } = require('./linkvertise');

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
      --accent-glow: rgba(224, 17, 95, 0.7);
      --accent-bright: #ff2a7a;
      --accent-cyan: #00f2fe;
      --accent-purple: #9d4edd;
      --bg: #030306;
      --card-bg: rgba(10, 11, 20, 0.65);
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
    #matrix-canvas, #particles-canvas, #warp-canvas, #cursor-trail-canvas, #confetti-canvas {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
    }
    #warp-canvas { z-index: 0; opacity: 0.6; }
    #matrix-canvas { z-index: 1; opacity: 0.22; }
    #particles-canvas { z-index: 2; }
    #cursor-trail-canvas { z-index: 998; }
    #confetti-canvas { z-index: 1000; }

    /* 3D Infinity Cyber Grids - Floor and Ceiling with speed boost */
    .cyber-grid-floor {
      position: fixed;
      inset: -50%;
      background-size: 60px 60px;
      background-image: 
        linear-gradient(to right, rgba(224, 17, 95, 0.15) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(224, 17, 95, 0.15) 1px, transparent 1px);
      transform: perspective(500px) rotateX(75deg) translateZ(-60px);
      pointer-events: none;
      z-index: 1;
      animation: gridFloorScroll 8s linear infinite;
    }
    @keyframes gridFloorScroll {
      0% { transform: perspective(500px) rotateX(75deg) translateY(0); }
      100% { transform: perspective(500px) rotateX(75deg) translateY(60px); }
    }

    .cyber-grid-ceiling {
      position: fixed;
      inset: -50%;
      background-size: 60px 60px;
      background-image: 
        linear-gradient(to right, rgba(0, 242, 254, 0.08) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(0, 242, 254, 0.08) 1px, transparent 1px);
      transform: perspective(500px) rotateX(-75deg) translateZ(-60px);
      pointer-events: none;
      z-index: 1;
      animation: gridCeilScroll 8s linear infinite;
    }
    @keyframes gridCeilScroll {
      0% { transform: perspective(500px) rotateX(-75deg) translateY(0); }
      100% { transform: perspective(500px) rotateX(-75deg) translateY(60px); }
    }

    /* Giant 3D Holographic Gyro Rings Behind Card */
    .hologram-rings {
      position: fixed;
      width: 700px;
      height: 700px;
      pointer-events: none;
      z-index: 3;
      transform-style: preserve-3d;
      animation: gyroRotate 24s linear infinite;
    }
    .ring {
      position: absolute;
      inset: 0;
      border: 1px dashed rgba(224, 17, 95, 0.25);
      border-radius: 50%;
      box-shadow: 0 0 30px rgba(224, 17, 95, 0.1);
    }
    .ring:nth-child(1) { transform: rotateX(60deg) rotateY(20deg); border-color: rgba(224, 17, 95, 0.35); }
    .ring:nth-child(2) { transform: rotateX(-45deg) rotateY(45deg); border-color: rgba(0, 242, 254, 0.25); }
    .ring:nth-child(3) { transform: rotateX(80deg) rotateY(-30deg); border-color: rgba(157, 78, 221, 0.3); border-style: dotted; }

    @keyframes gyroRotate {
      0% { transform: rotateZ(0deg) rotateY(0deg); }
      100% { transform: rotateZ(360deg) rotateY(360deg); }
    }

    /* Retro CRT scanlines and vignette */
    .scanlines {
      position: fixed;
      inset: 0;
      background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.3) 50%);
      background-size: 100% 4px;
      z-index: 90;
      pointer-events: none;
      opacity: 0.7;
    }

    .vignette {
      position: fixed;
      inset: 0;
      background: radial-gradient(circle at center, transparent 35%, #000000 100%);
      pointer-events: none;
      z-index: 89;
    }

    /* Custom Custom Neon Follower */
    .custom-cursor {
      position: fixed;
      width: 34px;
      height: 34px;
      border: 2px solid var(--accent-bright);
      border-radius: 50%;
      pointer-events: none;
      z-index: 999;
      transform: translate(-50%, -50%);
      transition: width 0.15s, height 0.15s, border-color 0.15s, transform 0.05s ease-out;
      box-shadow: 0 0 20px var(--accent-glow);
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

    /* Multi-Orb Lighting with mouse tracking */
    .ambient-orb-1 {
      position: fixed;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%);
      filter: blur(95px);
      border-radius: 50%;
      pointer-events: none;
      z-index: 1;
      opacity: 0.6;
      transition: transform 0.12s ease-out;
    }
    .ambient-orb-2 {
      position: fixed;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(0, 242, 254, 0.35) 0%, transparent 70%);
      filter: blur(110px);
      border-radius: 50%;
      pointer-events: none;
      z-index: 1;
      opacity: 0.45;
      transition: transform 0.25s ease-out;
    }
    .ambient-orb-3 {
      position: fixed;
      width: 450px;
      height: 450px;
      background: radial-gradient(circle, rgba(157, 78, 221, 0.3) 0%, transparent 70%);
      filter: blur(120px);
      border-radius: 50%;
      pointer-events: none;
      z-index: 1;
      opacity: 0.35;
      transition: transform 0.4s ease-out;
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
      backdrop-filter: blur(40px) saturate(220%);
      -webkit-backdrop-filter: blur(40px) saturate(220%);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 32px;
      padding: 52px 44px;
      max-width: 560px;
      width: 100%;
      text-align: center;
      box-shadow: 
        0 45px 120px rgba(0, 0, 0, 0.95),
        0 0 80px rgba(224, 17, 95, 0.3),
        inset 0 1px 3px rgba(255, 255, 255, 0.4);
      transform-style: preserve-3d;
      overflow: hidden;
    }

    /* RGB Hologram Edge Border */
    .card::before {
      content: '';
      position: absolute;
      inset: -3px;
      border-radius: 35px;
      padding: 3px;
      background: linear-gradient(135deg, 
        #e0115f 0%, 
        #00f2fe 25%, 
        #ff2a7a 50%, 
        #9d4edd 75%,
        #e0115f 100%
      );
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
      animation: borderRGB 6s linear infinite;
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
      background: rgba(224, 17, 95, 0.18);
      padding: 9px 24px;
      border-radius: 100px;
      border: 1px solid rgba(224, 17, 95, 0.55);
      margin-bottom: 24px;
      box-shadow: 0 0 30px rgba(224, 17, 95, 0.4);
      transform: translateZ(50px);
    }

    .pulse-dot {
      width: 9px;
      height: 9px;
      background: var(--accent-bright);
      border-radius: 50%;
      box-shadow: 0 0 14px var(--accent-bright);
      animation: pulse 1.2s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.8); opacity: 0.6; }
      50% { transform: scale(1.6); opacity: 1; }
      100% { transform: scale(0.8); opacity: 0.6; }
    }

    /* Glitch Typography */
    .glitch-title {
      font-size: 34px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
      color: #fff;
      position: relative;
      text-shadow: 0 0 25px rgba(224, 17, 95, 0.7);
      transform: translateZ(60px);
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
      margin-bottom: 30px;
      transform: translateZ(45px);
    }

    /* 3D Floating Interactive Hologram Key Box */
    .key-box-3d {
      position: relative;
      background: rgba(5, 6, 12, 0.9);
      border: 1px solid rgba(224, 17, 95, 0.45);
      border-radius: 18px;
      padding: 26px 22px;
      margin-bottom: 26px;
      box-shadow: 
        0 20px 45px rgba(0, 0, 0, 0.75),
        inset 0 0 35px rgba(224, 17, 95, 0.25);
      transform: translateZ(75px);
      cursor: pointer;
      overflow: hidden;
      transition: all 0.25s ease;
    }
    .key-box-3d:hover {
      border-color: var(--accent-bright);
      box-shadow: 
        0 25px 60px rgba(224, 17, 95, 0.55),
        inset 0 0 50px rgba(224, 17, 95, 0.45);
      transform: translateZ(95px) scale(1.025);
    }

    /* Glowing laser line passing through key */
    .laser-beam {
      position: absolute;
      top: 0;
      left: -100%;
      width: 50%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 42, 122, 0.6), transparent);
      transform: skewX(-25deg);
      animation: laserSweep 3s infinite;
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
      font-size: 26px;
      font-weight: 800;
      color: #fff;
      letter-spacing: 3.5px;
      text-shadow: 
        0 0 12px var(--accent-bright),
        0 0 35px var(--accent-glow),
        0 0 60px var(--accent);
      user-select: all;
    }

    /* Command snippet */
    .cmd-box {
      background: rgba(8, 9, 16, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 14px;
      padding: 16px 20px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13.5px;
      color: #ff70a0;
      margin-bottom: 28px;
      transform: translateZ(55px);
      user-select: all;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.55);
    }
    .cmd-prefix {
      color: #64748b;
      font-size: 11px;
      letter-spacing: 1.5px;
    }

    /* Ultra 3D Cyber Button with animated border glow */
    .btn-redeem {
      position: relative;
      width: 100%;
      background: linear-gradient(135deg, var(--accent) 0%, #990a3e 100%);
      color: #fff;
      border: none;
      border-radius: 16px;
      padding: 22px 34px;
      font-size: 17px;
      font-weight: 800;
      letter-spacing: 1px;
      cursor: pointer;
      overflow: hidden;
      transform: translateZ(90px);
      box-shadow: 0 15px 40px rgba(224, 17, 95, 0.55);
      transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .btn-redeem:hover {
      background: linear-gradient(135deg, var(--accent-bright) 0%, var(--accent) 100%);
      transform: translateZ(115px) scale(1.035);
      box-shadow: 0 25px 65px rgba(224, 17, 95, 0.85);
    }
    .btn-redeem:active {
      transform: translateZ(65px) scale(0.97);
    }
    .btn-redeem::after {
      content: '';
      position: absolute;
      top: -50%;
      left: -60%;
      width: 50%;
      height: 200%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
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
      background-color: rgba(255, 255, 255, 0.5);
      pointer-events: none;
    }
    @keyframes rippleEffect {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }

    .footer-note {
      margin-top: 28px;
      font-size: 12px;
      color: #64748b;
      transform: translateZ(40px);
    }
  </style>
</head>
<body>
  <!-- Warp Starfield Background -->
  <canvas id="warp-canvas"></canvas>

  <!-- 3D Grids -->
  <div class="cyber-grid-floor"></div>
  <div class="cyber-grid-ceiling"></div>

  <!-- Holographic Gyro Rings -->
  <div class="hologram-rings">
    <div class="ring"></div>
    <div class="ring"></div>
    <div class="ring"></div>
  </div>

  <div class="scanlines"></div>
  <div class="vignette"></div>

  <!-- 3 Dynamic Interactive Orb Lights -->
  <div class="ambient-orb-1" id="orb1"></div>
  <div class="ambient-orb-2" id="orb2"></div>
  <div class="ambient-orb-3" id="orb3"></div>

  <!-- Canvas layers: matrix rain, cyber constellation, trail, confetti -->
  <canvas id="matrix-canvas"></canvas>
  <canvas id="particles-canvas"></canvas>
  <canvas id="cursor-trail-canvas"></canvas>
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
    const orb3 = document.getElementById('orb3');
    const cursor = document.getElementById('customCursor');
    const cursorDot = document.getElementById('customCursorDot');

    // WARP STARFIELD SPEED EFFECT
    const wCanvas = document.getElementById('warp-canvas');
    const wCtx = wCanvas.getContext('2d');
    function resizeWarp() {
      wCanvas.width = window.innerWidth;
      wCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeWarp);
    resizeWarp();

    const numStars = 180;
    const stars = [];
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: (Math.random() - 0.5) * wCanvas.width * 2,
        y: (Math.random() - 0.5) * wCanvas.height * 2,
        z: Math.random() * wCanvas.width
      });
    }

    function renderWarp() {
      wCtx.fillStyle = 'rgba(3, 3, 6, 0.25)';
      wCtx.fillRect(0, 0, wCanvas.width, wCanvas.height);
      const cx = wCanvas.width / 2;
      const cy = wCanvas.height / 2;

      for (let s of stars) {
        s.z -= 4;
        if (s.z <= 0) {
          s.z = wCanvas.width;
          s.x = (Math.random() - 0.5) * wCanvas.width * 2;
          s.y = (Math.random() - 0.5) * wCanvas.height * 2;
        }

        const k = 250 / s.z;
        const px = s.x * k + cx;
        const py = s.y * k + cy;

        if (px >= 0 && px < wCanvas.width && py >= 0 && py < wCanvas.height) {
          const size = (1 - s.z / wCanvas.width) * 3;
          wCtx.beginPath();
          wCtx.fillStyle = '#ff2a7a';
          wCtx.arc(px, py, size, 0, Math.PI * 2);
          wCtx.fill();
        }
      }
      requestAnimationFrame(renderWarp);
    }
    renderWarp();

    // DYNAMIC NEON MOUSE TRAIL EFFECT
    const tCanvas = document.getElementById('cursor-trail-canvas');
    const tCtx = tCanvas.getContext('2d');
    function resizeTrail() {
      tCanvas.width = window.innerWidth;
      tCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeTrail);
    resizeTrail();

    let mouseTrail = [];
    document.addEventListener('mousemove', (e) => {
      const { clientX: x, clientY: y } = e;
      const { innerWidth: w, innerHeight: h } = window;

      mouseTrail.push({ x, y, alpha: 1, radius: 8 });

      // Custom Cursor
      cursor.style.left = x + 'px';
      cursor.style.top = y + 'px';
      cursorDot.style.left = x + 'px';
      cursorDot.style.top = y + 'px';

      // 3D Parallax Tilt
      const normX = (x - w / 2) / (w / 2);
      const normY = (y - h / 2) / (h / 2);
      wrapper.style.transform = 'rotateY(' + (normX * 22) + 'deg) rotateX(' + (-normY * 22) + 'deg)';

      // 3 Orb Lighting
      orb1.style.transform = 'translate(' + (x - 300) + 'px, ' + (y - 300) + 'px)';
      orb2.style.transform = 'translate(' + (w - x - 250) + 'px, ' + (h - y - 250) + 'px)';
      orb3.style.transform = 'translate(' + (x / 2 - 225) + 'px, ' + (y / 2 - 225) + 'px)';
    });

    function renderMouseTrail() {
      tCtx.clearRect(0, 0, tCanvas.width, tCanvas.height);
      for (let i = mouseTrail.length - 1; i >= 0; i--) {
        const pt = mouseTrail[i];
        tCtx.beginPath();
        tCtx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        tCtx.fillStyle = 'rgba(255, 42, 122, ' + pt.alpha + ')';
        tCtx.shadowColor = '#00f2fe';
        tCtx.shadowBlur = 10;
        tCtx.fill();

        pt.alpha -= 0.04;
        pt.radius = Math.max(0, pt.radius - 0.25);
        if (pt.alpha <= 0) mouseTrail.splice(i, 1);
      }
      requestAnimationFrame(renderMouseTrail);
    }
    renderMouseTrail();

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
        cursor.style.width = '60px';
        cursor.style.height = '60px';
        cursor.style.borderColor = '#00f2fe';
        cursor.style.boxShadow = '0 0 25px #00f2fe';
      });
      el.addEventListener('mouseleave', () => {
        cursor.style.width = '34px';
        cursor.style.height = '34px';
        cursor.style.borderColor = '#ff2a7a';
        cursor.style.boxShadow = '0 0 20px rgba(224, 17, 95, 0.7)';
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

    const chars = '0123456789ABCDEFMOMMYDEOBΨλπΣΩ01';
    const fontSize = 15;
    const columns = Math.floor(mCanvas.width / fontSize);
    const drops = Array(columns).fill(1);

    function drawMatrix() {
      mCtx.fillStyle = 'rgba(3, 3, 6, 0.08)';
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
    setInterval(drawMatrix, 32);

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
    for (let i = 0; i < 55; i++) {
      particleList.push({
        x: Math.random() * pCanvas.width,
        y: Math.random() * pCanvas.height,
        vx: (Math.random() - 0.5) * 1.4,
        vy: (Math.random() - 0.5) * 1.4,
        radius: Math.random() * 2.2 + 1
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
          if (dist < 120) {
            pCtx.beginPath();
            pCtx.strokeStyle = 'rgba(224, 17, 95, ' + (0.4 * (1 - dist / 120)) + ')';
            pCtx.lineWidth = 0.9;
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
      const colors = ['#e0115f', '#ff2a7a', '#00f2fe', '#ffffff', '#ffd700', '#9d4edd'];
      for (let i = 0; i < 110; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 22 + 5;
        sparks.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 6 + 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          decay: Math.random() * 0.02 + 0.012,
          gravity: 0.35
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
        document.body.style.filter = 'brightness(1.35)';
        setTimeout(() => { document.body.style.filter = 'none'; }, 180);

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
