/* =====================================================================
   HOME PAGE BACKGROUND: PURE ANIMATION (walang larawan; lahat ay iginuguhit ng script na ito)

   Ang eksena: umaga sa ibabaw ng malinaw na tubig.
     LANGIT:   malambot na gradient, araw sa kanang taas, mga ulap na dahan-dahang dumadaan,
               bokeh (malalambot na bilog na liwanag), mga bula, at mga dahon na lumilipad.
     TUBIG:    apat na patong ng alon na gumagalaw, kumikislap na tubig, mga lily pad
               (may isang lotus) na umuugoy, at mga ripple.
     MGA EVENT: pana-panahong PATAK na bumabagsak sa tubig (may ripple at talsik), at
               paminsan-minsan, TUMATALON NA ISDA mula sa tubig.
     INTERACTIVE:
               - Kapag nag-click o nag-tap sa kahit saan, may ripple.
               - Kapag ginalaw ang mouse sa ibabaw ng tubig, may ripple sa dinaanan.
               - Bahagyang gumagalaw ang mga patong (parallax) ayon sa mouse para may lalim.

   Magaan ito: iisang canvas, naka-render na sprite para sa ulap at bokeh, walang blur o shadow filter,
   at humihinto kapag nakatago ang tab.
   Kapag naka-on ang "reduce motion" sa device ng user, isang still na larawan lang ng eksena ang ilalabas.
   ===================================================================== */
