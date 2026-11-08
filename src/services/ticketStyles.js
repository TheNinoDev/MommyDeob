const ticketStyles = `
  :root {
    --void: #030407;
    --chassis: #090a0f;
    --plate: #0e111a;
    --plate-hover: #141824;
    --plate-border: rgba(255, 255, 255, 0.09);
    --plate-border-active: rgba(255, 0, 85, 0.45);
    
    --carmine: #ff0055;
    --carmine-bright: #ff2a70;
    --carmine-glow: rgba(255, 0, 85, 0.55);
    
    --cyan: #00f0ff;
    --cyan-glow: rgba(0, 240, 255, 0.55);
    
    --amber: #ffaa00;
    --amber-glow: rgba(255, 170, 0, 0.5);
    
    --text-primary: #ffffff;
    --text-secondary: #8b95a5;
    --text-tertiary: #4d5566;
    
    --holo-angle: 135deg;
    --warp-speed: 7;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  body {
    background: var(--void);
    color: var(--text-primary);
    font-family: 'Space Grotesk', -apple-system, sans-serif;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 20px;
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
  #matrix-canvas { z-index: 1; opacity: 0.2; }
  #particles-canvas { z-index: 2; }
  #shockwave-canvas { z-index: 997; }
  #cursor-trail-canvas { z-index: 998; }
  #confetti-canvas { z-index: 1000; }

  /* 3D Infinity Cyber Grids - Floor and Ceiling */
  .cyber-grid-floor {
    position: fixed;
    inset: -50%;
    background-size: 60px 60px;
    background-image: 
      linear-gradient(to right, rgba(255, 0, 85, 0.14) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 0, 85, 0.14) 1px, transparent 1px);
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
      linear-gradient(to right, rgba(0, 240, 255, 0.08) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(0, 240, 255, 0.08) 1px, transparent 1px);
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
    width: 820px;
    height: 820px;
    pointer-events: none;
    z-index: 2;
    transform-style: preserve-3d;
    animation: gyroRotate 25s linear infinite;
  }
  .gyro-ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 1px dashed rgba(255, 0, 85, 0.3);
    box-shadow: 0 0 35px rgba(255, 0, 85, 0.18);
  }
  .gyro-ring:nth-child(1) { transform: rotateX(72deg) rotateY(25deg); animation: ringSpin1 14s linear infinite; }
  .gyro-ring:nth-child(2) { transform: rotateX(-55deg) rotateY(50deg); border-color: rgba(0, 240, 255, 0.3); box-shadow: 0 0 35px rgba(0, 240, 255, 0.18); animation: ringSpin2 18s linear infinite reverse; }
  .gyro-ring:nth-child(3) { transform: rotateY(80deg); border-color: rgba(255, 170, 0, 0.25); box-shadow: 0 0 35px rgba(255, 170, 0, 0.15); animation: ringSpin3 16s linear infinite; }

  @keyframes gyroRotate { 0% { transform: rotateZ(0deg); } 100% { transform: rotateZ(360deg); } }
  @keyframes ringSpin1 { 0% { transform: rotateX(72deg) rotateY(25deg) rotateZ(0deg); } 100% { transform: rotateX(72deg) rotateY(25deg) rotateZ(360deg); } }
  @keyframes ringSpin2 { 0% { transform: rotateX(-55deg) rotateY(50deg) rotateZ(0deg); } 100% { transform: rotateX(-55deg) rotateY(50deg) rotateZ(360deg); } }
  @keyframes ringSpin3 { 0% { transform: rotateY(80deg) rotateZ(0deg); } 100% { transform: rotateY(80deg) rotateZ(360deg); } }

  /* Dynamic Colored Lighting Orbs */
  .ambient-orb {
    position: fixed;
    border-radius: 50%;
    filter: blur(120px);
    pointer-events: none;
    z-index: 2;
    opacity: 0.4;
    transition: transform 0.15s ease-out;
  }
  #orb1 { width: 620px; height: 620px; background: radial-gradient(circle, #ff0055, transparent 70%); top: -14%; left: -10%; }
  #orb2 { width: 560px; height: 560px; background: radial-gradient(circle, #00f0ff, transparent 70%); bottom: -14%; right: -10%; }
  #orb3 { width: 480px; height: 480px; background: radial-gradient(circle, #ffaa00, transparent 70%); top: 50%; left: 50%; }

  /* CRT Scanlines and Heavy Vignette */
  .scanlines {
    position: fixed;
    inset: 0;
    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.45) 50%), linear-gradient(90deg, rgba(255, 0, 85, 0.02), rgba(0, 240, 255, 0.01), rgba(255, 0, 85, 0.02));
    background-size: 100% 3px, 6px 100%;
    pointer-events: none;
    z-index: 990;
    opacity: 0.65;
  }
  .vignette {
    position: fixed;
    inset: 0;
    box-shadow: inset 0 0 180px rgba(0, 0, 0, 0.95);
    pointer-events: none;
    z-index: 991;
  }

  /* =========================================================
     TOP CYBER HUD BAR (Architectural, High-Precision)
     ========================================================= */
  .cyber-hud-top {
    position: fixed;
    top: 18px;
    left: 24px;
    right: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.15em;
    color: var(--text-secondary);
    z-index: 100;
  }
  .hud-left, .hud-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .hud-chip {
    background: rgba(9, 10, 15, 0.88);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 5px 12px;
    border-radius: 2px;
    backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.6);
  }
  .hud-dot {
    width: 6px;
    height: 6px;
    background: var(--cyan);
    border-radius: 50%;
    box-shadow: 0 0 8px var(--cyan);
    animation: hudBlink 1.4s infinite alternate;
  }
  @keyframes hudBlink { 0% { opacity: 0.25; } 100% { opacity: 1; } }

  .hud-action-btn {
    cursor: pointer;
    background: rgba(14, 17, 26, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: var(--text-secondary);
    padding: 5px 12px;
    border-radius: 2px;
    font-size: 10px;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.12em;
    transition: all 0.2s ease;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
  }
  .hud-action-btn:hover {
    background: rgba(255, 0, 85, 0.15);
    color: #fff;
    border-color: var(--carmine);
    box-shadow: 0 0 15px var(--carmine-glow);
  }
  .hud-action-btn.active {
    background: var(--carmine);
    color: #fff;
    border-color: var(--carmine);
    font-weight: 700;
    box-shadow: 0 0 20px var(--carmine-glow);
  }

  /* Audio Equalizer Widget */
  .audio-eq {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 12px;
  }
  .eq-bar {
    width: 2.5px;
    background: var(--cyan);
    border-radius: 1px;
    height: 3px;
    box-shadow: 0 0 6px var(--cyan);
    transition: height 0.08s ease;
  }

  /* Cyber Radar Widget (Bottom Left) */
  .cyber-radar {
    position: fixed;
    bottom: 24px;
    left: 24px;
    width: 84px;
    height: 84px;
    border-radius: 50%;
    border: 1px solid rgba(0, 240, 255, 0.3);
    background: rgba(9, 10, 15, 0.85);
    backdrop-filter: blur(8px);
    z-index: 50;
    pointer-events: none;
    box-shadow: 0 0 25px rgba(0, 240, 255, 0.15);
    overflow: hidden;
  }
  .radar-sweep {
    position: absolute;
    inset: 0;
    background: conic-gradient(from 0deg, rgba(0, 240, 255, 0.3) 0deg, transparent 90deg, transparent 360deg);
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
    border: 1px dashed rgba(255, 0, 85, 0.3);
  }
  .radar-blip {
    position: absolute;
    width: 4px;
    height: 4px;
    background: var(--carmine-bright);
    border-radius: 50%;
    box-shadow: 0 0 8px var(--carmine-bright);
    top: 28px;
    left: 50px;
    animation: blipPulse 2s infinite alternate;
  }
  @keyframes blipPulse { 0% { opacity: 0.2; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1.3); } }

  /* 3D Scene Wrapper */
  .scene-wrapper {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: stretch;
    justify-content: center;
    gap: 28px;
    transform-style: preserve-3d;
    transition: transform 0.12s ease-out;
    max-width: 1140px;
    width: 100%;
  }

  /* =========================================================
     THE ARCHITECTURAL VIP ACCESS TICKET (Precision Silhouette)
     ========================================================= */
  .ticket-container {
    position: relative;
    background: var(--chassis);
    backdrop-filter: blur(28px);
    -webkit-backdrop-filter: blur(28px);
    border: 1px solid var(--plate-border);
    display: flex;
    flex: 1;
    max-width: 820px;
    box-shadow: 
      0 35px 80px rgba(0, 0, 0, 0.95),
      0 0 60px rgba(255, 0, 85, 0.18),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    transform-style: preserve-3d;
    border-radius: 4px;
  }

  /* Precision Industrial Corner Reticles */
  .ticket-container::before {
    content: '';
    position: absolute;
    top: -1px;
    left: -1px;
    width: 12px;
    height: 12px;
    border-top: 2px solid var(--carmine);
    border-left: 2px solid var(--carmine);
    z-index: 8;
    pointer-events: none;
  }
  .ticket-container::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: -1px;
    width: 12px;
    height: 12px;
    border-bottom: 2px solid var(--carmine);
    border-left: 2px solid var(--carmine);
    z-index: 8;
    pointer-events: none;
  }

  .guilloche-bg {
    position: absolute;
    inset: 0;
    opacity: 0.06;
    pointer-events: none;
    z-index: 1;
    background-image: 
      radial-gradient(circle at 50% 50%, rgba(255, 0, 85, 0.6) 1px, transparent 1px),
      radial-gradient(circle at 20% 30%, rgba(0, 240, 255, 0.6) 1px, transparent 1px);
    background-size: 24px 24px, 18px 18px;
  }

  /* Holographic Foil Overlay */
  .holo-foil-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      var(--holo-angle),
      transparent 0%,
      rgba(255, 0, 85, 0.06) 25%,
      rgba(0, 240, 255, 0.09) 50%,
      rgba(255, 170, 0, 0.06) 75%,
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
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--cyan), var(--carmine-bright), var(--cyan), transparent);
    box-shadow: 0 0 15px var(--cyan), 0 0 30px var(--carmine);
    z-index: 6;
    pointer-events: none;
    animation: laserSweep 4s ease-in-out infinite alternate;
  }
  @keyframes laserSweep {
    0% { top: 0%; opacity: 0.15; }
    50% { opacity: 0.95; }
    100% { top: 100%; opacity: 0.15; }
  }

  /* Physical Ticket Cutout Notches */
  .notch-top {
    position: absolute;
    top: -16px;
    right: 232px;
    width: 32px;
    height: 32px;
    background: var(--void);
    border-radius: 50%;
    border-bottom: 1px solid var(--plate-border);
    z-index: 10;
    box-shadow: inset 0 -6px 12px rgba(0, 0, 0, 0.9);
  }
  .notch-bottom {
    position: absolute;
    bottom: -16px;
    right: 232px;
    width: 32px;
    height: 32px;
    background: var(--void);
    border-radius: 50%;
    border-top: 1px solid var(--plate-border);
    z-index: 10;
    box-shadow: inset 0 6px 12px rgba(0, 0, 0, 0.9);
  }

  .perforation-divider {
    position: absolute;
    top: 0;
    bottom: 0;
    right: 247px;
    width: 2px;
    border-right: 2px dashed rgba(255, 0, 85, 0.4);
    z-index: 9;
    pointer-events: none;
  }

  /* =========================================================
     MAIN TICKET BODY (Deliberate Editorial Typography & Spacing)
     ========================================================= */
  .ticket-main {
    flex: 1;
    padding: 36px 40px;
    position: relative;
    z-index: 5;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  /* Top Technical Deck */
  .ticket-top-deck {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
    margin-bottom: 24px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 9.5px;
    letter-spacing: 0.2em;
    color: var(--text-secondary);
    text-transform: uppercase;
  }
  .deck-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .deck-val {
    color: var(--text-primary);
    font-weight: 700;
  }

  /* Main Masthead */
  .ticket-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 24px;
  }
  .brand-title {
    font-family: 'Syne', 'Space Grotesk', sans-serif;
    font-size: 32px;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1;
    color: #ffffff;
    text-transform: uppercase;
    text-shadow: 0 0 25px rgba(255, 0, 85, 0.4);
  }
  .brand-sub {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9.5px;
    letter-spacing: 0.22em;
    color: var(--carmine);
    text-transform: uppercase;
    margin-top: 6px;
    font-weight: 600;
  }

  /* Badges */
  .badge-wrap {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }
  .vip-badge {
    background: rgba(255, 0, 85, 0.12);
    border: 1px solid var(--carmine);
    padding: 5px 14px;
    border-radius: 2px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.2em;
    color: var(--carmine-bright);
    box-shadow: 0 0 15px rgba(255, 0, 85, 0.35);
  }
  .pass-type-tag {
    font-family: 'JetBrains Mono', monospace;
    font-size: 8.5px;
    letter-spacing: 0.2em;
    color: var(--text-tertiary);
  }

  /* =========================================================
     THE KEY VAULT (Recessed Architectural Chamber)
     ========================================================= */
  .key-box-3d {
    background: #07080d;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-left: 3px solid var(--carmine);
    border-radius: 2px;
    padding: 22px 24px;
    position: relative;
    margin-bottom: 16px;
    box-shadow: 
      inset 0 0 30px rgba(0, 0, 0, 0.95),
      0 10px 30px rgba(0, 0, 0, 0.6);
    overflow: hidden;
  }
  .key-box-3d::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 40%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.18), transparent);
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
    font-size: 9.5px;
    letter-spacing: 0.2em;
    color: var(--text-secondary);
    margin-bottom: 10px;
    text-transform: uppercase;
  }
  .key-value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 26px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: 0.18em;
    text-shadow: 
      0 0 15px var(--carmine-glow),
      0 0 35px rgba(255, 0, 85, 0.4);
    user-select: all;
    font-variant-numeric: tabular-nums;
  }

  /* Command box */
  .cmd-box {
    background: rgba(14, 17, 26, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 2px;
    padding: 12px 18px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: var(--cyan);
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    user-select: all;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
    transition: border-color 0.2s ease;
  }
  .cmd-box:hover { border-color: var(--cyan); }
  .cmd-prefix { color: var(--text-tertiary); font-size: 9.5px; letter-spacing: 0.15em; font-weight: 600; }

  /* Industrial Trigger Button */
  .btn-redeem {
    width: 100%;
    background: linear-gradient(135deg, #ff0055 0%, #d60047 100%);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    padding: 16px 28px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    box-shadow: 
      0 0 30px rgba(255, 0, 85, 0.5),
      0 10px 25px rgba(0, 0, 0, 0.7);
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .btn-redeem:hover {
    transform: translateY(-1px);
    background: linear-gradient(135deg, #ff1a66 0%, #ff0055 100%);
    box-shadow: 0 0 45px rgba(255, 0, 85, 0.8), 0 15px 35px rgba(0, 0, 0, 0.8);
  }
  .btn-redeem:active {
    transform: translateY(1px);
  }
  .ripple {
    position: absolute;
    border-radius: 50%;
    transform: scale(0);
    animation: rippleAnim 0.6s linear;
    background: rgba(255, 255, 255, 0.7);
    pointer-events: none;
  }
  @keyframes rippleAnim { to { transform: scale(4); opacity: 0; } }

  /* Structured Technical Metadata Grid */
  .tech-meta-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-top: 22px;
    padding-top: 18px;
    border-top: 1px solid rgba(255, 255, 255, 0.07);
    font-family: 'JetBrains Mono', monospace;
  }
  .meta-col {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .meta-label {
    font-size: 8px;
    color: var(--text-tertiary);
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }
  .meta-value {
    font-size: 10px;
    color: var(--text-secondary);
    font-weight: 700;
    letter-spacing: 0.1em;
  }

  /* =========================================================
     PERFORATED TEAR-OFF STUB (Mechanical Precision)
     ========================================================= */
  .ticket-stub {
    width: 248px;
    padding: 36px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    position: relative;
    background: #07080c;
    z-index: 5;
    border-left: 1px solid rgba(255, 255, 255, 0.06);
    transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease;
    cursor: pointer;
  }

  /* When torn off! */
  .ticket-stub.torn {
    transform: translateX(45px) rotate(7deg) translateY(12px);
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(255, 0, 85, 0.6);
    border: 1px dashed var(--carmine);
    border-radius: 4px;
  }
  .ticket-stub.torn::before {
    content: 'TORN // DETACHED';
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--carmine);
    color: #fff;
    font-family: 'JetBrains Mono', monospace;
    font-size: 8.5px;
    font-weight: 800;
    padding: 3px 10px;
    letter-spacing: 0.15em;
    white-space: nowrap;
    border-radius: 2px;
  }

  .stub-tag {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.25em;
    color: var(--carmine);
    text-transform: uppercase;
    text-align: center;
    font-weight: 800;
  }

  /* Holographic VIP Seal */
  .holo-seal {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    border: 1px dashed var(--amber);
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(circle, rgba(255, 170, 0, 0.15), transparent 70%);
    box-shadow: 0 0 25px rgba(255, 170, 0, 0.3);
    position: relative;
    animation: sealSpin 20s linear infinite;
  }
  @keyframes sealSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  .seal-inner {
    font-family: 'JetBrains Mono', monospace;
    font-size: 7.5px;
    font-weight: 800;
    color: var(--amber);
    letter-spacing: 0.15em;
    text-align: center;
    text-shadow: 0 0 10px var(--amber);
    line-height: 1.3;
  }

  /* Precision Barcode */
  .barcode-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    width: 100%;
  }
  .cyber-barcode {
    width: 100%;
    height: 50px;
    background-image: repeating-linear-gradient(
      90deg,
      #fff 0px, #fff 1.5px,
      transparent 1.5px, transparent 3.5px,
      var(--cyan) 3.5px, var(--cyan) 6px,
      transparent 6px, transparent 9px,
      var(--carmine) 9px, var(--carmine) 11px,
      transparent 11px, transparent 15px,
      #fff 15px, #fff 18px,
      transparent 18px, transparent 21px
    );
    box-shadow: 0 0 15px rgba(0, 240, 255, 0.35);
    border-radius: 1px;
  }
  .barcode-serial {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.25em;
    color: var(--text-tertiary);
  }

  .stub-meta {
    width: 100%;
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    color: var(--text-secondary);
    display: flex;
    flex-direction: column;
    gap: 4px;
    text-align: center;
    letter-spacing: 0.1em;
  }
  .stub-tear-hint {
    font-size: 8px;
    color: var(--carmine);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    font-family: 'JetBrains Mono', monospace;
    margin-top: 6px;
    animation: blinkHint 1.5s infinite;
    font-weight: 700;
  }
  @keyframes blinkHint { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }

  /* =========================================================
     HOLOGRAPHIC COMPANION CONSOLE (Tactical Cyberpod)
     ========================================================= */
  .holo-companion-card {
    width: 270px;
    background: var(--chassis);
    backdrop-filter: blur(28px);
    border: 1px solid var(--plate-border);
    border-radius: 4px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 
      0 35px 80px rgba(0, 0, 0, 0.95),
      0 0 40px rgba(0, 240, 255, 0.2);
    transform-style: preserve-3d;
    transition: all 0.3s ease;
    cursor: pointer;
    position: relative;
  }
  .holo-companion-card::before {
    content: '';
    position: absolute;
    top: -1px;
    right: -1px;
    width: 10px;
    height: 10px;
    border-top: 2px solid var(--cyan);
    border-right: 2px solid var(--cyan);
    z-index: 8;
  }
  .holo-companion-card:hover {
    transform: translateY(-6px);
    border-color: rgba(255, 0, 85, 0.45);
    box-shadow: 0 0 50px rgba(255, 0, 85, 0.45);
  }

  .companion-hud-header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.18em;
    color: var(--cyan);
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  }
  .companion-img-frame {
    width: 100%;
    height: 290px;
    border-radius: 2px;
    overflow: hidden;
    position: relative;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: inset 0 0 25px rgba(0, 0, 0, 0.9);
  }
  .companion-img-frame img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    filter: contrast(1.1) saturate(1.15);
    transition: transform 0.4s ease;
  }
  .holo-companion-card:hover .companion-img-frame img { transform: scale(1.05); }
  .companion-img-frame::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(rgba(0, 240, 255, 0.06) 50%, rgba(255, 0, 85, 0.06) 50%);
    background-size: 100% 4px;
    pointer-events: none;
  }

  .companion-dialogue {
    position: absolute;
    top: -42px;
    left: 50%;
    transform: translateX(-50%);
    background: #090a0f;
    border: 1px solid var(--carmine);
    border-radius: 2px;
    padding: 6px 14px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    font-weight: 700;
    color: #ffffff;
    white-space: nowrap;
    box-shadow: 0 0 20px rgba(255, 0, 85, 0.5);
    pointer-events: none;
    letter-spacing: 0.05em;
  }
  .companion-dialogue::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 5px solid var(--carmine);
  }

  .companion-caption {
    margin-top: 14px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: var(--text-primary);
    text-align: center;
    letter-spacing: 0.18em;
  }
  .companion-caption span { color: var(--carmine); font-weight: 800; }

  /* Custom Cursor */
  .custom-cursor {
    position: fixed;
    width: 30px;
    height: 30px;
    border: 1px solid var(--carmine);
    border-radius: 50%;
    pointer-events: none;
    transform: translate(-50%, -50%);
    transition: width 0.2s, height 0.2s, border-color 0.2s;
    z-index: 9999;
    box-shadow: 0 0 15px rgba(255, 0, 85, 0.6);
  }
  .custom-cursor-dot {
    position: fixed;
    width: 4px;
    height: 4px;
    background: var(--cyan);
    border-radius: 50%;
    pointer-events: none;
    transform: translate(-50%, -50%);
    z-index: 10000;
    box-shadow: 0 0 8px var(--cyan);
  }

  @media (max-width: 990px) {
    .scene-wrapper { flex-direction: column; align-items: center; }
    .ticket-container { flex-direction: column; width: 100%; }
    .ticket-stub { width: 100%; border-left: none; border-top: 1px dashed rgba(255, 0, 85, 0.4); }
    .perforation-divider, .notch-top, .notch-bottom { display: none; }
    .holo-companion-card { width: 100%; max-width: 420px; }
  }
`;

module.exports = { ticketStyles };
