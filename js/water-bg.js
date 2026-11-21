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
    skyTop: "#3a9fc4",       // kulay sa pinakataas (kapareho ng langit sa Interactive page; dati #e6f6fb na halos puti)
    skyMid: "#62bcd8",       // gitna (para maayos ang pagbaba ng kulay)
    skyBottom: "#8fd3e3",    // kulay sa pinakababa (bago ang alon)
    glowCount: 0,            // malambot na liwanag sa taas (0 = wala na; ayaw ng group)
    waveHeightRatio: 0.34,   // gaano kataas ang bahagi ng alon (porsyento ng taas ng screen)
    bubbleCount: 28,         // ilang bula (mas konti = mas tahimik)
    rayCount: 0,             // sinag ng liwanag sa taas (0 = wala na; ayaw ng group)
    fishCount: 7,            // ilang isda ang lumalangoy (0 = wala)
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
  var glows = [];
  var fish = [];

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
      alpha: rand(0.14, 0.26)
    };
  }

  function makeGlow() {
    return {
      x: rand(0.1, 0.9),           // posisyon (porsyento ng lapad)
      y: rand(0.02, 0.18),         // posisyon (porsyento ng taas): nasa taas lang
      r: rand(0.16, 0.28),         // laki (porsyento ng lapad)
      drift: rand(0.03, 0.07),     // gaano kalayo ang galaw
      speed: rand(0.12, 0.28),
      phase: rand(0, Math.PI * 2),
      alpha: rand(0.20, 0.32)
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

    glows = [];
    for (var m = 0; m < SETTINGS.glowCount; m++) glows.push(makeGlow());

    fish = [];
    for (var n = 0; n < SETTINGS.fishCount; n++) fish.push(makeFish(n, true));
    // Ang maliliit na isda ay magkakasama sa simula
    for (var q = 4; q < fish.length; q++) if (fish[3] && fish[q].school) resetSchool(fish[q], fish[3]);
  }

  function drawSky() {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, SETTINGS.skyTop);
    g.addColorStop(0.5, SETTINGS.skyMid);
    g.addColorStop(1, SETTINGS.skyBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // ---------- ISDA: dumadaan mula kaliwa papuntang kanan (o kabaligtaran) ----------
  // Tatlong uri: malaki (isa), katamtaman, at maliliit na sama-sama (parang school of fish).
  var FISH_COLORS = [
    { body: "rgba(255, 255, 255, 0.55)", fin: "rgba(255, 255, 255, 0.35)" },   // maputi
    { body: "rgba(15, 176, 201, 0.60)",  fin: "rgba(15, 176, 201, 0.40)" },    // teal (kulay ng site)
    { body: "rgba(23, 87, 125, 0.50)",   fin: "rgba(23, 87, 125, 0.35)" }      // navy-blue
  ];

  function makeFish(i, startAnywhere) {
    var big = (i === 0);
    var school = (i >= 3);                  // 4 na maliliit na magkakasama
    var size = big ? rand(70, 90) : (school ? rand(18, 24) : rand(34, 46));
    var dir = Math.random() < 0.5 ? 1 : -1;
    var f = {
      big: big, school: school, size: size, dir: dir,
      speed: big ? rand(22, 30) : (school ? rand(40, 50) : rand(30, 40)),   // px bawat segundo
      y: H * rand(0.10, 0.58),
      bob: rand(4, 10), bobSpeed: rand(0.5, 1.1), phase: rand(0, Math.PI * 2),
      wag: rand(4.5, 6.5),                  // bilis ng pagkembot ng buntot
      color: big ? FISH_COLORS[2] : (school ? FISH_COLORS[0] : FISH_COLORS[Math.floor(rand(0, 2))]),
      x: 0, wait: 0
    };
    f.x = startAnywhere ? rand(0, W) : (dir === 1 ? -size * 2 : W + size * 2);
    if (!startAnywhere) f.wait = rand(0, 6);   // maghihintay muna bago lumabas
    return f;
  }

  function resetSchool(f, leader) {
    // Ang maliliit ay sumusunod sa unang maliit para sama-sama ang daan
    if (leader) {
      f.dir = leader.dir; f.speed = leader.speed * rand(0.95, 1.05);
      f.y = leader.y + rand(-26, 26);
      f.x = leader.dir === 1 ? leader.x - rand(30, 90) : leader.x + rand(30, 90);
    }
  }

  function drawFish(f, t) {
    var L = f.size, h = L * 0.46;
    var wig = Math.sin(t * f.wag + f.phase);
    var y = f.y + Math.sin(t * f.bobSpeed + f.phase) * f.bob;

    ctx.save();
    ctx.translate(f.x, y);
    ctx.scale(f.dir, 1);
    ctx.rotate(wig * 0.04);

    // Buntot (kumekembot)
    var tx = -L * 0.34, tw = wig * h * 0.35;
    ctx.fillStyle = f.color.fin;
    ctx.beginPath();
    ctx.moveTo(tx, 0);
    ctx.lineTo(-L * 0.62, -h * 0.55 + tw);
    ctx.quadraticCurveTo(-L * 0.52, tw * 0.5, -L * 0.62, h * 0.55 + tw);
    ctx.closePath();
    ctx.fill();

    // Palikpik sa likod at sa ilalim
    ctx.beginPath();
    ctx.moveTo(-L * 0.05, -h * 0.4);
    ctx.quadraticCurveTo(-L * 0.12, -h * 0.85, -L * 0.28, -h * 0.38);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(L * 0.02, h * 0.38);
    ctx.quadraticCurveTo(-L * 0.04, h * 0.7, -L * 0.14, h * 0.38);
    ctx.closePath();
    ctx.fill();

    // Katawan
    ctx.fillStyle = f.color.body;
    ctx.beginPath();
    ctx.moveTo(L * 0.5, 0);
    ctx.quadraticCurveTo(L * 0.25, -h * 0.62, -L * 0.2, -h * 0.34);
    ctx.lineTo(-L * 0.36, -h * 0.08);
    ctx.lineTo(-L * 0.36, h * 0.08);
    ctx.lineTo(-L * 0.2, h * 0.34);
    ctx.quadraticCurveTo(L * 0.25, h * 0.62, L * 0.5, 0);
    ctx.closePath();
    ctx.fill();

    // Mata
    ctx.fillStyle = "rgba(18, 59, 93, 0.85)";
    ctx.beginPath();
    ctx.arc(L * 0.28, -h * 0.1, Math.max(1.4, L * 0.035), 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function updateFish(dt) {
    var leader = null;
    for (var i = 0; i < fish.length; i++) {
      var f = fish[i];
      if (f.school && !leader) leader = f;
      if (f.wait > 0) { f.wait -= dt; continue; }
      f.x += f.dir * f.speed * dt;
      // Kapag lumampas na sa kabilang gilid, bagong isda ang lalabas
      if ((f.dir === 1 && f.x > W + f.size * 2) || (f.dir === -1 && f.x < -f.size * 2)) {
        fish[i] = makeFish(i, false);
        if (fish[i].school && leader && leader !== f) resetSchool(fish[i], leader);
      }
    }
  }

  function drawFishAll(t) {
    for (var i = 0; i < fish.length; i++) {
      if (fish[i].wait > 0) continue;
      drawFish(fish[i], t);
    }
  }

  // Malalambot na liwanag sa taas na dahan-dahang lumulutang (parang sikat ng araw na tumatagos sa tubig)
  function drawGlows(t) {
    for (var i = 0; i < glows.length; i++) {
      var o = glows[i];
      var cx = (o.x + Math.sin(t * o.speed + o.phase) * o.drift) * W;
      var cy = (o.y + Math.cos(t * o.speed * 0.8 + o.phase) * 0.02) * H;
      var r = o.r * W;
      var pulse = 0.85 + 0.15 * Math.sin(t * o.speed * 1.7 + o.phase);
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, "rgba(255, 255, 255, " + (o.alpha * pulse) + ")");
      g.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
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
    drawGlows(t);
    drawRays(t);
    drawFishAll(t);
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
    updateFish(dt);
    frame(clock, dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
