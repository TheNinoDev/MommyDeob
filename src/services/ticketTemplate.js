const { ticketStyles } = require('./ticketStyles');
const { getTicketScripts } = require('./ticketScripts');

function renderCrazyKeyPage(key) {
  const redeemCommand = `.redeem ${key}`;
  const shortSerial = (key && key.length >= 4) ? key.slice(-4) : '0001';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MOMMYDEOB // VIP ACCESS PASS</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&family=Space+Grotesk:wght@500;700;800&family=Syne:wght@700;800&display=swap" rel="stylesheet">
  <style>
    ${ticketStyles}
  </style>
</head>
<body>
  <!-- Background Music Audio Element (song.mp3) -->
  <audio id="bgmAudio" loop preload="auto" src="/song.mp3"></audio>

  <!-- Fullscreen Background Canvas VFX Layers -->
  <canvas id="warp-canvas"></canvas>
  <div class="cyber-grid-floor"></div>
  <div class="cyber-grid-ceiling"></div>

  <!-- 3D Holographic Gyroscope Orbital Rings -->
  <div class="hologram-rings">
    <div class="gyro-ring"></div>
    <div class="gyro-ring"></div>
    <div class="gyro-ring"></div>
  </div>

  <!-- Ambient Dynamic Colored Lighting Orbs -->
  <div class="ambient-orb" id="orb1"></div>
  <div class="ambient-orb" id="orb2"></div>
  <div class="ambient-orb" id="orb3"></div>

  <!-- Scanlines + CRT Vignette -->
  <div class="scanlines"></div>
  <div class="vignette"></div>

  <!-- Top-Level Canvases -->
  <canvas id="matrix-canvas"></canvas>
  <canvas id="particles-canvas"></canvas>
  <canvas id="shockwave-canvas"></canvas>
  <canvas id="cursor-trail-canvas"></canvas>
  <canvas id="confetti-canvas"></canvas>

  <!-- Custom Crosshair Cursor -->
  <div class="custom-cursor" id="customCursor"></div>
  <div class="custom-cursor-dot" id="customCursorDot"></div>

  <!-- Cyber Radar Widget (Bottom Left) -->
  <div class="cyber-radar">
    <div class="radar-sweep"></div>
    <div class="radar-ring" style="width: 28px; height: 28px;"></div>
    <div class="radar-ring" style="width: 56px; height: 56px;"></div>
    <div class="radar-blip"></div>
  </div>

  <!-- Top Cyber HUD Telemetry & song.mp3 Music Player Bar -->
  <div class="cyber-hud-top">
    <div class="hud-left">
      <div class="hud-chip">
        <div class="hud-dot"></div>
        <span>SECURITY: ANTI-BYPASS ENFORCED</span>
      </div>
      <div class="hud-chip">
        <span id="liveClock">TIME: --:--:-- UTC</span>
      </div>

      <!-- Cyber Music Player Widget -->
      <div class="hud-chip music-player-deck">
        <button class="music-ctrl-btn" id="musicPlayBtn" title="Play / Pause song.mp3">▶ PLAY</button>
        <button class="music-ctrl-btn" id="musicStopBtn" title="Stop song.mp3">⏹</button>
        <div class="music-track-info">
          <span class="music-track-name">song.mp3</span>
          <div class="audio-eq" id="musicEq">
            <div class="eq-bar"></div>
            <div class="eq-bar"></div>
            <div class="eq-bar"></div>
            <div class="eq-bar"></div>
          </div>
        </div>
        <div class="music-vol-wrap">
          <span class="vol-icon">VOL</span>
          <input type="range" id="musicVolumeSlider" min="0" max="100" value="70" class="cyber-vol-slider" title="Change loudness">
          <span id="volPercent" class="vol-num">70%</span>
        </div>
      </div>
    </div>
    <div class="hud-right">
      <button class="hud-action-btn" id="hyperToggle">WARP: NORMAL</button>
      <button class="hud-action-btn" id="audioToggle">SFX: ON</button>
      <div class="hud-chip">
        <span>FPS: <span id="fpsCounter" style="color:#00f0ff">60</span></span>
      </div>
    </div>
  </div>

  <!-- 3D Scene Wrapper -->
  <div class="scene-wrapper" id="sceneWrapper">
    <!-- THE ARCHITECTURAL VIP ACCESS TICKET -->
    <div class="ticket-container" id="ticketCard">
      <div class="guilloche-bg"></div>
      <div class="holo-foil-overlay" id="holoFoil"></div>
      <div class="laser-scanner"></div>

      <!-- Aqua Cutout Notches & Divider Dots (Top and Bottom) -->
      <div class="notch-top" title="Aqua Notch Top"></div>
      <div class="notch-bottom" title="Aqua Notch Bottom"></div>
      <div class="perforation-divider"></div>

      <!-- Main Ticket Body -->
      <div class="ticket-main">
        <!-- Technical Upper Deck -->
        <div class="ticket-top-deck">
          <div class="deck-item">
            <span>PASS:</span>
            <span class="deck-val">MMY-${shortSerial}-7D</span>
          </div>
          <div class="deck-item">
            <span>GATE:</span>
            <span class="deck-val">DISCORD-PRIMARY</span>
          </div>
          <div class="deck-item">
            <span>TIER:</span>
            <span class="deck-val" style="color:#00f0ff;">LEVEL-5</span>
          </div>
        </div>

        <!-- Editorial Masthead -->
        <div class="ticket-header">
          <div class="ticket-brand">
            <h1 class="brand-title">MOMMYDEOB</h1>
            <div class="brand-sub">// QUANTUM VIP ACCESS PROTOCOL</div>
          </div>
          <div class="badge-wrap">
            <div class="vip-badge">VIP PASS #7D</div>
            <div class="pass-type-tag">TIME-LOCKED // 168H</div>
          </div>
        </div>

        <!-- The Recessed Key Vault -->
        <div class="key-box-3d">
          <div class="key-label-row">
            <span>ONE-TIME QUANTUM ACCESS KEY</span>
            <span style="color:#00f0ff;">CRYPTOGRAPHICALLY VERIFIED</span>
          </div>
          <div class="key-value" id="keyDisplay">${key}</div>
        </div>

        <!-- Command Console Box -->
        <div class="cmd-box">
          <span class="cmd-prefix">DISCORD REDEEM:</span>
          <span>${redeemCommand}</span>
        </div>

        <!-- Industrial Trigger Release Button with Tactile Animation -->
        <button class="btn-redeem" id="copyBtn" onclick="copyRedeem(event)">
          <span id="btnLabel">EXECUTE REDEEM SYNC</span>
        </button>

        <!-- Technical Specification Micro-Grid -->
        <div class="tech-meta-grid">
          <div class="meta-col">
            <span class="meta-label">CLEARANCE</span>
            <span class="meta-value">UNRESTRICTED</span>
          </div>
          <div class="meta-col">
            <span class="meta-label">VALIDITY</span>
            <span class="meta-value">168 HOURS (7D)</span>
          </div>
          <div class="meta-col">
            <span class="meta-label">ANTI-BYPASS</span>
            <span class="meta-value" style="color:#00f0ff;">LINKVERTISE VALID</span>
          </div>
        </div>
      </div>

      <!-- Seamless Attached VIP Stub (No Breakout on Click) -->
      <div class="ticket-stub" id="ticketStub">
        <div class="stub-tag">VIP STUB</div>

        <!-- Holographic VIP Seal -->
        <div class="holo-seal">
          <div class="seal-inner">AUTHENTIC<br>VIP PASS</div>
        </div>

        <!-- Precision Barcode -->
        <div class="barcode-wrap">
          <div class="cyber-barcode"></div>
          <div class="barcode-serial">MMY-${shortSerial}-7D-VIP</div>
        </div>

        <!-- Stub Telemetry -->
        <div class="stub-meta">
          <div>NODE: CLOUD-MAIN</div>
          <div>GATE: DISCORD-BOT</div>
          <div>SEAT: 001-ALPHA</div>
          <div style="color:var(--cyan); font-size:8px; margin-top:4px;">[ AUTH SECURED ]</div>
        </div>
      </div>
    </div>

    <!-- HOLOGRAPHIC COMPANION CONSOLE (Tactical Cyberpod) -->
    <div class="holo-companion-card" id="holoCompanion">
      <div class="companion-dialogue" id="companionDialogue">Here's your VIP key, baka!</div>
      <div class="companion-hud-header">
        <span>● LIVE HOLO-LINK</span>
        <span>120 FPS</span>
      </div>
      <div class="companion-img-frame">
        <img src="/assets/t3tge8oizwo51.gif" onerror="this.src='assets/t3tge8oizwo51.gif'" alt="Mommy AI Companion">
      </div>
      <div class="companion-caption">
        MOMMY COMPANION <span>ONLINE</span>
      </div>
    </div>
  </div>

  <script>
    ${getTicketScripts(key, redeemCommand)}
  </script>
</body>
</html>`;
}

module.exports = { renderCrazyKeyPage };
