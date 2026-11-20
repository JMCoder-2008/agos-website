/* =====================================================================
   ANIMATED WATER BACKGROUND (About Us page lang)

   Ano ang makikita:
   1. Malumanay na gradient ng tubig (maputlang asul sa taas, mas matingkad sa baba).
   2. Apat na layer ng alon sa ilalim ng screen na dahan-dahang gumagalaw,
      magkakaiba ang bilis at direksyon para parang totoong tubig.
   3. Mga bula (bubbles) na umaangat mula sa ilalim, may bahagyang kembot pakaliwa/pakanan.
   4. Mga manipis na sinag ng liwanag na dahan-dahang gumagalaw sa taas.

   Naka-fixed sa likod ng page (hindi gumagalaw kapag nag-scroll).
   Mga kulay: galing sa palette ng site (Ocean Blue at Deep Navy).
   Kapag naka-"reduce motion" ang device ng user, isang still na larawan lang ang ilalabas.
   ===================================================================== */
(function () {
  "use strict";

  // ----- SETTINGS (pwedeng baguhin) -----
  var SETTINGS = {
    skyTop: "#e6f6fb",       // kulay sa pinakataas
    skyBottom: "#8fd3e3",    // kulay sa pinakababa (bago ang alon)
    waveHeightRatio: 0.34,   // gaano kataas ang bahagi ng alon (porsyento ng taas ng screen)
    bubbleCount: 28,         // ilang bula (mas konti = mas tahimik)
    rayCount: 4,             // ilang sinag ng liwanag
    speed: 1                 // 1 = normal, 0.5 = kalahating bilis, 2 = doble
  };

  // Mga layer ng alon: mula sa pinakalayo (likod) hanggang sa pinakamalapit (harap)
  var WAVES = [
    { color: "rgba(36, 151, 184, 0.30)", amp: 0.050, len: 1.1, speed: 0.30, offset: 0.00, base: 0.00 },
    { color: "rgba(36, 151, 184, 0.40)", amp: 0.045, len: 0.8, speed: -0.42, offset: 1.70, base: 0.07 },
    { color: "rgba(23, 87, 125, 0.45)",  amp: 0.040, len: 1.4, speed: 0.55, offset: 3.10, base: 0.14 },
    { color: "rgba(18, 59, 93, 0.55)",   amp: 0.035, len: 0.9, speed: -0.70, offset: 4.60, base: 0.22 }
  ];

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText =
    "position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:-1;";
  document.body.appendChild(canvas);
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var W = 0, H = 0, dpr = 1;
  var bubbles = [];
  var rays = [];

  function rand(min, max) { return min + Math.random() * (max - min); }

  function makeBubble(startAnywhere) {
    return {
      x: rand(0, W),
      y: startAnywhere ? rand(0, H) : H + rand(10, 80),
      r: rand(3, 11),
      rise: rand(18, 48),          // bilis ng pag-angat (px bawat segundo)
      sway: rand(8, 26),           // lawak ng kembot
      swaySpeed: rand(0.6, 1.6),
      phase: rand(0, Math.PI * 2)
    };
  }

  function makeRay() {
    return {
      x: rand(0.05, 0.95),         // posisyon (porsyento ng lapad)
      width: rand(0.05, 0.12),     // lapad ng sinag
      drift: rand(0.015, 0.04),    // gaano kalayo ang galaw
      speed: rand(0.10, 0.25),
      phase: rand(0, Math.PI * 2),
      alpha: rand(0.10, 0.20)
    };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Ayusin ang bilang ng bula ayon sa lapad ng screen (mas konti sa phone)
    var count = Math.round(SETTINGS.bubbleCount * Math.min(1, W / 1200));
    bubbles = [];
    for (var i = 0; i < Math.max(8, count); i++) bubbles.push(makeBubble(true));

    rays = [];
    for (var j = 0; j < SETTINGS.rayCount; j++) rays.push(makeRay());
  }

  function drawSky() {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, SETTINGS.skyTop);
    g.addColorStop(1, SETTINGS.skyBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawRays(t) {
    for (var i = 0; i < rays.length; i++) {
      var r = rays[i];
      var cx = (r.x + Math.sin(t * r.speed + r.phase) * r.drift) * W;
      var w = r.width * W;
      var g = ctx.createLinearGradient(0, 0, 0, H * 0.75);
      g.addColorStop(0, "rgba(255, 255, 255, " + r.alpha + ")");
      g.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.25, 0);
      ctx.lineTo(cx + w * 0.25, 0);
      ctx.lineTo(cx + w, H * 0.75);
      ctx.lineTo(cx - w, H * 0.75);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawBubbles(t, dt) {
    for (var i = 0; i < bubbles.length; i++) {
      var b = bubbles[i];
      b.y -= b.rise * dt;
      var x = b.x + Math.sin(t * b.swaySpeed + b.phase) * b.sway;

      if (b.y < -20) { bubbles[i] = makeBubble(false); continue; }

      // Mas malabo habang papalapit sa taas ng screen
      var fade = Math.max(0, Math.min(1, b.y / (H * 0.9)));

      ctx.beginPath();
      ctx.arc(x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, " + (0.10 + 0.14 * fade) + ")";
      ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = "rgba(255, 255, 255, " + (0.35 + 0.35 * fade) + ")";
      ctx.stroke();

      // Maliit na kislap sa gilid ng bula
      ctx.beginPath();
      ctx.arc(x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.22, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.fill();
    }
  }

  function drawWaves(t) {
    var zoneH = H * SETTINGS.waveHeightRatio;
    var top = H - zoneH;

    for (var i = 0; i < WAVES.length; i++) {
      var w = WAVES[i];
      var baseY = top + zoneH * w.base + zoneH * 0.18;
      var amp = H * w.amp;
      var k = (Math.PI * 2) / (W * w.len);

      ctx.beginPath();
      ctx.moveTo(0, H);
      for (var x = 0; x <= W; x += 8) {
        // Dalawang sine na pinagsama para hindi mukhang masyadong "pantay"
        var y = baseY +
          Math.sin(x * k + t * w.speed + w.offset) * amp +
          Math.sin(x * k * 2.3 + t * w.speed * 1.4 + w.offset) * amp * 0.35;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fillStyle = w.color;
      ctx.fill();
    }
  }

  function frame(t, dt) {
    ctx.clearRect(0, 0, W, H);
    drawSky();
    drawRays(t);
    drawBubbles(t, dt);
    drawWaves(t);
  }

  resize();
  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { resize(); if (reduceMotion) frame(0, 0); }, 120);
  });

  // Kung ayaw ng user ng animation: isang still na larawan lang
  if (reduceMotion) { frame(0, 0); return; }

  var last = null;
  var clock = 0;
  function loop(now) {
    if (last === null) last = now;
    var dt = Math.min((now - last) / 1000, 0.05) * SETTINGS.speed;  // limitado para hindi tumalon pagbalik sa tab
    last = now;
    clock += dt;
    frame(clock, dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
