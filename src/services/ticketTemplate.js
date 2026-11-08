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
  <title>MOMMYDEOB // QUANTUM VIP ACCESS PASS</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700;800&family=JetBrains+Mono:wght@400;600;800&family=Orbitron:wght@700;900&display=swap" rel="stylesheet">
  <style>
    ${ticketStyles}
  </style>
</head>
<body>
  <!-- Fullscreen Canvas VFX Layers -->
  <canvas id="warp-canvas"></canvas>
  <div class="cyber-grid-floor"></div>
  <div class="cyber-grid-ceiling"></div>

  <!-- Giant 3D Holographic Gyroscope Orbital Rings -->
  <div class="hologram-rings">
    <div class="gyro-ring"></div>
    <div class="gyro-ring"></div>
    <div class="gyro-ring"></div>
  </div>

  <!-- Ambient Dynamic Colored Lighting Orbs -->
  <div class="ambient-orb" id="orb1"></div>
  <div class="ambient-orb" id="orb2"></div>
  <div class="ambient-orb" id="orb3"></div>

  <!-- Scanlines + Vignette -->
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
    <div class="radar-ring" style="width: 30px; height: 30px;"></div>
    <div class="radar-ring" style="width: 60px; height: 60px;"></div>
    <div class="radar-blip"></div>
  </div>

  <!-- Cyber HUD Telemetry Bar -->
  <div class="cyber-hud-top">
    <div class="hud-left">
      <div class="hud-chip">
        <div class="hud-dot"></div>
        <span>SECURITY: ANTI-BYPASS VERIFIED</span>
      </div>
      <div class="hud-chip">
        <span id="liveClock">TIME: --:--:-- UTC</span>
      </div>
      <div class="hud-chip">
        <div class="audio-eq">
          <div class="eq-bar"></div>
          <div class="eq-bar"></div>
          <div class="eq-bar"></div>
          <div class="eq-bar"></div>
        </div>
      </div>
    </div>
    <div class="hud-right">
      <button class="hud-action-btn" id="hyperToggle">WARP: NORMAL</button>
      <button class="hud-action-btn" id="bgmToggle">BGM: OFF</button>
      <button class="hud-action-btn" id="audioToggle">SFX: ON</button>
      <div class="hud-chip">
        <span>FPS: <span id="fpsCounter" style="color:#00f2fe">60</span></span>
      </div>
    </div>
  </div>

  <!-- 3D Scene Wrapper -->
  <div class="scene-wrapper" id="sceneWrapper">
    <!-- THE FUTURISTIC TICKET PASS -->
    <div class="ticket-container" id="ticketCard">
      <div class="guilloche-bg"></div>
      <div class="holo-foil-overlay" id="holoFoil"></div>
      <div class="laser-scanner"></div>
      <div class="notch-top"></div>
      <div class="notch-bottom"></div>
      <div class="perforation-divider"></div>

      <!-- Main Ticket Body -->
      <div class="ticket-main">
        <div class="ticket-header">
          <div class="ticket-brand">
            <div class="brand-title">MOMMYDEOB</div>
            <div class="brand-sub">QUANTUM SECURITY // ACCESS PROTOCOL</div>
          </div>
          <div class="badge-wrap">
            <div class="vip-badge">VIP PASS #7D</div>
          </div>
        </div>

        <!-- 3D Key Presentation Box with Scramble Animation -->
        <div class="key-box-3d">
          <div class="key-label-row">
            <span>ONE-TIME QUANTUM ACCESS KEY</span>
            <span style="color:#00f2fe;">ACTIVE // 168 HOURS</span>
          </div>
          <div class="key-value" id="keyDisplay">${key}</div>
        </div>

        <!-- Copy Command Box -->
        <div class="cmd-box">
          <span class="cmd-prefix">DISCORD REDEEM:</span>
          <span>${redeemCommand}</span>
        </div>

        <!-- Cyber Redeem Button -->
        <button class="btn-redeem" id="copyBtn" onclick="copyRedeem(event)">
          <span id="btnLabel">Copy Redeem Command</span>
        </button>

        <!-- Security Microprint Thread -->
        <div class="micro-security">
          <span>SERIAL: SEC-MMY-${shortSerial}</span>
          <span>GATE: ANTI-BYPASS VERIFIED</span>
          <span>EXPIRY: 7 DAYS</span>
        </div>
      </div>

      <!-- Perforated Tear-off Stub with Interactive Detach Physics -->
      <div class="ticket-stub" id="ticketStub" title="Click to tear or re-attach stub!">
        <div class="stub-tag">VIP STUB</div>

        <!-- Holographic Seal -->
        <div class="holo-seal">
          <div class="seal-inner">GENUINE<br>VIP PASS</div>
        </div>

        <!-- Cyber Barcode -->
        <div class="barcode-wrap">
          <div class="cyber-barcode"></div>
          <div class="barcode-serial">MMY-${shortSerial}-7D-VIP</div>
        </div>

        <!-- Stub Telemetry & Interactive Tear Prompt -->
        <div class="stub-meta">
          <div>NODE: CLOUD-MAIN</div>
          <div>GATE: DISCORD-BOT</div>
          <div>SEAT: 001-ALPHA</div>
          <div class="stub-tear-hint">[ CLICK TO TEAR STUB ]</div>
        </div>
      </div>
    </div>

    <!-- FLOATING HOLOGRAPHIC COMPANION POD (GIF INTEGRATION) -->
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
