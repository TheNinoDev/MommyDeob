function getTicketScripts(key, redeemCommand) {
  return `
    // SYNTHESIZED WEB AUDIO ENGINE
    let sfxEnabled = true;
    let bgmEnabled = false;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null;
    let bgmInterval = null;

    function getAudioCtx() {
      if (!audioCtx && AudioCtx) audioCtx = new AudioCtx();
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    }

    function playBeep(freq = 800, type = 'sine', duration = 0.08, vol = 0.08) {
      if (!sfxEnabled) return;
      try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch (e) {}
    }

    function playLaserZap() {
      if (!sfxEnabled) return;
      try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
      } catch (e) {}
    }

    function playMagneticDock() {
      if (!sfxEnabled) return;
      try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(450, now + 0.12);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } catch (e) {}
    }

    function playVictoryChirp() {
      if (!sfxEnabled) return;
      try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const now = ctx.currentTime;
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

        const sub = ctx.createOscillator();
        const subGain = ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(130, now);
        sub.frequency.exponentialRampToValueAtTime(45, now + 0.45);
        subGain.gain.setValueAtTime(0.22, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        sub.connect(subGain);
        subGain.connect(ctx.destination);
        sub.start(now);
        sub.stop(now + 0.45);
      } catch (e) {}
    }

    // PROCEDURAL SYNTHWAVE BGM ARPEGGIATOR
    const synthNotes = [220, 261.63, 329.63, 392, 440, 523.25, 659.25, 783.99];
    let noteStep = 0;
    function startBgm() {
      if (bgmInterval) clearInterval(bgmInterval);
      bgmInterval = setInterval(() => {
        if (!bgmEnabled) return;
        const ctx = getAudioCtx();
        if (!ctx) return;
        const freq = synthNotes[noteStep % synthNotes.length];
        noteStep++;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1600, ctx.currentTime);
        gain.gain.setValueAtTime(0.035, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.16);

        // Animate Equalizer bars
        const eqBars = document.querySelectorAll('.eq-bar');
        eqBars.forEach(b => {
          b.style.height = (Math.random() * 12 + 3) + 'px';
        });
      }, 160);
    }

    document.getElementById('audioToggle').addEventListener('click', () => {
      sfxEnabled = !sfxEnabled;
      document.getElementById('audioToggle').innerText = sfxEnabled ? 'SFX: ON' : 'SFX: MUTED';
      playBeep(sfxEnabled ? 900 : 350, 'sine', 0.1);
    });

    document.getElementById('bgmToggle').addEventListener('click', () => {
      bgmEnabled = !bgmEnabled;
      const btn = document.getElementById('bgmToggle');
      if (bgmEnabled) {
        btn.classList.add('active');
        btn.innerText = 'BGM: ON ♫';
        startBgm();
      } else {
        btn.classList.remove('active');
        btn.innerText = 'BGM: OFF';
        if (bgmInterval) clearInterval(bgmInterval);
        document.querySelectorAll('.eq-bar').forEach(b => b.style.height = '4px');
      }
      playBeep(850, 'triangle', 0.08);
    });

    // HYPERDRIVE WARP MODE TOGGLE
    let hyperdrive = false;
    document.getElementById('hyperToggle').addEventListener('click', () => {
      hyperdrive = !hyperdrive;
      const btn = document.getElementById('hyperToggle');
      if (hyperdrive) {
        btn.classList.add('active');
        btn.innerText = 'WARP: MAXIMUM';
        document.body.classList.add('hyperdrive');
        playLaserZap();
      } else {
        btn.classList.remove('active');
        btn.innerText = 'WARP: NORMAL';
        document.body.classList.remove('hyperdrive');
        playBeep(400, 'sine', 0.1);
      }
    });

    // INTERACTIVE TICKET TEAR PHYSICS
    const stub = document.getElementById('ticketStub');
    let isTorn = false;
    stub.addEventListener('click', (e) => {
      isTorn = !isTorn;
      if (isTorn) {
        stub.classList.add('torn');
        playLaserZap();
        explodeSparks(e.clientX, e.clientY);
      } else {
        stub.classList.remove('torn');
        playMagneticDock();
        explodeSparks(e.clientX, e.clientY);
      }
    });

    // CLICK SHOCKWAVE CANVAS
    const sCanvas = document.getElementById('shockwave-canvas');
    const sCtx = sCanvas.getContext('2d');
    function resizeShockwave() { sCanvas.width = window.innerWidth; sCanvas.height = window.innerHeight; }
    window.addEventListener('resize', resizeShockwave);
    resizeShockwave();

    let shockwaves = [];
    document.addEventListener('click', (e) => {
      shockwaves.push({
        x: e.clientX,
        y: e.clientY,
        radius: 10,
        maxRadius: 180,
        alpha: 0.8,
        color: Math.random() > 0.5 ? '#ff2a7a' : '#00f2fe'
      });
    });

    function renderShockwaves() {
      sCtx.clearRect(0, 0, sCanvas.width, sCanvas.height);
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sCtx.beginPath();
        sCtx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        sCtx.strokeStyle = sw.color;
        sCtx.globalAlpha = sw.alpha;
        sCtx.lineWidth = 2.5;
        sCtx.shadowBlur = 12;
        sCtx.shadowColor = sw.color;
        sCtx.stroke();

        sw.radius += 9;
        sw.alpha -= 0.035;
        if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) shockwaves.splice(i, 1);
      }
      requestAnimationFrame(renderShockwaves);
    }
    renderShockwaves();

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

      const holoAngle = 135 + normX * 45;
      holoFoil.style.setProperty('--holo-angle', holoAngle + 'deg');

      orb1.style.transform = 'translate(' + (x - 300) + 'px, ' + (y - 300) + 'px)';
      orb2.style.transform = 'translate(' + (w - x - 275) + 'px, ' + (h - y - 275) + 'px)';
      orb3.style.transform = 'translate(' + (x / 2 - 225) + 'px, ' + (y / 2 - 225) + 'px)';
    });

    document.querySelectorAll('button, .key-box-3d, .cmd-box, .holo-companion-card, .ticket-stub').forEach(el => {
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

    // ANIME COMPANION DIALOGUES
    const quotes = [
      "Here's your VIP key, baka!",
      "Don't lose it! It expires in 7 days.",
      "Run .redeem in Discord to activate right now!",
      "MommyDeob v2 is watching your scripts...",
      "Deobfuscations, gets, and bypasses unlocked!",
      "You actually completed the checkpoint? Good boy.",
      "Click my pod anytime if you're lonely, skid!"
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

    const stars = Array.from({ length: 300 }, () => ({
      x: (Math.random() - 0.5) * window.innerWidth * 2,
      y: (Math.random() - 0.5) * window.innerHeight * 2,
      z: Math.random() * window.innerWidth
    }));

    function renderWarp() {
      wCtx.fillStyle = hyperdrive ? 'rgba(2, 2, 5, 0.12)' : 'rgba(2, 2, 5, 0.25)';
      wCtx.fillRect(0, 0, wCanvas.width, wCanvas.height);
      const cx = wCanvas.width / 2;
      const cy = wCanvas.height / 2;
      const speed = hyperdrive ? 26 : 7;

      for (const s of stars) {
        s.z -= speed;
        if (s.z <= 0) {
          s.z = wCanvas.width;
          s.x = (Math.random() - 0.5) * wCanvas.width * 2;
          s.y = (Math.random() - 0.5) * wCanvas.height * 2;
        }
        const k = 250 / s.z;
        const px = s.x * k + cx;
        const py = s.y * k + cy;

        if (px >= 0 && px < wCanvas.width && py >= 0 && py < wCanvas.height) {
          const size = Math.max(1, (1 - s.z / wCanvas.width) * (hyperdrive ? 5 : 3));
          wCtx.beginPath();
          wCtx.arc(px, py, size, 0, Math.PI * 2);
          wCtx.fillStyle = hyperdrive ? '#00f2fe' : '#ff2a7a';
          wCtx.shadowBlur = hyperdrive ? 12 : 6;
          wCtx.shadowColor = hyperdrive ? '#ff2a7a' : '#00f2fe';
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

    // CONFETTI AND SPARKS BURST
    const cCanvas = document.getElementById('confetti-canvas');
    const cCtx = cCanvas.getContext('2d');
    function resizeConfetti() { cCanvas.width = window.innerWidth; cCanvas.height = window.innerHeight; }
    window.addEventListener('resize', resizeConfetti);
    resizeConfetti();

    let sparks = [];
    function explodeSparks(originX, originY) {
      const colors = ['#e0115f', '#ff2a7a', '#00f2fe', '#ffffff', '#ffd700', '#9d4edd'];
      for (let i = 0; i < 130; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 25 + 6;
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
        setTimeout(() => { document.body.style.filter = ''; }, 160);

        setTimeout(() => {
          label.innerText = 'Copy Redeem Command';
        }, 3000);
      }).catch(() => {
        prompt('Copy command manually:', text);
      });
    }
  `;
}

module.exports = { getTicketScripts };
