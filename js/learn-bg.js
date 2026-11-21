/* =====================================================================
   LEARN PAGE: ANIMATED NA TUBIG (background)

   Pumalit ito sa dating larawan (learn-bg.jpg). Nasa ilalim ito ng dahon at ng
   patak (water-drop.js), kaya nananatili ang dahon at ang bumabagsak na patak.

   Laman ng animation:
   - Banayad na gradient ng tubig (parehong kulay ng dating larawan)
   - Caustics: gumagalaw na liwanag sa ilalim ng tubig (dalawang layer na magkabaligtad ang galaw)
   - Ripples na paminsan-minsang lumilitaw sa kanang bahagi (kung saan ang dahon)
   - Maliliit na bubbles na pumapaitaas at kumikislap na liwanag
   - Kapag nag-splash ang patak mula sa dahon (event na "agos-splash"), may dagdag na
     malambot na alon at bubbles

   Magaan ito: prerendered ang caustic tile at gradient, kaya ilang drawImage lang kada frame.
   Kapag naka-"reduce motion" ang device, isang still frame lang.
   ===================================================================== */
(function () {
  "use strict";

  var SETTINGS = {
    speed: 1,
    causticAlpha: 0.09,          // lakas ng gumagalaw na liwanag (0 hanggang 1)
    rippleEverySec: [1.6, 3.2],  // gaano kadalas ang ripple
    bubbleCount: 16,
    glintCount: 40
  };

  var canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.className = "learn-bg-canvas";
  document.body.insertBefore(canvas, document.body.firstChild);
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var W = 0, H = 0, dpr = 1, U = 1;
  var base = null, tile = null, TS = 384;
  var rings = [], bubbles = [], glints = [], nextRipple = 0.6;

  function rand(a, b) { return a + Math.random() * (b - a); }

  // ----- Base: gradient ng tubig, kapareho ng dating larawan -----
  function buildBase() {
    base = document.createElement("canvas");
    base.width = Math.round(W * dpr); base.height = Math.round(H * dpr);
    var b = base.getContext("2d");
    b.scale(dpr, dpr);
    var g = b.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#2f99b0");
    g.addColorStop(0.35, "#41a9bf");
    g.addColorStop(0.7, "#4db3c9");
    g.addColorStop(1, "#2192a9");
    b.fillStyle = g; b.fillRect(0, 0, W, H);
    // mas maliwanag na bahagi sa kanan (parang sa larawan)
    var r = b.createRadialGradient(W * 0.78, H * 0.62, 0, W * 0.78, H * 0.62, Math.max(W, H) * 0.6);
    r.addColorStop(0, "rgba(140,215,230,0.45)");
    r.addColorStop(1, "rgba(140,215,230,0)");
    b.fillStyle = r; b.fillRect(0, 0, W, H);
    // dilim sa itaas na gilid
    var d = b.createLinearGradient(0, 0, 0, H * 0.25);
    d.addColorStop(0, "rgba(10,70,95,0.28)");
    d.addColorStop(1, "rgba(10,70,95,0)");
    b.fillStyle = d; b.fillRect(0, 0, W, H * 0.25);
  }

  // ----- Caustic tile: tileable na network ng liwanag (isang beses lang ginagawa) -----
  function buildTile() {
    tile = document.createElement("canvas");
    tile.width = TS; tile.height = TS;
    var t = tile.getContext("2d");
    var img = t.createImageData(TS, TS), d = img.data, TAU = Math.PI * 2;
    // ilang alon na may buong ikot sa tile (kaya seamless)
    var waves = [];
    for (var i = 0; i < 6; i++) {
      var kx = Math.round(rand(1, 4)) * (Math.random() < 0.5 ? -1 : 1);
      var ky = Math.round(rand(1, 4));
      waves.push({ kx: kx, ky: ky, ph: rand(0, TAU) });
    }
    for (var y = 0; y < TS; y++) {
      for (var x = 0; x < TS; x++) {
        var v = 0;
        for (var j = 0; j < waves.length; j++) {
          var w = waves[j];
          v += Math.sin(TAU * (w.kx * x + w.ky * y) / TS + w.ph);
        }
        v = v / waves.length;                 // mga -1 hanggang 1
        // maliwanag sa mga "ridge" (kung saan malapit sa 0): manipis na network ng liwanag
        var line = Math.max(0, 1 - Math.abs(v) * 5.5);
        line = line * line;
        var o = (y * TS + x) * 4;
        d[o] = 255; d[o + 1] = 255; d[o + 2] = 255; d[o + 3] = Math.round(line * 255);
      }
    }
    t.putImageData(img, 0, 0);
  }

  function drawTiled(img, size, ox, oy, alpha) {
    ctx.globalAlpha = alpha;
    var x0 = -((ox % size) + size) % size, y0 = -((oy % size) + size) % size;
    for (var y = y0; y < H; y += size) for (var x = x0; x < W; x += size) ctx.drawImage(img, x, y, size, size);
    ctx.globalAlpha = 1;
  }

  // ----- Ripples -----
  function addRipple(x, y, scale, strong) {
    rings.push({ x: x, y: y, t: 0, dur: rand(3.4, 4.6) * (strong ? 1.1 : 1), maxR: rand(70, 130) * U * scale, n: strong ? 3 : 2, a: strong ? 0.5 : 0.4 });
  }

  function drawRipples(dt) {
    ctx.lineCap = "round";
    for (var i = rings.length - 1; i >= 0; i--) {
      var r = rings[i];
      r.t += dt;
      var p = r.t / r.dur;
      if (p >= 1) { rings.splice(i, 1); continue; }
      for (var k = 0; k < r.n; k++) {
        var pk = p - k * 0.1;
        if (pk <= 0) continue;
        var e = 1 - Math.pow(1 - pk, 2.2);
        var rr = r.maxR * e, a = r.a * Math.pow(1 - pk, 1.6);
        ctx.lineWidth = Math.max(1, (2.6 - 1.6 * pk) * U);
        ctx.strokeStyle = "rgba(255,255,255," + a + ")";
        ctx.beginPath(); ctx.ellipse(r.x, r.y, rr, rr * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = Math.max(0.8, 1.1 * U);
        ctx.strokeStyle = "rgba(190,240,250," + a * 0.7 + ")";
        ctx.beginPath(); ctx.ellipse(r.x, r.y, rr * 0.88, rr * 0.88 * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
      }
    }
  }

  // ----- Bubbles at glints -----
  function makeBubble(x, y) {
    return { x: x === undefined ? rand(0, W) : x, y: y === undefined ? rand(0, H) : y,
      r: rand(2, 6) * U, vy: -rand(12, 30) * U, ph: rand(0, 6.28), sw: rand(4, 10) * U, a: rand(0.35, 0.7) };
  }
  function drawBubbles(t, dt) {
    for (var i = 0; i < bubbles.length; i++) {
      var b = bubbles[i];
      b.y += b.vy * dt;
      if (b.y < -20) { b.y = H + 20; b.x = rand(0, W); }
      var x = b.x + Math.sin(t * 0.8 + b.ph) * b.sw;
      ctx.lineWidth = Math.max(1, b.r * 0.22);
      ctx.strokeStyle = "rgba(255,255,255," + b.a * 0.8 + ")";
      ctx.beginPath(); ctx.arc(x, b.y, b.r, 0, 6.2832); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255," + b.a * 0.28 + ")";
      ctx.beginPath(); ctx.arc(x, b.y, b.r, 0, 6.2832); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255," + b.a + ")";
      ctx.beginPath(); ctx.arc(x - b.r * 0.35, b.y - b.r * 0.35, Math.max(0.8, b.r * 0.22), 0, 6.2832); ctx.fill();
    }
  }
  function drawGlints(t) {
    for (var i = 0; i < glints.length; i++) {
      var g = glints[i];
      var a = Math.pow(Math.max(0, Math.sin(t * g.sp + g.ph)), 6) * g.a;
      if (a < 0.03) continue;
      ctx.fillStyle = "rgba(255,255,255," + a + ")";
      ctx.beginPath(); ctx.ellipse(g.x, g.y, g.w, g.w * 0.28, 0, 0, 6.2832); ctx.fill();
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth; H = window.innerHeight;
    U = Math.max(0.7, Math.min(1.4, W / 1300));
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    buildBase();
    bubbles = []; glints = [];
    var i;
    for (i = 0; i < SETTINGS.bubbleCount; i++) bubbles.push(makeBubble());
    for (i = 0; i < SETTINGS.glintCount; i++) glints.push({ x: rand(0, W), y: rand(0, H), w: rand(5, 14) * U, sp: rand(0.4, 1.1), ph: rand(0, 6.28), a: rand(0.25, 0.55) });
  }

  function frame(t, dt) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.drawImage(base, 0, 0, W, H);

    // caustics: dalawang layer na magkabaligtad ang galaw
    ctx.globalCompositeOperation = "lighter";
    var size = TS * 0.8 * Math.max(1, W / 1300);
    drawTiled(tile, size, t * 14, t * 9, SETTINGS.causticAlpha);
    drawTiled(tile, size * 1.35, -t * 10 + 120, t * 7 + 60, SETTINGS.causticAlpha * 0.75);
    ctx.globalCompositeOperation = "source-over";

    // bagong ripple
    if (!reduce) {
      nextRipple -= dt;
      if (nextRipple <= 0) {
        var right = Math.random() < 0.65;
        addRipple(right ? rand(0.55, 0.95) * W : rand(0.05, 0.95) * W, rand(0.25, 0.92) * H, 1, false);
        nextRipple = rand(SETTINGS.rippleEverySec[0], SETTINGS.rippleEverySec[1]);
      }
    }
    drawRipples(dt);
    drawBubbles(t, dt);
    drawGlints(t);
  }

  // Kapag nag-splash ang patak mula sa dahon: malambot na malaking alon + bubbles
  window.addEventListener("agos-splash", function (e) {
    if (reduce || !e.detail) return;
    var x = e.detail.x, y = Math.max(H * 0.7, e.detail.y - 10);
    addRipple(x, y, 1.8, true);
    for (var i = 0; i < 3; i++) bubbles.push(makeBubble(x + rand(-30, 30) * U, y));
    if (bubbles.length > SETTINGS.bubbleCount + 12) bubbles.splice(0, bubbles.length - SETTINGS.bubbleCount - 12);
  });

  buildTile();
  resize();
  var rt;
  window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(resize, 120); });

  if (reduce) { frame(2, 0); return; }

  var last = 0, running = true;
  document.addEventListener("visibilitychange", function () { running = !document.hidden; last = 0; if (running) requestAnimationFrame(loop); });
  function loop(now) {
    if (!running) return;
    requestAnimationFrame(loop);
    var t = now / 1000;
    var dt = last ? Math.min(t - last, 0.05) * SETTINGS.speed : 0;
    last = t;
    frame(t * SETTINGS.speed, dt);
  }
  requestAnimationFrame(loop);
})();
