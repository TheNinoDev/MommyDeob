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
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700;800&family=JetBrains+Mono:wght@400;600;800&family=Orbitron:wght@700;900&family=Syne:wght@800&display=swap" rel="stylesheet">
  <style>
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
      --ticket-bg: rgba(10, 11, 20, 0.92);
      --holo-angle: 135deg;
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
      perspective: 1600px;
      cursor: crosshair;
    }

    /* FULLSCREEN BACKGROUND EFFECTS */
    #matrix-canvas, #particles-canvas, #warp-canvas, #cursor-trail-canvas, #confetti-canvas {
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
    #cursor-trail-canvas { z-index: 998; }
    #confetti-canvas { z-index: 1000; }

    /* 3D Infinity Cyber Grids - Floor and Ceiling */
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

    /* Holographic Gyroscopic Background Rings */
    .hologram-rings {
      position: fixed;
      width: 780px;
      height: 780px;
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

    /* Dynamic Ambient Colored Lighting Orbs */
    .ambient-orb {
      position: fixed;
      border-radius: 50%;
      filter: blur(110px);
      pointer-events: none;
      z-index: 2;
      opacity: 0.45;
      transition: transform 0.15s ease-out;
    }
    #orb1 { width: 600px; height: 600px; background: radial-gradient(circle, #e0115f, transparent 70%); top: -12%; left: -10%; }
    #orb2 { width: 550px; height: 550px; background: radial-gradient(circle, #00f2fe, transparent 70%); bottom: -12%; right: -10%; }
    #orb3 { width: 450px; height: 450px; background: radial-gradient(circle, #9d4edd, transparent 70%); top: 50%; left: 50%; }

    /* CRT Scanlines and Heavy Vignette */
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

    /* TOP CYBER HUD TELEMETRY BAR */
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
      color: rgba(255, 255, 255, 0.65);
      z-index: 100;
      pointer-events: auto;
    }
    .hud-left, .hud-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .hud-chip {
      background: rgba(10, 11, 22, 0.8);
      border: 1px solid rgba(224, 17, 95, 0.4);
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
    .audio-toggle-btn {
      cursor: pointer;
      background: rgba(224, 17, 95, 0.2);
      border: 1px solid var(--accent);
      color: #fff;
      padding: 6px 14px;
      border-radius: 99px;
      font-size: 10.5px;
      font-family: 'JetBrains Mono', monospace;
      letter-spacing: 1.5px;
      transition: all 0.2s ease;
      box-shadow: 0 0 15px rgba(224, 17, 95, 0.35);
    }
    .audio-toggle-btn:hover {
      background: var(--accent);
      box-shadow: 0 0 25px var(--accent-glow);
    }

    /* 3D SCENE STAGE */
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
       FUTURISTIC VIP ACCESS TICKET PASS
       ========================================================= */
    .ticket-container {
      position: relative;
      background: var(--ticket-bg);
      backdrop-filter: blur(30px);
      -webkit-backdrop-filter: blur(30px);
      border-radius: 26px;
      display: flex;
      width: 100%;
      max-width: 820px;
      border: 1px solid rgba(224, 17, 95, 0.55);
      box-shadow: 
        0 30px 80px rgba(0, 0, 0, 0.95),
        0 0 60px rgba(224, 17, 95, 0.4),
        inset 0 0 40px rgba(224, 17, 95, 0.12);
      overflow: hidden;
      transform-style: preserve-3d;
    }

    /* Guilloche Security Wave Lines Overlay */
    .guilloche-bg {
      position: absolute;
      inset: 0;
      opacity: 0.08;
      pointer-events: none;
      z-index: 1;
      background-image: radial-gradient(circle at 50% 50%, rgba(255, 42, 122, 0.5) 1px, transparent 1px),
                        radial-gradient(circle at 20% 30%, rgba(0, 242, 254, 0.5) 1px, transparent 1px);
      background-size: 24px 24px, 18px 18px;
    }

    /* Holographic rainbow foil across ticket */
    .holo-foil-overlay {
      position: absolute;
      inset: 0;
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

    /* Scanning Cyan-Pink Laser Beam */
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

    /* Physical ticket perforation cut-out notches */
    .notch-top {
      position: absolute;
      top: -20px;
      right: 218px;
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
      right: 218px;
      width: 40px;
      height: 40px;
      background: var(--bg);
      border-radius: 50%;
      border-top: 1.5px solid rgba(224, 17, 95, 0.6);
      z-index: 10;
      box-shadow: inset 0 8px 14px rgba(0, 0, 0, 0.85);
    }

    /* Perforated divider glow line with dots */
    .perforation-divider {
      position: absolute;
      top: 0;
      bottom: 0;
      right: 237px;
      width: 2px;
      border-right: 2px dashed rgba(224, 17, 95, 0.55);
      z-index: 9;
      pointer-events: none;
    }

    /* ---------------------------------------------------------
       MAIN TICKET BODY (Left Section)
       --------------------------------------------------------- */
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

    .ticket-brand {
      display: flex;
      flex-direction: column;
      gap: 4px;
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

    .badge-wrap {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
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
    .pass-type-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      letter-spacing: 2px;
      color: #64748b;
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

    /* Redeem Command snippet */
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
    .cmd-box:hover {
      border-color: #00f2fe;
    }
    .cmd-prefix {
      color: #64748b;
      font-size: 10.5px;
      letter-spacing: 1.5px;
    }

    /* Cyber Action Button */
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

    /* Security microprint row */
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

    /* ---------------------------------------------------------
       PERFORATED TEAR-OFF STUB (Right Section)
       --------------------------------------------------------- */
    .ticket-stub {
      width: 238px;
      padding: 38px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      position: relative;
      background: rgba(8, 9, 16, 0.75);
      z-index: 5;
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

    /* Holographic VIP Stamp Badge */
    .holo-seal {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      border: 2px dashed #ffd700;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle, rgba(255, 215, 0, 0.2), transparent 70%);
      box-shadow: 0 0 25px rgba(255, 215, 0, 0.4);
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

    /* High-tech Barcode */
    .barcode-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      width: 100%;
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
    .holo-companion-card:hover .companion-img-frame img {
      transform: scale(1.06);
    }
    .companion-img-frame::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(rgba(0, 242, 254, 0.08) 50%, rgba(224, 17, 95, 0.08) 50%);
      background-size: 100% 4px;
      pointer-events: none;
    }

    /* Cyber Dialogue Speech Bubble */
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
    .companion-caption span {
      color: #ff2a7a;
      font-weight: 800;
    }

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
      .ticket-stub { width: 100%; border-left: none; border-top: 2px dashed rgba(224, 17, 95, 0.45); }
      .perforation-divider { display: none; }
      .notch-top, .notch-bottom { display: none; }
      .holo-companion-card { width: 100%; max-width: 420px; }
    }
  </style>
</head>
<body>
  <!-- Fullscreen Canvas Layers -->
  <canvas id="warp-canvas"></canvas>
  <div class="cyber-grid-floor"></div>
  <div class="cyber-grid-ceiling"></div>

  <!-- Giant 3D Holographic Gyro Rings Behind Card -->
  <div class="hologram-rings">
    <div class="gyro-ring"></div>
    <div class="gyro-ring"></div>
    <div class="gyro-ring"></div>
  </div>

  <!-- Dynamic Ambient Lighting Orbs -->
  <div class="ambient-orb" id="orb1"></div>
  <div class="ambient-orb" id="orb2"></div>
  <div class="ambient-orb" id="orb3"></div>

  <!-- Scanlines + CRT Vignette -->
  <div class="scanlines"></div>
  <div class="vignette"></div>

  <canvas id="matrix-canvas"></canvas>
  <canvas id="particles-canvas"></canvas>
  <canvas id="cursor-trail-canvas"></canvas>
  <canvas id="confetti-canvas"></canvas>

  <div class="custom-cursor" id="customCursor"></div>
  <div class="custom-cursor-dot" id="customCursorDot"></div>

  <!-- Top Cyber HUD Telemetry Bar -->
  <div class="cyber-hud-top">
    <div class="hud-left">
      <div class="hud-chip">
        <div class="hud-dot"></div>
        <span>SECURITY: LINKVERTISE ANTI-BYPASS</span>
      </div>
      <div class="hud-chip">
        <span id="liveClock">TIME: --:--:-- UTC</span>
      </div>
    </div>
    <div class="hud-right">
      <div class="hud-chip">
        <span>FPS: <span id="fpsCounter" style="color:#00f2fe">60</span></span>
      </div>
      <button class="audio-toggle-btn" id="audioToggle">SFX: ON</button>
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
            <div class="pass-type-tag">UNRESTRICTED ACCESS</div>
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

        <!-- High-Gloss Cyber Button -->
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

      <!-- Perforated Tear-off Stub -->
      <div class="ticket-stub">
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

        <!-- Stub Telemetry -->
        <div class="stub-meta">
          <div>NODE: CLOUD-MAIN</div>
          <div>GATE: DISCORD-BOT</div>
          <div>SEAT: 001-ALPHA</div>
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
    // SYNTHESIZED AUDIO (Pure Web Audio API - Zero External Dependencies)
    let sfxEnabled = true;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null;

    function getAudioCtx() {
      if (!audioCtx && AudioCtx) audioCtx = new AudioCtx();
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    }

    function playBeep(freq = 800, type = 'sine', duration = 0.08) {
      if (!sfxEnabled) return;
      try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch (e) {}
    }

    function playVictoryChirp() {
      if (!sfxEnabled) return;
      try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const now = ctx.currentTime;
        // Rising frequency laser
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.28);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);

        // Sub bass drop
        const sub = ctx.createOscillator();
        const subGain = ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(130, now);
        sub.frequency.exponentialRampToValueAtTime(45, now + 0.45);
        subGain.gain.setValueAtTime(0.2, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        sub.connect(subGain);
        subGain.connect(ctx.destination);
        sub.start(now);
        sub.stop(now + 0.45);
      } catch (e) {}
    }

    document.getElementById('audioToggle').addEventListener('click', () => {
      sfxEnabled = !sfxEnabled;
      document.getElementById('audioToggle').innerText = sfxEnabled ? 'SFX: ON' : 'SFX: MUTED';
      playBeep(sfxEnabled ? 900 : 350, 'sine', 0.1);
    });

    // TEXT SCRAMBLE / DECRYPTION REVEAL
    const finalKey = ${JSON.stringify(key)};
    const keyEl = document.getElementById('keyDisplay');
    const scrambleChars = '0123456789ABCDEF!#@%&*?';
    let frame = 0;
    const totalFrames = 30;
    function scrambleKey() {
      if (frame < totalFrames) {
        let output = '';
        for (let i = 0; i < finalKey.length; i++) {
          if (finalKey[i] === '-') {
            output += '-';
          } else if (frame / totalFrames > i / finalKey.length) {
            output += finalKey[i];
          } else {
            output += scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
          }
        }
        keyEl.innerText = output;
        if (frame % 3 === 0) playBeep(500 + frame * 20, 'triangle', 0.04);
        frame++;
        requestAnimationFrame(scrambleKey);
      } else {
        keyEl.innerText = finalKey;
        playBeep(1200, 'sine', 0.15);
      }
    }
    setTimeout(scrambleKey, 350);

    // 3D PARALLAX MOUSE TRACKING & HOLOGRAPHIC REFLECTION
    const scene = document.getElementById('sceneWrapper');
    const cursor = document.getElementById('customCursor');
    const cursorDot = document.getElementById('customCursorDot');
    const holoFoil = document.getElementById('holoFoil');
    const orb1 = document.getElementById('orb1');
    const orb2 = document.getElementById('orb2');
    const orb3 = document.getElementById('orb3');

    document.addEventListener('mousemove', (e) => {
      const { clientX: x, clientY: y } = e;
      const { innerWidth: w, innerHeight: h } = window;

      cursor.style.left = x + 'px';
      cursor.style.top = y + 'px';
      cursorDot.style.left = x + 'px';
      cursorDot.style.top = y + 'px';

      const normX = (x - w / 2) / (w / 2);
      const normY = (y - h / 2) / (h / 2);
      scene.style.transform = 'rotateY(' + (normX * 18) + 'deg) rotateX(' + (-normY * 18) + 'deg)';

      // Shift holographic foil angle based on viewing angle
      const holoAngle = 135 + normX * 45;
      holoFoil.style.setProperty('--holo-angle', holoAngle + 'deg');

      orb1.style.transform = 'translate(' + (x - 300) + 'px, ' + (y - 300) + 'px)';
      orb2.style.transform = 'translate(' + (w - x - 275) + 'px, ' + (h - y - 275) + 'px)';
      orb3.style.transform = 'translate(' + (x / 2 - 225) + 'px, ' + (y / 2 - 225) + 'px)';
    });

    // Expand cursor over interactive elements
    document.querySelectorAll('button, .key-box-3d, .cmd-box, .holo-companion-card').forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.style.width = '55px';
        cursor.style.height = '55px';
        cursor.style.borderColor = '#00f2fe';
        cursor.style.boxShadow = '0 0 25px #00f2fe';
        playBeep(1000, 'sine', 0.03);
      });
      el.addEventListener('mouseleave', () => {
        cursor.style.width = '32px';
        cursor.style.height = '32px';
        cursor.style.borderColor = '#ff2a7a';
        cursor.style.boxShadow = '0 0 20px rgba(224, 17, 95, 0.8)';
      });
    });

    // ANIME COMPANION DIALOGUE & INTERACTIVITY
    const quotes = [
      "Here's your VIP key, baka!",
      "Don't lose it! It expires in 7 days.",
      "Run .redeem in Discord to activate right now!",
      "MommyDeob v2 is watching your scripts...",
      "Deobfuscations, gets, and bypasses unlocked!",
      "You actually completed the checkpoint? Good boy."
    ];
    let quoteIdx = 0;
    const companion = document.getElementById('holoCompanion');
    const dialogue = document.getElementById('companionDialogue');

    companion.addEventListener('click', () => {
      quoteIdx = (quoteIdx + 1) % quotes.length;
      dialogue.innerText = quotes[quoteIdx];
      playBeep(1350, 'triangle', 0.12);
      explodeSparks(window.innerWidth / 2, window.innerHeight / 2);
    });

    // LIVE UTC CLOCK
    function updateClock() {
      const now = new Date();
      const hrs = String(now.getUTCHours()).padStart(2, '0');
      const min = String(now.getUTCMinutes()).padStart(2, '0');
      const sec = String(now.getUTCSeconds()).padStart(2, '0');
      document.getElementById('liveClock').innerText = 'TIME: ' + hrs + ':' + min + ':' + sec + ' UTC';
    }
    setInterval(updateClock, 1000);
    updateClock();

    // LIVE FPS COUNTER
    let lastTime = performance.now();
    let frameCount = 0;
    function countFPS(time) {
      frameCount++;
      if (time - lastTime >= 1000) {
        document.getElementById('fpsCounter').innerText = frameCount;
        frameCount = 0;
        lastTime = time;
      }
      requestAnimationFrame(countFPS);
    }
    requestAnimationFrame(countFPS);

    // WARP SPEED STARFIELD
    const wCanvas = document.getElementById('warp-canvas');
    const wCtx = wCanvas.getContext('2d');
    function resizeWarp() { wCanvas.width = window.innerWidth; wCanvas.height = window.innerHeight; }
    window.addEventListener('resize', resizeWarp);
    resizeWarp();

    const stars = Array.from({ length: 280 }, () => ({
      x: (Math.random() - 0.5) * window.innerWidth * 2,
      y: (Math.random() - 0.5) * window.innerHeight * 2,
      z: Math.random() * window.innerWidth
    }));

    function renderWarp() {
      wCtx.fillStyle = 'rgba(2, 2, 5, 0.25)';
      wCtx.fillRect(0, 0, wCanvas.width, wCanvas.height);
      const cx = wCanvas.width / 2;
      const cy = wCanvas.height / 2;

      for (const s of stars) {
        s.z -= 7;
        if (s.z <= 0) {
          s.z = wCanvas.width;
          s.x = (Math.random() - 0.5) * wCanvas.width * 2;
          s.y = (Math.random() - 0.5) * wCanvas.height * 2;
        }
        const k = 250 / s.z;
        const px = s.x * k + cx;
        const py = s.y * k + cy;

        if (px >= 0 && px < wCanvas.width && py >= 0 && py < wCanvas.height) {
          const size = Math.max(1, (1 - s.z / wCanvas.width) * 3);
          wCtx.beginPath();
          wCtx.arc(px, py, size, 0, Math.PI * 2);
          wCtx.fillStyle = '#ff2a7a';
          wCtx.shadowBlur = 6;
          wCtx.shadowColor = '#00f2fe';
          wCtx.fill();
        }
      }
      requestAnimationFrame(renderWarp);
    }
    renderWarp();

    // MATRIX RAIN CANVAS
    const mCanvas = document.getElementById('matrix-canvas');
    const mCtx = mCanvas.getContext('2d');
    function resizeMatrix() { mCanvas.width = window.innerWidth; mCanvas.height = window.innerHeight; }
    window.addEventListener('resize', resizeMatrix);
    resizeMatrix();

    const chars = '0123456789ABCDEFMOMMYDEOBΨλπΣΩ01';
    const cols = Math.floor(mCanvas.width / 16);
    const drops = Array(cols).fill(1);

    function drawMatrix() {
      mCtx.fillStyle = 'rgba(2, 2, 5, 0.08)';
      mCtx.fillRect(0, 0, mCanvas.width, mCanvas.height);
      mCtx.fillStyle = 'rgba(255, 42, 122, 0.7)';
      mCtx.font = '13px \"JetBrains Mono\"';

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        mCtx.fillText(text, i * 16, drops[i] * 16);
        if (drops[i] * 16 > mCanvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      requestAnimationFrame(drawMatrix);
    }
    drawMatrix();

    // CONFETTI AND SPARKS
    const cCanvas = document.getElementById('confetti-canvas');
    const cCtx = cCanvas.getContext('2d');
    function resizeConfetti() { cCanvas.width = window.innerWidth; cCanvas.height = window.innerHeight; }
    window.addEventListener('resize', resizeConfetti);
    resizeConfetti();

    let sparks = [];
    function explodeSparks(originX, originY) {
      const colors = ['#e0115f', '#ff2a7a', '#00f2fe', '#ffffff', '#ffd700', '#9d4edd'];
      for (let i = 0; i < 120; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 24 + 6;
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

    // COPY REDEEM COMMAND
    function copyRedeem(e) {
      const text = ${JSON.stringify(redeemCommand)};
      const btn = document.getElementById('copyBtn');

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
        playVictoryChirp();
        const label = document.getElementById('btnLabel');
        label.innerText = 'COPIED TO CLIPBOARD!';
        explodeSparks(window.innerWidth / 2, window.innerHeight / 2);

        document.body.style.filter = 'brightness(1.4)';
        setTimeout(() => { document.body.style.filter = 'none'; }, 160);

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

module.exports = { renderCrazyKeyPage };
