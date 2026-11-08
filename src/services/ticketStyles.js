const ticketStyles = `
  :root {
    --accent: #e0115f;
    --accent-bright: #ff2a7a;
    --accent-glow: rgba(224, 17, 95, 0.75);
    --cyan: #00f2fe;
    --cyan-glow: rgba(0, 242, 254, 0.6);
    --purple: #9d4edd;
    --gold: #ffd700;
    --gold-glow: rgba(255, 215, 0, 0.65);
    --bg: #020205;
    --ticket-bg: rgba(10, 11, 22, 0.94);
    --holo-angle: 135deg;
    --warp-speed: 7;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }

  body {
    background: var(--bg);
    color: #f1f5f9;
    font-family: 'Space Grotesk', -apple-system, sans-serif;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 30px 20px;
    overflow-x: hidden;
    perspective: 1600px;
    cursor: crosshair;
    transition: filter 0.15s ease;
  }

  body.hyperdrive {
    --warp-speed: 28;
    filter: saturate(1.4) contrast(1.15);
  }

  /* Fullscreen background canvases */
  #matrix-canvas, #particles-canvas, #warp-canvas, #cursor-trail-canvas, #shockwave-canvas, #confetti-canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
  }
  #warp-canvas { z-index: 0; opacity: 0.65; }
  #matrix-canvas { z-index: 1; opacity: 0.22; }
  #particles-canvas { z-index: 2; }
  #shockwave-canvas { z-index: 997; }
  #cursor-trail-canvas { z-index: 998; }
  #confetti-canvas { z-index: 1000; }

  /* 3D Infinity Cyber Grids */
  .cyber-grid-floor {
    position: fixed;
    inset: -50%;
    background-size: 60px 60px;
    background-image: 
      linear-gradient(to right, rgba(224, 17, 95, 0.16) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(224, 17, 95, 0.16) 1px, transparent 1px);
    transform: perspective(500px) rotateX(75deg) translateZ(-60px);
    pointer-events: none;
    z-index: 1;
    animation: gridFloorScroll 7s linear infinite;
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
      linear-gradient(to right, rgba(0, 242, 254, 0.09) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(0, 242, 254, 0.09) 1px, transparent 1px);
    transform: perspective(500px) rotateX(-75deg) translateZ(-60px);
    pointer-events: none;
    z-index: 1;
    animation: gridCeilScroll 7s linear infinite;
  }
  @keyframes gridCeilScroll {
    0% { transform: perspective(500px) rotateX(-75deg) translateY(0); }
    100% { transform: perspective(500px) rotateX(-75deg) translateY(60px); }
  }

  /* 3D Holographic Gyroscope Orbital Rings */
  .hologram-rings {
    position: fixed;
    width: 800px;
    height: 800px;
    pointer-events: none;
    z-index: 2;
    transform-style: preserve-3d;
    animation: gyroRotate 25s linear infinite;
  }
  .gyro-ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 1.5px dashed rgba(224, 17, 95, 0.35);
    box-shadow: 0 0 35px rgba(224, 17, 95, 0.25);
  }
  .gyro-ring:nth-child(1) { transform: rotateX(72deg) rotateY(25deg); animation: ringSpin1 14s linear infinite; }
  .gyro-ring:nth-child(2) { transform: rotateX(-55deg) rotateY(50deg); border-color: rgba(0, 242, 254, 0.35); box-shadow: 0 0 35px rgba(0, 242, 254, 0.25); animation: ringSpin2 18s linear infinite reverse; }
  .gyro-ring:nth-child(3) { transform: rotateY(80deg); border-color: rgba(157, 78, 221, 0.35); box-shadow: 0 0 35px rgba(157, 78, 221, 0.25); animation: ringSpin3 16s linear infinite; }

  @keyframes gyroRotate { 0% { transform: rotateZ(0deg); } 100% { transform: rotateZ(360deg); } }
  @keyframes ringSpin1 { 0% { transform: rotateX(72deg) rotateY(25deg) rotateZ(0deg); } 100% { transform: rotateX(72deg) rotateY(25deg) rotateZ(360deg); } }
  @keyframes ringSpin2 { 0% { transform: rotateX(-55deg) rotateY(50deg) rotateZ(0deg); } 100% { transform: rotateX(-55deg) rotateY(50deg) rotateZ(360deg); } }
  @keyframes ringSpin3 { 0% { transform: rotateY(80deg) rotateZ(0deg); } 100% { transform: rotateY(80deg) rotateZ(360deg); } }

  /* Ambient Lighting Orbs */
  .ambient-orb {
    position: fixed;
    border-radius: 50%;
    filter: blur(110px);
    pointer-events: none;
    z-index: 2;
    opacity: 0.45;
    transition: transform 0.15s ease-out;
  }
  #orb1 { width: 620px; height: 620px; background: radial-gradient(circle, #e0115f, transparent 70%); top: -12%; left: -10%; }
  #orb2 { width: 560px; height: 560px; background: radial-gradient(circle, #00f2fe, transparent 70%); bottom: -12%; right: -10%; }
  #orb3 { width: 480px; height: 480px; background: radial-gradient(circle, #9d4edd, transparent 70%); top: 50%; left: 50%; }

  /* Scanlines and Vignette */
  .scanlines {
    position: fixed;
    inset: 0;
    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.45) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03));
    background-size: 100% 3px, 6px 100%;
    pointer-events: none;
    z-index: 990;
    opacity: 0.65;
  }
  .vignette {
    position: fixed;
    inset: 0;
    box-shadow: inset 0 0 170px rgba(0, 0, 0, 0.94);
    pointer-events: none;
    z-index: 991;
  }

  /* Cyber HUD Telemetry Bar */
  .cyber-hud-top {
    position: fixed;
    top: 18px;
    left: 24px;
    right: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 2px;
    color: rgba(255, 255, 255, 0.7);
    z-index: 100;
  }
  .hud-left, .hud-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .hud-chip {
    background: rgba(10, 11, 24, 0.85);
    border: 1px solid rgba(224, 17, 95, 0.45);
    padding: 6px 14px;
    border-radius: 99px;
    backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  }
  .hud-dot {
    width: 7px;
    height: 7px;
    background: #00f2fe;
    border-radius: 50%;
    box-shadow: 0 0 10px #00f2fe;
    animation: hudBlink 1.4s infinite alternate;
  }
  @keyframes hudBlink { 0% { opacity: 0.3; } 100% { opacity: 1; } }

  .hud-action-btn {
    cursor: pointer;
    background: rgba(224, 17, 95, 0.2);
    border: 1px solid var(--accent);
    color: #fff;
    padding: 6px 14px;
    border-radius: 99px;
    font-size: 10.5px;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 1.5px;
    transition: all 0.25s ease;
    box-shadow: 0 0 15px rgba(224, 17, 95, 0.35);
  }
  .hud-action-btn:hover {
    background: var(--accent);
    box-shadow: 0 0 25px var(--accent-glow);
    transform: translateY(-1px);
  }
  .hud-action-btn.active {
    background: #00f2fe;
    color: #030307;
    border-color: #00f2fe;
    font-weight: 800;
    box-shadow: 0 0 25px rgba(0, 242, 254, 0.8);
  }

  /* Audio Equalizer Widget */
  .audio-eq {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 14px;
  }
  .eq-bar {
    width: 3px;
    background: #00f2fe;
    border-radius: 1px;
    height: 4px;
    box-shadow: 0 0 6px #00f2fe;
    transition: height 0.1s ease;
  }

  /* Cyber Radar Widget (Bottom Left) */
  .cyber-radar {
    position: fixed;
    bottom: 24px;
    left: 24px;
    width: 90px;
    height: 90px;
    border-radius: 50%;
    border: 1px solid rgba(0, 242, 254, 0.35);
    background: rgba(8, 9, 18, 0.7);
    backdrop-filter: blur(8px);
    z-index: 50;
    pointer-events: none;
    box-shadow: 0 0 25px rgba(0, 242, 254, 0.2);
    overflow: hidden;
  }
  .radar-sweep {
    position: absolute;
    inset: 0;
    background: conic-gradient(from 0deg, rgba(0, 242, 254, 0.35) 0deg, transparent 90deg, transparent 360deg);
    border-radius: 50%;
    animation: radarSpin 4s linear infinite;
  }
  @keyframes radarSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  .radar-ring {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    border: 1px dashed rgba(224, 17, 95, 0.35);
  }
  .radar-blip {
    position: absolute;
    width: 5px;
    height: 5px;
    background: #ff2a7a;
    border-radius: 50%;
    box-shadow: 0 0 8px #ff2a7a;
    top: 32px;
    left: 54px;
    animation: blipPulse 2s infinite alternate;
  }
  @keyframes blipPulse { 0% { opacity: 0.2; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1.3); } }

  /* 3D Scene Wrapper */
  .scene-wrapper {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 32px;
    transform-style: preserve-3d;
    transition: transform 0.12s ease-out;
    max-width: 1140px;
    width: 100%;
  }

  /* =========================================================
     THE FUTURISTIC VIP TICKET PASS
     ========================================================= */
  .ticket-container {
    position: relative;
    background: var(--ticket-bg);
    backdrop-filter: blur(32px);
    -webkit-backdrop-filter: blur(32px);
    border-radius: 26px;
    display: flex;
    width: 100%;
    max-width: 820px;
    border: 1px solid rgba(224, 17, 95, 0.55);
    box-shadow: 
      0 30px 80px rgba(0, 0, 0, 0.95),
      0 0 60px rgba(224, 17, 95, 0.4),
      inset 0 0 40px rgba(224, 17, 95, 0.12);
    transform-style: preserve-3d;
  }

  .guilloche-bg {
    position: absolute;
    inset: 0;
    opacity: 0.08;
    pointer-events: none;
    z-index: 1;
    background-image: 
      radial-gradient(circle at 50% 50%, rgba(255, 42, 122, 0.5) 1px, transparent 1px),
      radial-gradient(circle at 20% 30%, rgba(0, 242, 254, 0.5) 1px, transparent 1px);
    background-size: 24px 24px, 18px 18px;
    border-radius: 26px;
  }

  /* Interactive Holographic Foil Sheen */
  .holo-foil-overlay {
    position: absolute;
    inset: 0;
    border-radius: 26px;
    background: linear-gradient(
      var(--holo-angle),
      transparent 0%,
      rgba(255, 42, 122, 0.08) 25%,
      rgba(0, 242, 254, 0.12) 50%,
      rgba(157, 78, 221, 0.09) 75%,
      rgba(255, 215, 0, 0.08) 90%,
      transparent 100%
    );
    pointer-events: none;
    z-index: 4;
    background-size: 200% 200%;
    animation: foilShimmer 12s ease infinite;
  }
  @keyframes foilShimmer {
    0% { background-position: 0% 0%; }
    50% { background-position: 100% 100%; }
    100% { background-position: 0% 0%; }
  }

  /* Laser Scanner Beam */
  .laser-scanner {
    position: absolute;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, transparent, #00f2fe, #ff2a7a, #00f2fe, transparent);
    box-shadow: 0 0 18px #00f2fe, 0 0 35px #ff2a7a;
    z-index: 6;
    pointer-events: none;
    animation: laserSweep 4s ease-in-out infinite alternate;
  }
  @keyframes laserSweep {
    0% { top: 0%; opacity: 0.15; }
    50% { opacity: 0.95; }
    100% { top: 100%; opacity: 0.15; }
  }

  /* Notches for VIP ticket aesthetic */
  .notch-top {
    position: absolute;
    top: -20px;
    right: 220px;
    width: 40px;
    height: 40px;
    background: var(--bg);
    border-radius: 50%;
    border-bottom: 1.5px solid rgba(224, 17, 95, 0.6);
    z-index: 10;
    box-shadow: inset 0 -8px 14px rgba(0, 0, 0, 0.85);
  }
  .notch-bottom {
    position: absolute;
    bottom: -20px;
    right: 220px;
    width: 40px;
    height: 40px;
    background: var(--bg);
    border-radius: 50%;
    border-top: 1.5px solid rgba(224, 17, 95, 0.6);
    z-index: 10;
    box-shadow: inset 0 8px 14px rgba(0, 0, 0, 0.85);
  }

  .perforation-divider {
    position: absolute;
    top: 0;
    bottom: 0;
    right: 239px;
    width: 2px;
    border-right: 2px dashed rgba(224, 17, 95, 0.55);
    z-index: 9;
    pointer-events: none;
  }

  /* MAIN TICKET SECTION */
  .ticket-main {
    flex: 1;
    padding: 40px 44px;
    position: relative;
    z-index: 5;
  }

  .ticket-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
  }

  .brand-title {
    font-family: 'Orbitron', 'Space Grotesk', sans-serif;
    font-size: 26px;
    font-weight: 900;
    letter-spacing: 3px;
    background: linear-gradient(135deg, #ffffff 20%, #ff70a0 60%, #00f2fe 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 0 30px rgba(224, 17, 95, 0.7);
  }
  .brand-sub {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 3px;
    color: #94a3b8;
    text-transform: uppercase;
  }

  .vip-badge {
    background: linear-gradient(135deg, rgba(224, 17, 95, 0.3), rgba(0, 242, 254, 0.15));
    border: 1px solid rgba(255, 42, 122, 0.7);
    padding: 7px 18px;
    border-radius: 99px;
    font-family: 'Orbitron', monospace;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 2.5px;
    color: #ff2a7a;
    box-shadow: 0 0 25px rgba(224, 17, 95, 0.5);
    animation: badgePulse 2.5s ease-in-out infinite alternate;
  }
  @keyframes badgePulse {
    0% { box-shadow: 0 0 20px rgba(224, 17, 95, 0.4); border-color: rgba(255, 42, 122, 0.7); }
    100% { box-shadow: 0 0 35px rgba(0, 242, 254, 0.7); border-color: #00f2fe; color: #00f2fe; }
  }

  /* 3D Key Container with animated sweep */
  .key-box-3d {
    background: rgba(5, 6, 12, 0.96);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 18px;
    padding: 24px 28px;
    position: relative;
    margin-bottom: 20px;
    box-shadow: 
      0 15px 40px rgba(0, 0, 0, 0.8),
      inset 0 0 25px rgba(224, 17, 95, 0.22);
    overflow: hidden;
  }
  .key-box-3d::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 50%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(0, 242, 254, 0.3), transparent);
    transform: skewX(-25deg);
    animation: keyShineSweep 5s infinite;
  }
  @keyframes keyShineSweep {
    0%, 70% { left: -100%; }
    100% { left: 200%; }
  }

  .key-label-row {
    display: flex;
    justify-content: space-between;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10.5px;
    letter-spacing: 2px;
    color: #94a3b8;
    margin-bottom: 12px;
  }
  .key-value {
    font-family: 'Orbitron', 'JetBrains Mono', monospace;
    font-size: 27px;
    font-weight: 900;
    color: #fff;
    letter-spacing: 3.5px;
    text-shadow: 
      0 0 14px var(--accent-bright),
      0 0 35px var(--accent-glow),
      0 0 65px var(--accent);
    user-select: all;
  }

  /* Command box */
  .cmd-box {
    background: rgba(8, 9, 16, 0.94);
    border: 1px dashed rgba(224, 17, 95, 0.45);
    border-radius: 14px;
    padding: 15px 22px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13.5px;
    color: #00f2fe;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    user-select: all;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.55);
    transition: border-color 0.2s ease;
  }
  .cmd-box:hover { border-color: #00f2fe; }
  .cmd-prefix { color: #64748b; font-size: 10.5px; letter-spacing: 1.5px; }

  /* Cyber button */
  .btn-redeem {
    width: 100%;
    background: linear-gradient(135deg, #e0115f 0%, #ff2a7a 50%, #7928ca 100%);
    background-size: 200% 200%;
    color: #fff;
    border: none;
    border-radius: 16px;
    padding: 18px 30px;
    font-family: 'Orbitron', 'Space Grotesk', sans-serif;
    font-size: 14px;
    font-weight: 900;
    letter-spacing: 3px;
    text-transform: uppercase;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    box-shadow: 0 0 40px rgba(224, 17, 95, 0.7), 0 12px 30px rgba(0, 0, 0, 0.7);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    animation: btnGradient 6s ease infinite;
  }
  @keyframes btnGradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .btn-redeem:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 0 60px rgba(255, 42, 122, 0.95), 0 18px 40px rgba(0, 0, 0, 0.8);
  }
  .ripple {
    position: absolute;
    border-radius: 50%;
    transform: scale(0);
    animation: rippleAnim 0.6s linear;
    background: rgba(255, 255, 255, 0.65);
    pointer-events: none;
  }
  @keyframes rippleAnim { to { transform: scale(4); opacity: 0; } }

  .micro-security {
    margin-top: 22px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 9.5px;
    letter-spacing: 1.5px;
    color: rgba(148, 163, 184, 0.65);
    display: flex;
    justify-content: space-between;
    text-transform: uppercase;
  }

  /* =========================================================
     INTERACTIVE TEAR-OFF VIP STUB WITH PHYSICS
     ========================================================= */
  .ticket-stub {
    width: 240px;
    padding: 38px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    position: relative;
    background: rgba(8, 9, 16, 0.75);
    z-index: 5;
    border-radius: 0 26px 26px 0;
    transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease;
    cursor: pointer;
  }

  /* When torn off! */
  .ticket-stub.torn {
    transform: translateX(45px) rotate(8deg) translateY(15px);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.9), 0 0 35px rgba(255, 42, 122, 0.6);
    border: 1px dashed #ff2a7a;
    border-radius: 20px;
  }
  .ticket-stub.torn::before {
    content: 'TORN // VIP DETACHED';
    position: absolute;
    top: -24px;
    left: 50%;
    transform: translateX(-50%);
    background: #ff2a7a;
    color: #fff;
    font-family: 'Orbitron', monospace;
    font-size: 9px;
    font-weight: 900;
    padding: 3px 10px;
    border-radius: 99px;
    letter-spacing: 1px;
    white-space: nowrap;
  }

  .stub-tag {
    font-family: 'Orbitron', monospace;
    font-size: 11.5px;
    letter-spacing: 2px;
    color: #ff2a7a;
    text-transform: uppercase;
    text-align: center;
    font-weight: 800;
  }

  .holo-seal {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    border: 2px dashed #ffd700;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(circle, rgba(255, 215, 0, 0.22), transparent 70%);
    box-shadow: 0 0 25px rgba(255, 215, 0, 0.45);
    position: relative;
    animation: sealSpin 20s linear infinite;
  }
  @keyframes sealSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  .seal-inner {
    font-family: 'Orbitron', monospace;
    font-size: 8px;
    font-weight: 900;
    color: #ffd700;
    letter-spacing: 1.5px;
    text-align: center;
    text-shadow: 0 0 10px #ffd700;
  }

  .cyber-barcode {
    width: 100%;
    height: 55px;
    background-image: repeating-linear-gradient(
      90deg,
      #fff 0px, #fff 2px,
      transparent 2px, transparent 4px,
      #00f2fe 4px, #00f2fe 7px,
      transparent 7px, transparent 10px,
      #ff2a7a 10px, #ff2a7a 12px,
      transparent 12px, transparent 16px,
      #fff 16px, #fff 19px,
      transparent 19px, transparent 22px
    );
    box-shadow: 0 0 15px rgba(0, 242, 254, 0.45);
    border-radius: 4px;
  }
  .barcode-serial {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9.5px;
    letter-spacing: 3px;
    color: #64748b;
  }

  .stub-meta {
    width: 100%;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #94a3b8;
    display: flex;
    flex-direction: column;
    gap: 3px;
    text-align: center;
  }
  .stub-tear-hint {
    font-size: 8.5px;
    color: #ff2a7a;
    letter-spacing: 1px;
    text-transform: uppercase;
    font-family: 'JetBrains Mono', monospace;
    margin-top: 4px;
    animation: blinkHint 1.5s infinite;
  }
  @keyframes blinkHint { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }

  /* =========================================================
     FLOATING HOLOGRAPHIC COMPANION POD (GIF INTEGRATION)
     ========================================================= */
  .holo-companion-card {
    width: 260px;
    background: rgba(12, 13, 24, 0.88);
    backdrop-filter: blur(28px);
    border: 1px solid rgba(0, 242, 254, 0.45);
    border-radius: 22px;
    padding: 18px;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 
      0 25px 60px rgba(0, 0, 0, 0.85),
      0 0 45px rgba(0, 242, 254, 0.35);
    transform-style: preserve-3d;
    transition: all 0.3s ease;
    cursor: pointer;
    position: relative;
  }
  .holo-companion-card:hover {
    transform: translateY(-8px) scale(1.04);
    border-color: #ff2a7a;
    box-shadow: 0 0 55px rgba(255, 42, 122, 0.65);
  }
  .companion-hud-header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 1.5px;
    color: #00f2fe;
    margin-bottom: 12px;
  }
  .companion-img-frame {
    width: 100%;
    height: 280px;
    border-radius: 16px;
    overflow: hidden;
    position: relative;
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: inset 0 0 25px rgba(0, 0, 0, 0.85);
  }
  .companion-img-frame img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    filter: contrast(1.1) saturate(1.15);
    transition: transform 0.4s ease;
  }
  .holo-companion-card:hover .companion-img-frame img { transform: scale(1.06); }
  .companion-img-frame::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(rgba(0, 242, 254, 0.08) 50%, rgba(224, 17, 95, 0.08) 50%);
    background-size: 100% 4px;
    pointer-events: none;
  }

  .companion-dialogue {
    position: absolute;
    top: -46px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(14, 15, 28, 0.95);
    border: 1px solid #ff2a7a;
    border-radius: 12px;
    padding: 6px 14px;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 11px;
    font-weight: 700;
    color: #fff;
    white-space: nowrap;
    box-shadow: 0 0 20px rgba(224, 17, 95, 0.6);
    pointer-events: none;
    transition: opacity 0.2s, transform 0.2s;
  }
  .companion-dialogue::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid #ff2a7a;
  }

  .companion-caption {
    margin-top: 14px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #f1f5f9;
    text-align: center;
    letter-spacing: 1.5px;
  }
  .companion-caption span { color: #ff2a7a; font-weight: 800; }

  /* Custom Cursor */
  .custom-cursor {
    position: fixed;
    width: 32px;
    height: 32px;
    border: 1.5px solid #ff2a7a;
    border-radius: 50%;
    pointer-events: none;
    transform: translate(-50%, -50%);
    transition: width 0.2s, height 0.2s, border-color 0.2s;
    z-index: 9999;
    box-shadow: 0 0 20px rgba(224, 17, 95, 0.8);
  }
  .custom-cursor-dot {
    position: fixed;
    width: 6px;
    height: 6px;
    background: #00f2fe;
    border-radius: 50%;
    pointer-events: none;
    transform: translate(-50%, -50%);
    z-index: 10000;
    box-shadow: 0 0 10px #00f2fe;
  }

  @media (max-width: 990px) {
    .scene-wrapper { flex-direction: column; }
    .ticket-container { flex-direction: column; }
    .ticket-stub { width: 100%; border-radius: 0 0 26px 26px; border-top: 2px dashed rgba(224, 17, 95, 0.45); }
    .perforation-divider, .notch-top, .notch-bottom { display: none; }
    .holo-companion-card { width: 100%; max-width: 420px; }
  }
`;

module.exports = { ticketStyles };