(function () {
  "use strict";

  var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  // ----- SETTINGS (pwedeng baguhin) -----
  var SETTINGS = {
    speed: 1,                   // 1 = normal. 0.5 = kalahati ang bilis, 2 = doble
    dropEverySec: [3.5, 6],     // gaano kadalas ang patak (min, max na segundo)
    fishEverySec: [9, 16],      // gaano kadalas ang talon ng isda
    cloudCount: 7,
    flockEverySec: [9, 16],     // gaano kadalas dumaan ang mga ibon (min, max na segundo)
    windEverySec: [2.5, 5],       // gaano kadalas ang hangin (whoosh)
    orbCount: 14,               // bokeh
    sparkleCount: 16,           // kislap sa tubig
    glintCount: 70,             // maliliit na guhit ng liwanag sa tubig
    bubbleCount: 6,
    leafCount: 5,
    padCount: 5,                // lily pad
    clickRipples: true,         // ripple kapag nag-click/tap
    pointerRipples: true,       // ripple kapag dinadaanan ng mouse ang tubig
    parallax: true              // galaw ng mga patong ayon sa mouse
  };

  var HORIZON = 0.74;           // saan nagsisimula ang tubig (porsyento ng taas ng screen)

  var canvas = document.createElement("canvas");
  canvas.className = "home-bg-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var dpr = 1, W = 0, H = 0, U = 1, HZ = 0;
  var staticBg = null;           // naka-render na langit at tubig (hindi na kailangang iguhit ulit bawat frame)

  function rand(a, b) { return a + Math.random() * (b - a); }
  function easeOut(p) { return 1 - Math.pow(1 - p, 3); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  var clouds = [], orbs = [], sparkles = [], glints = [], bubbles = [], leaves = [], pads = [];
  var rings = [], spray = [], drops = [], fish = null;
  var nextDrop = 1.0, nextFish = 4.5;
  var birds = [], whooshes = [], nextFlock = 1.5, nextWind = 2.5, gust = 0;   // gust: lakas ng hihip ng hangin (0 hanggang 1)
  var mx = 0, my = 0, tmx = 0, tmy = 0;   // mouse (parallax)

  // =====================================================================
  // STATIC NA LAYER: langit, araw, tubig
  // =====================================================================
  function buildStatic() {
    var c = document.createElement("canvas");
    c.width = Math.round(W * dpr);
    c.height = Math.round(H * dpr);
    var g = c.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Langit
    var sky = g.createLinearGradient(0, 0, 0, HZ);
    sky.addColorStop(0, "#3a9fc4");      // taas: kapareho ng langit sa Interactive at About page
    sky.addColorStop(0.5, "#76c7df");    // gitna (nasa likod ng heading): sapat na liwanag para mabasa ang navy na text
    sky.addColorStop(1, "#bfe8f3");      // malapit sa tubig: maliwanag at malabo (haze)
    g.fillStyle = sky;
    g.fillRect(0, 0, W, HZ + 1);

    // Tubig
    var water = g.createLinearGradient(0, HZ, 0, H);
    water.addColorStop(0, "#92d9ea");
    water.addColorStop(0.5, "#4fb4d2");
    water.addColorStop(1, "#2a8fb5");
    g.fillStyle = water;
    g.fillRect(0, HZ, W, H - HZ);

    // Araw: malaking malambot na liwanag sa kanang taas
    var sx = W * 0.82, sy = H * 0.15;
    var glow = g.createRadialGradient(sx, sy, 0, sx, sy, W * 0.5);
    glow.addColorStop(0, "rgba(255,255,255,0.85)");
    glow.addColorStop(0.18, "rgba(255,255,255,0.42)");
    glow.addColorStop(0.5, "rgba(255,255,255,0.10)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = glow;
    g.fillRect(0, 0, W, HZ + 1);

    var disc = g.createRadialGradient(sx, sy, 0, sx, sy, 46 * U);
    disc.addColorStop(0, "rgba(255,255,255,1)");
    disc.addColorStop(0.6, "rgba(255,255,255,0.9)");
    disc.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = disc;
    g.beginPath(); g.arc(sx, sy, 46 * U, 0, Math.PI * 2); g.fill();

    // Maliwanag na haze sa linya ng tubig at langit
    var haze = g.createLinearGradient(0, HZ - H * 0.09, 0, HZ + H * 0.07);
    haze.addColorStop(0, "rgba(255,255,255,0)");
    haze.addColorStop(0.5, "rgba(255,255,255,0.5)");
    haze.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = haze;
    g.fillRect(0, HZ - H * 0.09, W, H * 0.16);

    // Repleksyon ng araw sa tubig
    var refl = g.createLinearGradient(sx - W * 0.09, 0, sx + W * 0.09, 0);
    refl.addColorStop(0, "rgba(255,255,255,0)");
    refl.addColorStop(0.5, "rgba(255,255,255,0.32)");
    refl.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = refl;
    g.fillRect(sx - W * 0.09, HZ, W * 0.18, H - HZ);

    staticBg = c;
  }

  // =====================================================================
  // ULAP at BOKEH (naka-render na sprite)
  // =====================================================================
  // Ulap na may lalim: maputi sa taas, bahagyang mala-bughaw sa ilalim (parang may anino)
  function makeCloudSprite(w, h) {
    var c = document.createElement("canvas");
    c.width = Math.ceil(w); c.height = Math.ceil(h);
    var g = c.getContext("2d");
    var blobs = 9;
    for (var i = 0; i < blobs; i++) {
      var t = i / (blobs - 1);
      var bump = 1 - Math.pow(Math.abs(t - 0.5) * 2, 1.6) * 0.75;   // mas malaki sa gitna
      var r = h * 0.5 * bump * rand(0.75, 1);
      var x = w * (0.12 + 0.76 * t);
      var y = h * (0.62 - 0.22 * bump * rand(0.6, 1));
      var gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, "rgba(255,255,255,0.95)");
      gr.addColorStop(0.65, "rgba(255,255,255,0.85)");
      gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    // Anino sa ilalim ng ulap
    g.globalCompositeOperation = "source-atop";
    var shade = g.createLinearGradient(0, h * 0.35, 0, h * 0.85);
    shade.addColorStop(0, "rgba(150,195,225,0)");
    shade.addColorStop(1, "rgba(130,180,215,0.55)");
    g.fillStyle = shade;
    g.fillRect(0, 0, w, h);
    return c;
  }

  function makeCloud(anywhere) {
    var d = Math.random();                      // 0 = malayo (maliit, mabagal), 1 = malapit (malaki, mas mabilis)
    var w = (180 + 300 * d) * U, h = w * rand(0.34, 0.44);
    return {
      d: d, w: w, h: h,
      x: anywhere ? rand(-w, W) : -w,
      y: H * (0.07 + 0.36 * (1 - d)) + rand(-12, 12),
      vx: 3 + 10 * d,
      sprite: makeCloudSprite(w, h),
      alpha: 0.5 + 0.4 * d
    };
  }

  var BOKEH_COLORS = ["255,255,255", "190,236,247", "150,220,238", "200,245,225"];
  function makeBokehSprite(r, color) {
    var c = document.createElement("canvas");
    var size = Math.ceil(r * 2 + 4);
    c.width = c.height = size;
    var g = c.getContext("2d");
    var cx = size / 2;
    var grad = g.createRadialGradient(cx, cx, r * 0.1, cx, cx, r);
    grad.addColorStop(0, "rgba(" + color + ",0.10)");
    grad.addColorStop(0.75, "rgba(" + color + ",0.20)");
    grad.addColorStop(0.93, "rgba(" + color + ",0.45)");   // gilid na mas maliwanag, parang bokeh
    grad.addColorStop(1, "rgba(" + color + ",0)");
    g.fillStyle = grad;
    g.beginPath(); g.arc(cx, cx, r, 0, Math.PI * 2); g.fill();
    return c;
  }

  function makeOrb(anywhere) {
    var r = rand(14, 56) * U;
    return {
      x: rand(0, W), y: anywhere ? rand(0, HZ) : HZ + r,
      r: r, vy: rand(5, 15),
      sway: rand(10, 36), swaySpeed: rand(0.15, 0.4), phase: rand(0, 6.28),
      tw: rand(0.3, 0.8), baseAlpha: rand(0.55, 1),
      sprite: makeBokehSprite(r, pick(BOKEH_COLORS))
    };
  }

  // =====================================================================
  // IBA PANG ELEMENTO
  // =====================================================================
  function makeSparkle() {
    return { x: rand(0.02, 0.98) * W, y: HZ + rand(0.03, 0.95) * (H - HZ), size: rand(5, 10) * U, speed: rand(0.6, 1.6), phase: rand(0, 6.28) };
  }

  function makeGlint() {
    var depth = Math.random();                   // 0 = malapit sa horizon, 1 = pinakamalapit sa manonood
    return {
      x: rand(0, W), y: HZ + 6 + depth * (H - HZ - 8),
      len: (6 + depth * 26) * U * rand(0.7, 1.2),
      speed: rand(0.5, 1.4), phase: rand(0, 6.28), drift: rand(3, 9) * (0.4 + depth)
    };
  }

  function makeBubble(anywhere) {
    return {
      x: rand(0.05, 0.95) * W, y: anywhere ? rand(H * 0.1, H) : H + 10,
      r: rand(3, 8) * U, rise: rand(20, 42),
      sway: rand(6, 18), swaySpeed: rand(0.6, 1.4), phase: rand(0, 6.28)
    };
  }

  function makeLeaf(anywhere) {
    return {
      x: rand(-0.05, 1.05) * W, y: anywhere ? rand(0, H * 0.8) : -rand(20, 120),
      vy: rand(16, 30), vx: rand(6, 16),
      size: rand(20, 30) * U,
      rot: rand(0, 6.28), rotSpeed: rand(-0.5, 0.5),
      flip: rand(0, 6.28), flipSpeed: rand(0.5, 1.0),
      sway: rand(14, 34), swaySpeed: rand(0.3, 0.6), phase: rand(0, 6.28),
      shade: rand(0, 1)
    };
  }

  function makePad(i, total) {
    return {
      x: (0.06 + 0.88 * (i + rand(0.1, 0.9)) / total) * W,
      y: HZ + (H - HZ) * rand(0.32, 0.62),
      r: rand(26, 44) * U,
      notch: rand(0, 6.28),
      bob: rand(1.5, 3), bobSpeed: rand(0.6, 1.1), phase: rand(0, 6.28),
      drift: rand(6, 16), driftSpeed: rand(0.08, 0.18),
      lotus: false
    };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    U = Math.max(0.65, Math.min(1.5, W / 1300));
    HZ = H * HORIZON;
    buildStatic();

    var scale = Math.min(1, W / 1200);   // mas konti ang elemento sa phone
    var i;
    clouds = []; for (i = 0; i < Math.max(3, Math.round(SETTINGS.cloudCount * scale)); i++) clouds.push(makeCloud(true));
    clouds.sort(function (a, b) { return a.d - b.d; });   // malalayo muna ang iguguhit, saka ang malalapit
    orbs = []; for (i = 0; i < Math.max(6, Math.round(SETTINGS.orbCount * scale)); i++) orbs.push(makeOrb(true));
    sparkles = []; for (i = 0; i < Math.max(6, Math.round(SETTINGS.sparkleCount * scale)); i++) sparkles.push(makeSparkle());
    glints = []; for (i = 0; i < Math.max(24, Math.round(SETTINGS.glintCount * scale)); i++) glints.push(makeGlint());
    bubbles = []; for (i = 0; i < Math.max(3, Math.round(SETTINGS.bubbleCount * scale)); i++) bubbles.push(makeBubble(true));
    leaves = []; for (i = 0; i < Math.max(2, Math.round(SETTINGS.leafCount * scale)); i++) leaves.push(makeLeaf(true));
    var padN = Math.max(3, Math.round(SETTINGS.padCount * scale));
    pads = []; for (i = 0; i < padN; i++) pads.push(makePad(i, padN));
    pads[Math.floor(padN / 2)].lotus = true;
    pads[Math.floor(padN / 2)].r *= 1.15;
  }

  // =====================================================================
  // DRAWING
  // =====================================================================
  function parallax(k) { if (SETTINGS.parallax) ctx.translate(mx * k, my * k * 0.6); }

  function drawClouds(dt) {
    // Mas malapit ang ulap = mas malaki ang galaw sa mouse (parallax)
    for (var i = 0; i < clouds.length; i++) {
      var c = clouds[i];
      c.x += c.vx * dt;
      if (c.x > W + 20) { clouds[i] = makeCloud(false); continue; }
      ctx.globalAlpha = c.alpha;
      var k = SETTINGS.parallax ? (4 + 12 * c.d) : 0;
      ctx.drawImage(c.sprite, c.x + mx * k, c.y + my * k * 0.6);
    }
    ctx.globalAlpha = 1;
  }

  function drawOrbs(t, dt) {
    ctx.save(); parallax(6);
    for (var i = 0; i < orbs.length; i++) {
      var o = orbs[i];
      o.y -= o.vy * dt;
      if (o.y < -o.r * 2) { orbs[i] = makeOrb(false); continue; }
      var x = o.x + Math.sin(t * o.swaySpeed + o.phase) * o.sway;
      ctx.globalAlpha = o.baseAlpha * (0.65 + 0.35 * Math.sin(t * o.tw + o.phase));
      ctx.drawImage(o.sprite, x - o.r - 2, o.y - o.r - 2);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Malalapad na kurba ng liwanag sa taas (parang ang swoosh sa lumang background)
  function drawSwooshes(t) {
    ctx.save(); parallax(5);
    for (var s = 0; s < 2; s++) {
      var baseY = H * (0.12 + s * 0.09), amp = H * (0.035 - s * 0.01);
      var k = (Math.PI * 2) / Math.max(W * (0.9 - s * 0.25), 420), thick = H * (0.07 - s * 0.02);
      var endX = W * (0.78 - s * 0.2);
      var gx = ctx.createLinearGradient(0, 0, endX, 0);
      gx.addColorStop(0, "rgba(255,255,255,0.0)");
      gx.addColorStop(0.2, "rgba(255,255,255," + (0.42 - s * 0.1) + ")");
      gx.addColorStop(1, "rgba(255,255,255,0)");
      ctx.beginPath();
      var x, y;
      for (x = 0; x <= endX; x += 10) {
        y = baseY + Math.sin(x * k + t * (0.35 + s * 0.12) + s * 1.7) * amp;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      for (x = endX; x >= 0; x -= 10) {
        y = baseY + thick * (1 - x / endX * 0.6) + Math.sin(x * k + t * (0.35 + s * 0.12) + s * 1.7 + 0.5) * amp;
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = gx;
      ctx.fill();
    }
    ctx.restore();
  }

  function drawGlints(t, dt) {
    ctx.lineCap = "round";
    for (var i = 0; i < glints.length; i++) {
      var g = glints[i];
      g.x += g.drift * dt;
      if (g.x - g.len > W) g.x = -g.len;
      var a = Math.max(0, Math.sin(t * g.speed + g.phase));
      if (a < 0.05) continue;
      ctx.strokeStyle = "rgba(255,255,255," + (0.55 * a) + ")";
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo(g.x + g.len, g.y); ctx.stroke();
    }
  }

  // Apat na patong ng alon
  var WAVES = [
    { base: 0.16, amp: 0.010, len: 0.55, speed: 0.50, off: 0.0, fill: "rgba(255,255,255,0.15)", line: "rgba(255,255,255,0.65)" },
    { base: 0.38, amp: 0.016, len: 0.42, speed: -0.42, off: 1.4, fill: "rgba(130,220,238,0.26)", line: "rgba(255,255,255,0.55)" },
    { base: 0.62, amp: 0.022, len: 0.33, speed: 0.38, off: 2.6, fill: "rgba(45,165,205,0.34)", line: "rgba(255,255,255,0.45)" },
    { base: 0.86, amp: 0.028, len: 0.26, speed: -0.32, off: 3.9, fill: "rgba(20,115,165,0.46)", line: "rgba(255,255,255,0.35)" }
  ];

  function drawWave(t, idx) {
    var w = WAVES[idx];
    var baseY = HZ + (H - HZ) * w.base;
    var amp = H * w.amp;
    var k = (Math.PI * 2) / Math.max(W * w.len, 420);   // may minimum na haba para hindi matulis ang alon sa phone
    ctx.save(); parallax(4 + idx * 4);
    ctx.beginPath();
    ctx.moveTo(-20, H + 2);
    var x, y;
    for (x = -20; x <= W + 20; x += 8) {
      y = baseY + Math.sin(x * k + t * w.speed + w.off) * amp + Math.sin(x * k * 2.3 + t * w.speed * 1.4 + w.off) * amp * 0.35;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W + 20, H + 2);
    ctx.closePath();
    ctx.fillStyle = w.fill;
    ctx.fill();
    // Maliwanag na gilid sa taas ng alon
    ctx.beginPath();
    for (x = -20; x <= W + 20; x += 8) {
      y = baseY + Math.sin(x * k + t * w.speed + w.off) * amp + Math.sin(x * k * 2.3 + t * w.speed * 1.4 + w.off) * amp * 0.35;
      if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = w.line;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
  }

  function drawPads(t) {
    ctx.save(); parallax(14);
    for (var i = 0; i < pads.length; i++) {
      var p = pads[i];
      var x = p.x + Math.sin(t * p.driftSpeed + p.phase) * p.drift;
      var y = p.y + Math.sin(t * p.bobSpeed + p.phase) * p.bob;
      var rx = p.r, ry = p.r * 0.36;
      // Lily pad: berdeng ellipse na may hiwa
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.ellipse(x, y, rx, ry, 0, p.notch, p.notch + Math.PI * 2 - 0.45);
      ctx.closePath();
      var g = ctx.createLinearGradient(0, y - ry, 0, y + ry);
      g.addColorStop(0, "rgba(120,205,140,0.95)");
      g.addColorStop(1, "rgba(52,150,105,0.95)");
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.lineWidth = 1;
      ctx.stroke();
      // Repleksyon sa tubig
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath(); ctx.ellipse(x, y + 2, rx * 1.08, ry * 1.15, 0, 0.1, Math.PI - 0.1); ctx.stroke();

      if (p.lotus) drawLotus(x, y - ry * 0.2, p.r * 0.62, t, p.phase);
    }
    ctx.restore();
  }

  function drawLotus(x, y, size, t, phase) {
    var sway = Math.sin(t * 0.7 + phase) * 0.04;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(sway);
    var layers = [{ n: 5, h: 1, w: 0.2, col: "rgba(236,250,255,0.98)" }, { n: 3, h: 0.78, w: 0.19, col: "rgba(255,255,255,1)" }];
    for (var l = 0; l < layers.length; l++) {
      var L = layers[l];
      for (var i = -Math.floor(L.n / 2); i <= Math.floor(L.n / 2); i++) {
        ctx.save();
        ctx.rotate(i * (0.3 - l * 0.04));
        ctx.beginPath();
        ctx.ellipse(0, -size * L.h * 0.5, size * L.w, size * L.h * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = L.col;
        ctx.fill();
        ctx.strokeStyle = "rgba(110,195,225,0.7)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }
    }
    ctx.fillStyle = "rgba(255,214,102,0.95)";
    ctx.beginPath(); ctx.arc(0, -size * 0.06, size * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // ---------- RIPPLES ----------
  function addRipples(x, y, maxR, count, ratio, life, color) {
    for (var i = 0; i < count; i++) {
      rings.push({ x: x, y: y, maxR: maxR * (1 - i * 0.12), ratio: ratio, t: -i * 0.2, life: life, color: color || "255,255,255" });
    }
    while (rings.length > 40) rings.shift();
  }

  function drawRings(dt) {
    for (var i = rings.length - 1; i >= 0; i--) {
      var r = rings[i];
      r.t += dt;
      if (r.t < 0) continue;
      var p = r.t / r.life;
      if (p >= 1) { rings.splice(i, 1); continue; }
      var e = easeOut(p);
      var rx = r.maxR * e, ry = rx * r.ratio;
      var a = Math.pow(1 - p, 1.6);
      ctx.lineWidth = 1.1 + 2.4 * (1 - p);
      ctx.strokeStyle = "rgba(" + r.color + "," + (0.85 * a) + ")";
      ctx.beginPath(); ctx.ellipse(r.x, r.y, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(25,125,175," + (0.35 * a) + ")";
      ctx.beginPath(); ctx.ellipse(r.x, r.y + 2, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
    }
  }

  function addSpray(x, y, n) {
    for (var k = 0; k < n; k++) {
      var ang = rand(-Math.PI * 0.85, -Math.PI * 0.15);
      var sp = rand(90, 200) * U;
      spray.push({ x: x, y: y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 0, max: rand(0.7, 1.1), r: rand(1.6, 3.4) });
    }
  }

  function drawSpray(dt) {
    for (var j = spray.length - 1; j >= 0; j--) {
      var s = spray[j];
      s.life += dt;
      if (s.life >= s.max) { spray.splice(j, 1); continue; }
      s.vy += H * 1.1 * dt;
      s.x += s.vx * dt; s.y += s.vy * dt;
      var a = 1 - s.life / s.max;
      ctx.fillStyle = "rgba(255,255,255," + (0.9 * a) + ")";
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(40,150,205," + (0.6 * a) + ")";
      ctx.lineWidth = 0.8; ctx.stroke();
    }
  }

  // ---------- PATAK ----------
  function drawDropShape(x, y, w) {
    var h = w * 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y - h * 0.62);
    ctx.bezierCurveTo(x + w * 0.1, y - h * 0.3, x + w * 0.55, y - h * 0.05, x + w * 0.5, y + h * 0.18);
    ctx.bezierCurveTo(x + w * 0.45, y + h * 0.48, x - w * 0.45, y + h * 0.48, x - w * 0.5, y + h * 0.18);
    ctx.bezierCurveTo(x - w * 0.55, y - h * 0.05, x - w * 0.1, y - h * 0.3, x, y - h * 0.62);
    ctx.closePath();
    var g = ctx.createLinearGradient(x - w * 0.5, y - h * 0.5, x + w * 0.5, y + h * 0.5);
    g.addColorStop(0, "rgba(255,255,255,0.95)");
    g.addColorStop(0.5, "rgba(150,220,242,0.9)");
    g.addColorStop(1, "rgba(36,151,184,0.95)");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.beginPath(); ctx.ellipse(x - w * 0.18, y - h * 0.02, w * 0.1, w * 0.18, -0.4, 0, Math.PI * 2); ctx.fill();
  }

  function updateDrops(dt) {
    nextDrop -= dt;
    if (nextDrop <= 0 && drops.length < 2) {
      drops.push({
        x: rand(0.5, 0.92) * W, y: -30, vy: 60,
        landY: HZ + (H - HZ) * rand(0.2, 0.55), size: 46 * U
      });
      nextDrop = rand(SETTINGS.dropEverySec[0], SETTINGS.dropEverySec[1]);
    }
    var g = H * 2.0;
    for (var i = drops.length - 1; i >= 0; i--) {
      var d = drops[i];
      d.vy += g * dt;
      d.y += d.vy * dt;
      if (d.y >= d.landY) {
        addRipples(d.x, d.landY, 300 * U, 4, 0.26, 2.8, "255,255,255");
        addSpray(d.x, d.landY, 9);
        drops.splice(i, 1);
        continue;
      }
      drawDropShape(d.x, d.y, d.size);
    }
  }

  // ---------- ISDANG TUMATALON ----------
  function startFish() {
    var dir = Math.random() < 0.5 ? 1 : -1;
    var span = rand(0.18, 0.3) * W;
    var x0 = rand(0.25, 0.75) * W;
    var y = HZ + (H - HZ) * rand(0.22, 0.5);
    fish = {
      x0: x0, x1: x0 + dir * span, y: y, dir: dir,
      apex: rand(0.16, 0.24) * H, dur: rand(1.3, 1.7), t: 0, size: rand(62, 80) * U, launched: false
    };
  }

  function drawFishBody(size, wig) {
    var L = size, h = L * 0.42;
    // buntot
    ctx.fillStyle = "rgba(31,134,168,0.95)";
    ctx.beginPath();
    ctx.moveTo(-L * 0.34, 0);
    ctx.lineTo(-L * 0.64, -h * 0.6 + wig * h * 0.3);
    ctx.quadraticCurveTo(-L * 0.54, wig * h * 0.15, -L * 0.64, h * 0.6 + wig * h * 0.3);
    ctx.closePath(); ctx.fill();
    // palikpik
    ctx.beginPath();
    ctx.moveTo(-L * 0.05, -h * 0.4);
    ctx.quadraticCurveTo(-L * 0.12, -h * 0.9, -L * 0.3, -h * 0.38);
    ctx.closePath(); ctx.fill();
    // katawan
    var g = ctx.createLinearGradient(0, -h * 0.6, 0, h * 0.6);
    g.addColorStop(0, "#1f86a8");
    g.addColorStop(0.55, "#59b9d6");
    g.addColorStop(1, "#d9f3fa");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(L * 0.5, 0);
    ctx.quadraticCurveTo(L * 0.25, -h * 0.62, -L * 0.2, -h * 0.34);
    ctx.lineTo(-L * 0.36, -h * 0.08);
    ctx.lineTo(-L * 0.36, h * 0.08);
    ctx.lineTo(-L * 0.2, h * 0.34);
    ctx.quadraticCurveTo(L * 0.25, h * 0.62, L * 0.5, 0);
    ctx.closePath(); ctx.fill();
    // mata
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(L * 0.3, -h * 0.1, L * 0.045, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#123B5D";
    ctx.beginPath(); ctx.arc(L * 0.31, -h * 0.1, L * 0.022, 0, Math.PI * 2); ctx.fill();
  }

  function updateFish(dt, t) {
    if (!fish) {
      nextFish -= dt;
      if (nextFish <= 0) { startFish(); nextFish = rand(SETTINGS.fishEverySec[0], SETTINGS.fishEverySec[1]); }
      return;
    }
    fish.t += dt;
    var u = fish.t / fish.dur;
    if (!fish.launched) {
      fish.launched = true;
      addRipples(fish.x0, fish.y, 130 * U, 2, 0.28, 1.8, "255,255,255");
      addSpray(fish.x0, fish.y, 6);
    }
    if (u >= 1) {
      addRipples(fish.x1, fish.y, 150 * U, 3, 0.28, 2.0, "255,255,255");
      addSpray(fish.x1, fish.y, 8);
      fish = null;
      return;
    }
    var x = fish.x0 + (fish.x1 - fish.x0) * u;
    var y = fish.y - 4 * fish.apex * u * (1 - u);
    var dydu = -4 * fish.apex * (1 - 2 * u), dxdu = Math.abs(fish.x1 - fish.x0);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(fish.dir, 1);
    ctx.rotate(Math.atan2(dydu, dxdu));   // sinusunod ng isda ang daan ng talon
    drawFishBody(fish.size, Math.sin(t * 14));
    ctx.restore();
  }

  // ---------- KISLAP, BULA, DAHON ----------
  function drawSparkles(t) {
    for (var i = 0; i < sparkles.length; i++) {
      var s = sparkles[i];
      var tw = Math.sin(t * s.speed + s.phase);
      if (tw <= 0.35) continue;
      var a = Math.pow((tw - 0.35) / 0.65, 2);
      var sz = s.size * (0.6 + 0.4 * a);
      ctx.strokeStyle = "rgba(255,255,255," + (0.95 * a) + ")";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(s.x - sz, s.y); ctx.lineTo(s.x + sz, s.y);
      ctx.moveTo(s.x, s.y - sz * 1.4); ctx.lineTo(s.x, s.y + sz * 1.4);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255," + (0.8 * a) + ")";
      ctx.beginPath(); ctx.arc(s.x, s.y, sz * 0.22, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawBubbles(t, dt) {
    for (var i = 0; i < bubbles.length; i++) {
      var b = bubbles[i];
      b.y -= b.rise * dt;
      if (b.y < -20) { bubbles[i] = makeBubble(false); continue; }
      var x = b.x + Math.sin(t * b.swaySpeed + b.phase) * b.sway;
      var fade = Math.max(0, Math.min(1, b.y / (H * 0.8)));
      ctx.beginPath(); ctx.arc(x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255," + (0.12 + 0.12 * fade) + ")"; ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = "rgba(255,255,255," + (0.5 + 0.4 * fade) + ")"; ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.beginPath(); ctx.arc(x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.22, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawLeaves(t, dt) {
    for (var i = 0; i < leaves.length; i++) {
      var l = leaves[i];
      l.y += l.vy * dt; l.x += (l.vx + gust * 90) * dt; l.rot += (l.rotSpeed + gust * 1.2) * dt;   // hinihipan ng hangin
      if (l.y > H + 40 || l.x > W + 60) { leaves[i] = makeLeaf(false); continue; }
      var x = l.x + Math.sin(t * l.swaySpeed + l.phase) * l.sway;
      var fl = Math.cos(t * l.flipSpeed + l.flip);
      var s = l.size;
      ctx.save();
      ctx.translate(x, l.y);
      ctx.rotate(l.rot);
      ctx.scale(0.4 + 0.6 * Math.abs(fl), 1);
      var g = ctx.createLinearGradient(0, -s, 0, s);
      g.addColorStop(0, "rgba(120,205,140," + (0.75 + 0.15 * l.shade) + ")");
      g.addColorStop(1, "rgba(52,160,110," + (0.75 + 0.15 * l.shade) + ")");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * 0.75, -s * 0.45, s * 0.6, s * 0.55, 0, s);
      ctx.bezierCurveTo(-s * 0.6, s * 0.55, -s * 0.75, -s * 0.45, 0, -s);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(0, s * 1.1); ctx.stroke();
      ctx.restore();
    }
  }

  // =====================================================================
  // MGA IBON: dumadaan sa langit nang pa-V na grupo, kumakampay ang pakpak
  // =====================================================================
  function startFlock() {
    var dir = Math.random() < 0.5 ? 1 : -1;
    var n = Math.floor(rand(3, 8));
    var depth = rand(0, 1);                          // 0 = malayo (maliit, mabagal), 1 = malapit
    var size = (10 + 16 * depth) * U;
    var speed = 38 + 36 * depth;
    var baseY = H * rand(0.12, 0.44);
    var gap = size * 2.6;
    var startX = dir === 1 ? -gap * n - 40 : W + gap * n + 40;
    var flapSpeed = rand(5.5, 7.5);
    for (var i = 0; i < n; i++) {
      var row = Math.ceil(i / 2), side = (i % 2 === 0) ? 1 : -1;       // pa-V ang hanay
      birds.push({
        x: startX - dir * row * gap, y: baseY + (i === 0 ? 0 : side * row * size * 1.1) + rand(-4, 4),
        dir: dir, size: size * rand(0.9, 1.1), speed: speed * rand(0.97, 1.03),
        phase: rand(0, 6.28), flap: flapSpeed * rand(0.9, 1.1), glide: rand(0, 6.28),
        bob: rand(3, 7), bobSpeed: rand(0.6, 1.1), alpha: 0.5 + 0.35 * depth, depth: depth
      });
    }
  }

  function drawBird(b, t) {
    // Paminsan-minsan, hindi kumakampay (nagla-glide lang): mas natural
    var amp = 0.35 + 0.65 * Math.max(0, Math.sin(t * 0.45 + b.glide) * 1.6);
    amp = Math.min(1, amp);
    var flap = Math.sin(t * b.flap + b.phase) * amp;
    var s = b.size;
    var yy = b.y + Math.sin(t * b.bobSpeed + b.phase) * b.bob;
    var tip = -s * 0.55 * flap - s * 0.12;                 // taas-baba ng dulo ng pakpak
    var k = SETTINGS.parallax ? (3 + 8 * b.depth) : 0;
    ctx.save();
    ctx.translate(b.x + mx * k, yy + my * k * 0.6);
    ctx.scale(b.dir, 1);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(18,59,93," + b.alpha + ")";
    ctx.lineWidth = Math.max(1.4, s * 0.13);
    ctx.beginPath();
    ctx.moveTo(-s, tip + s * 0.05);                         // dulo ng kaliwang pakpak
    ctx.quadraticCurveTo(-s * 0.5, tip - s * 0.45 + s * 0.35 * (1 - Math.abs(flap)), 0, 0);
    ctx.quadraticCurveTo(s * 0.5, tip - s * 0.45 + s * 0.35 * (1 - Math.abs(flap)), s, tip + s * 0.05);
    ctx.stroke();
    ctx.restore();
  }

  function updateBirds(t, dt) {
    nextFlock -= dt;
    if (nextFlock <= 0 && birds.length === 0) {
      startFlock();
      nextFlock = rand(SETTINGS.flockEverySec[0], SETTINGS.flockEverySec[1]);
    } else if (nextFlock <= 0) {
      nextFlock = 2;      // hintayin munang makalabas ang kasalukuyang grupo
    }
    for (var i = birds.length - 1; i >= 0; i--) {
      var b = birds[i];
      b.x += b.dir * b.speed * dt * (1 + gust * 0.8);
      if ((b.dir === 1 && b.x > W + 80) || (b.dir === -1 && b.x < -80)) { birds.splice(i, 1); continue; }
      drawBird(b, t);
    }
  }

  // =====================================================================
  // HANGIN (WHOOSH): mga guhit na may kulot sa dulo, parang icon ng hangin.
  // Lumilitaw (parang iginuguhit), dumadaan sa langit, tapos naglalaho. Kasabay nito, humihip sa mga dahon at ibon.
  // =====================================================================
  function startWhoosh() {
    // Makinis na guhit ng hangin na dumadaan mula kaliwa papuntang kanan
    var y0 = rand(0.12, 0.54) * H;
    var amp = rand(10, 24) * U, k = rand(0.0035, 0.006), ph = rand(0, 6.28);
    var speed = rand(170, 250) * U, len = rand(240, 380) * U;
    var n = Math.random() < 0.5 ? 3 : 2, lines = [];
    for (var i = 0; i < n; i++) {
      lines.push({ dy: (i - (n - 1) / 2) * 13 * U, len: len * (1 - i * 0.22), lag: i * 38 * U, w: (5.2 - i * 1.1) * Math.max(0.8, U) });
    }
    whooshes.push({ hx: -20, y0: y0, amp: amp, k: k, ph: ph, speed: speed, lines: lines, len: len });
    gust = Math.max(gust, 0.6);
  }

  function windY(w, x) { return w.y0 + w.amp * Math.sin(x * w.k + w.ph) + w.amp * 0.35 * Math.sin(x * w.k * 2.3 + w.ph * 1.7); }

  function drawWhooshes(dt) {
    for (var i = whooshes.length - 1; i >= 0; i--) {
      var w = whooshes[i];
      w.hx += w.speed * dt;
      if (w.hx - w.len > W + 40) { whooshes.splice(i, 1); continue; }
      for (var j = 0; j < w.lines.length; j++) {
        var L = w.lines[j], hx = w.hx - L.lag, N = 36, top = [], bot = [], q;
        var x0 = hx - L.len;
        for (q = 0; q <= N; q++) {
          var sx = q / N, x = x0 + L.len * sx;
          var y = windY(w, x) + L.dy;
          var yn = windY(w, x + 2) + L.dy, slope = (yn - y) / 2, nl = Math.sqrt(1 + slope * slope);
          var half = L.w * 0.5 * Math.pow(Math.sin(Math.PI * sx), 0.9);     // nanipis sa magkabilang dulo
          top.push([x - slope / nl * half, y + half / nl]);
          bot.push([x + slope / nl * half, y - half / nl]);
        }
        var g = ctx.createLinearGradient(x0, 0, hx, 0);
        g.addColorStop(0, "rgba(255,255,255,0)");
        g.addColorStop(0.7, "rgba(255,255,255,0.85)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(top[0][0], top[0][1]);
        for (q = 1; q <= N; q++) ctx.lineTo(top[q][0], top[q][1]);
        for (q = N; q >= 0; q--) ctx.lineTo(bot[q][0], bot[q][1]);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  function updateWind(dt) {
    nextWind -= dt;
    if (nextWind <= 0) {
      if (whooshes.length < 2) startWhoosh();
      nextWind = rand(SETTINGS.windEverySec[0], SETTINGS.windEverySec[1]);
    }
    gust = Math.max(0, gust - dt * 0.35);
  }

  // =====================================================================
  // INTERACTION
  // =====================================================================
  var lastTrail = 0;
  if (!reduceMotion) {
    if (SETTINGS.clickRipples) {
      document.addEventListener("pointerdown", function (e) {
        if (e.target && e.target.closest && e.target.closest("a, button, iframe, input")) return;
        addRipples(e.clientX, e.clientY, 90, 2, 0.6, 1.4, "255,255,255");
      }, { passive: true });
    }
    document.addEventListener("pointermove", function (e) {
      tmx = (e.clientX / Math.max(W, 1) - 0.5) * 2;
      tmy = (e.clientY / Math.max(H, 1) - 0.5) * 2;
      if (SETTINGS.pointerRipples && e.clientY > HZ + 8 && e.pointerType !== "touch") {
        var now = performance.now();
        if (now - lastTrail > 140) {
          lastTrail = now;
          addRipples(e.clientX, e.clientY, 55, 1, 0.3, 1.2, "255,255,255");
        }
      }
    }, { passive: true });
  }

  // =====================================================================
  // FRAME
  // =====================================================================
  function frame(t, dt) {
    mx += (tmx - mx) * Math.min(1, dt * 3);
    my += (tmy - my) * Math.min(1, dt * 3);

    ctx.drawImage(staticBg, 0, 0, W, H);
    drawClouds(dt);
    drawOrbs(t, dt);
    drawSwooshes(t);
    updateWind(dt);
    drawWhooshes(dt);
    updateBirds(t, dt);
    drawGlints(t, dt);
    drawWave(t, 0);
    drawWave(t, 1);
    drawPads(t);
    drawWave(t, 2);
    drawWave(t, 3);
    drawRings(dt);
    drawSparkles(t);
    updateFish(dt, t);
    updateDrops(dt);
    drawSpray(dt);
    drawBubbles(t, dt);
    drawLeaves(t, dt);
  }

  resize();
  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { resize(); if (reduceMotion) frame(3, 0); }, 150);
  });

  // Kung ayaw ng user ng animation: isang still na larawan lang ng eksena
  if (reduceMotion) { frame(3, 0); return; }

  var last = null, clock = 0;
  function loop(now) {
    if (last === null) last = now;
    var dt = Math.min((now - last) / 1000, 0.05) * SETTINGS.speed;   // limitado para hindi tumalon pagbalik sa tab
    last = now;
    clock += dt;
    frame(clock, dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
