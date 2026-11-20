/* =====================================================================
   ANIMATED DRY / DROUGHT BACKGROUND (Interactive page lang)

   Idea ng designer: mga ulap na hinihipan ng hangin, tuyong background,
   dahil ang mapa sa page na ito ay nagpapakita ng mga lugar na tagtuyot (drought).

   Ano ang makikita:
   1. Mainit at maalikabok na langit (maputlang dilaw papuntang kahel) na may malabong araw.
   2. Mga manipis na ulap na hinihipan: nakahaba ang hugis, may buntot na nasa likod,
      at tatlong layer ng lalim (mas malayo = mas mabagal, mas maliit, mas malabo).
   3. Hangin na pabugso-bugso: minsan mahina, minsan malakas. Sumusunod dito ang ulap,
      alikabok, at mga guhit ng hangin.
   4. Alikabok at tuyong dahon na tinatangay ng hangin.
   5. Basag-basag na lupa (cracked earth) sa pinakababa ng screen.
   6. Mga tumbleweed na gumugulong sa lupa, tinatangay ng hangin. Kapag malakas ang bugso,
      tumatalbog sila.

   Naka-fixed sa likod ng page (hindi gumagalaw kapag nag-scroll). Nasa ibabaw nito
   ang mga navy na panel kaya mababasa pa rin ang lahat.
   Kapag naka-"reduce motion" ang device ng user, isang still na larawan lang ang ilalabas.
   ===================================================================== */
(function () {
  "use strict";

  // ----- SETTINGS (pwedeng baguhin) -----
  var SETTINGS = {
    skyTop: "#f7ecd6",       // kulay ng langit sa taas
    skyMid: "#f2d59b",       // gitna
    skyBottom: "#e4b46d",    // sa baba (malapit sa lupa)
    groundRatio: 0.20,       // taas ng basag na lupa (porsyento ng taas ng screen)
    cloudsPerLayer: [3, 3, 2],  // ilang ulap sa bawat layer (likod -> harap)
    dustCount: 70,           // dami ng alikabok
    leafCount: 9,            // dami ng tuyong dahon
    streakCount: 10,         // dami ng guhit ng hangin
    tumbleweedCount: 2,      // ilang tumbleweed ang gumugulong (0 = wala)
    windBase: 1,             // 1 = normal na hangin, 0.5 = mahina, 2 = malakas
    speed: 1                 // bilis ng buong animation
  };

  // Tatlong layer ng ulap: scale (laki), speed (bilis, px/s), alpha (labo), y (saan sa taas, ratio)
  var LAYERS = [
    { scale: 0.65, speed: 14, alpha: 0.65, yMin: 0.04, yMax: 0.28 },
    { scale: 1.00, speed: 26, alpha: 0.80, yMin: 0.10, yMax: 0.40 },
    { scale: 1.45, speed: 44, alpha: 0.90, yMin: 0.18, yMax: 0.48 }
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
  var clouds = [], dust = [], leaves = [], streaks = [];
  var cloudSprites = [];
  var groundCanvas = null;
  var groundH = 0;
  var tumbleSprites = [];
  var tumbles = [];

  function rand(a, b) { return a + Math.random() * (b - a); }

  /* ---------- Hangin: pabugso-bugso ---------- */
  function wind(t) {
    var w = 1 + 0.55 * Math.sin(t * 0.35) + 0.25 * Math.sin(t * 0.93 + 1.3);
    return Math.max(0.35, w) * SETTINGS.windBase;
  }

  /* ---------- Ulap: ginuhit muna sa maliit na canvas (sprite) para magaan ---------- */
  function makeCloudSprite() {
    var w = 520, h = 190;
    var c = document.createElement("canvas");
    c.width = w; c.height = h;
    var g = c.getContext("2d");

    // Mga puff: nasa harap ang pinakamalaki, nasa likod (kaliwa) ang mga mahihinang buntot
    var puffs = [];
    var bodyX = w * 0.62, bodyY = h * 0.52;
    var n = 7 + Math.floor(Math.random() * 3);
    for (var i = 0; i < n; i++) {
      puffs.push({
        x: bodyX + rand(-120, 90),
        y: bodyY + rand(-26, 18),
        rx: rand(55, 95),
        ry: rand(26, 46),
        a: rand(0.55, 0.9)
      });
    }
    // Buntot na hinihila ng hangin (papunta sa kaliwa)
    for (var j = 0; j < 6; j++) {
      puffs.push({
        x: bodyX - 150 - j * rand(34, 52),
        y: bodyY + rand(-8, 16),
        rx: rand(48, 80) - j * 4,
        ry: rand(10, 20),
        a: 0.38 - j * 0.045
      });
    }

    puffs.forEach(function (p) {
      g.save();
      g.translate(p.x, p.y);
      g.scale(p.rx, p.ry);
      var grad = g.createRadialGradient(0, -0.25, 0, 0, 0, 1);
      grad.addColorStop(0, "rgba(255, 251, 242, " + p.a + ")");
      grad.addColorStop(0.6, "rgba(250, 236, 212, " + (p.a * 0.6) + ")");
      grad.addColorStop(1, "rgba(235, 205, 160, 0)");
      g.fillStyle = grad;
      g.beginPath();
      g.arc(0, 0, 1, 0, Math.PI * 2);
      g.fill();
      g.restore();
    });

    // Bahagyang maalikabok na lilim sa ilalim ng ulap (para hindi mukhang ulap na may ulan)
    var shade = g.createLinearGradient(0, h * 0.45, 0, h * 0.85);
    shade.addColorStop(0, "rgba(190, 150, 100, 0)");
    shade.addColorStop(1, "rgba(190, 150, 100, 0.22)");
    g.globalCompositeOperation = "source-atop";
    g.fillStyle = shade;
    g.fillRect(0, 0, w, h);

    return c;
  }

  /* ---------- Basag-basag na lupa ---------- */
  function crack(g, x, y, angle, len, width, depth) {
    if (len < 8 || depth > 5) return;
    var steps = Math.max(3, Math.floor(len / 14));
    g.beginPath();
    g.moveTo(x, y);
    for (var i = 0; i < steps; i++) {
      angle += rand(-0.45, 0.45);
      x += Math.cos(angle) * (len / steps);
      y += Math.sin(angle) * (len / steps);
      g.lineTo(x, y);
      // Sumasanga ang basag
      if (Math.random() < 0.28) {
        crack(g, x, y, angle + rand(0.5, 1.1) * (Math.random() < 0.5 ? -1 : 1),
              len * rand(0.35, 0.6), width * 0.7, depth + 1);
        g.moveTo(x, y);
      }
    }
    g.lineWidth = width;
    g.stroke();
  }

  function buildGround() {
    var gh = Math.ceil(H * SETTINGS.groundRatio);
    groundH = gh;
    groundCanvas = document.createElement("canvas");
    groundCanvas.width = Math.round(W * dpr);
    groundCanvas.height = Math.round(gh * dpr);
    var g = groundCanvas.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Kulay ng tuyong lupa
    var grad = g.createLinearGradient(0, 0, 0, gh);
    grad.addColorStop(0, "#d9a863");
    grad.addColorStop(1, "#a9702f");
    g.fillStyle = grad;

    // Hindi pantay ang gilid ng lupa (mababang burol)
    g.beginPath();
    g.moveTo(0, gh);
    var k = (Math.PI * 2) / (W * 0.9);
    for (var x = 0; x <= W; x += 10) {
      var y = gh * 0.16 + Math.sin(x * k) * gh * 0.07 + Math.sin(x * k * 2.7 + 1.1) * gh * 0.035;
      g.lineTo(x, y);
    }
    g.lineTo(W, gh);
    g.closePath();
    g.fill();

    // Mga basag
    g.save();
    g.clip();
    g.strokeStyle = "rgba(86, 52, 22, 0.55)";
    g.lineCap = "round";
    g.lineJoin = "round";
    var seeds = Math.max(14, Math.round(W / 55));
    for (var i = 0; i < seeds; i++) {
      crack(g, rand(0, W), rand(gh * 0.3, gh), rand(0, Math.PI * 2), rand(110, 230), rand(1.8, 3.2), 0);
    }

    // Maalikabok na liwanag sa gilid ng lupa (nasa loob pa rin ng clip, kaya hugis burol lang)
    var rim = g.createLinearGradient(0, 0, 0, gh * 0.4);
    rim.addColorStop(0, "rgba(255, 235, 190, 0.35)");
    rim.addColorStop(1, "rgba(255, 235, 190, 0)");
    g.fillStyle = rim;
    g.fillRect(0, 0, W, gh * 0.4);
    g.restore();
  }


  /* ---------- Tumbleweed ---------- */

  // Taas (y) ng ibabaw ng lupa sa isang x. Parehong formula ng burol sa buildGround()
  function surfaceY(x) {
    var k = (Math.PI * 2) / (W * 0.9);
    return H - groundH + groundH * 0.16 + Math.sin(x * k) * groundH * 0.07 + Math.sin(x * k * 2.7 + 1.1) * groundH * 0.035;
  }

  // Isang sanga: kurbadang guhit na may mga sumasanga (recursive), nakakulong sa loob ng bilog na R
  function twig(g, x, y, ang, len, w, depth, color, R) {
    var steps = Math.max(5, Math.floor(len / 7));
    var seg = len / steps;
    var branches = [];
    g.strokeStyle = color;
    g.lineWidth = w;
    g.beginPath();
    g.moveTo(x, y);
    for (var i = 0; i < steps; i++) {
      ang += rand(-0.32, 0.32);
      var nx = x + Math.cos(ang) * seg, ny = y + Math.sin(ang) * seg;
      if (Math.sqrt(nx * nx + ny * ny) > R * 1.04) break;   // huwag lalampas sa bilog
      g.lineTo(nx, ny);
      x = nx; y = ny;
      if (depth < 2 && i > 1 && Math.random() < 0.22) {
        branches.push([x, y, ang + rand(0.5, 1.2) * (Math.random() < 0.5 ? -1 : 1)]);
      }
    }
    g.stroke();
    for (var j = 0; j < branches.length; j++) {
      var br = branches[j];
      twig(g, br[0], br[1], br[2], len * rand(0.3, 0.5), w * 0.62, depth + 1, color, R);
    }
  }

  // Tumbleweed: siksik na bola ng magkakagusot na tuyong sanga, may mga singsing na nagbibigay ng hugis-bola
  function makeTumbleSprite() {
    var size = 256, c = document.createElement("canvas");
    c.width = size; c.height = size;
    var g = c.getContext("2d");
    var R = size * 0.42;
    g.translate(size / 2, size / 2);
    g.lineCap = "round";
    g.lineJoin = "round";
    var i, a;

    // 1. Madilim na gitna para may lalim at hindi butas-butas
    var core = g.createRadialGradient(0, 0, 0, 0, 0, R * 0.9);
    core.addColorStop(0, "rgba(58, 32, 10, 0.70)");
    core.addColorStop(0.7, "rgba(70, 40, 14, 0.30)");
    core.addColorStop(1, "rgba(70, 40, 14, 0)");
    g.fillStyle = core;
    g.beginPath(); g.arc(0, 0, R * 0.9, 0, Math.PI * 2); g.fill();

    // 2. Likurang layer: makakapal at madidilim na sanga mula sa gitna palabas
    for (i = 0; i < 30; i++) {
      a = rand(0, Math.PI * 2);
      var r0 = rand(0, 0.3) * R;
      twig(g, Math.cos(a) * r0, Math.sin(a) * r0, a + rand(-0.4, 0.4), R * rand(0.7, 1.0),
           rand(3.2, 4.6), 0, i % 2 ? "#4b2c0e" : "#5e3a14", R);
    }

    // 3. Mga singsing (mga arko sa palibot ng bola): ito ang nagbibigay ng hugis-bola
    for (i = 0; i < 18; i++) {
      g.save();
      g.rotate(rand(0, Math.PI));
      g.scale(1, rand(0.22, 0.95));
      var start = rand(0, Math.PI * 2);
      g.strokeStyle = ["#6e4519", "#7b4f1e", "#8a5a28"][i % 3];
      g.globalAlpha = rand(0.6, 0.95);
      g.lineWidth = rand(1.6, 3);
      g.beginPath();
      g.arc(0, 0, R * rand(0.72, 1.0), start, start + rand(2.2, 5.2));
      g.stroke();
      g.restore();
    }
    g.globalAlpha = 1;

    // 4. Gitnang layer: katamtamang sanga na may mga sumasanga
    for (i = 0; i < 34; i++) {
      a = rand(0, Math.PI * 2);
      var r1 = rand(0.1, 0.55) * R;
      twig(g, Math.cos(a) * r1, Math.sin(a) * r1, a + rand(-0.9, 0.9), R * rand(0.4, 0.75),
           rand(1.8, 2.8), 0, ["#7b4f1e", "#8a5a28", "#946027"][i % 3], R);
    }

    // 5. Pinakaharap na layer: manipis at mapusyaw na sanga (liwanag ng araw sa tuyong damo)
    for (i = 0; i < 46; i++) {
      a = rand(0, Math.PI * 2);
      var r2 = rand(0.3, 0.85) * R;
      twig(g, Math.cos(a) * r2, Math.sin(a) * r2, a + rand(-1.4, 1.4), R * rand(0.2, 0.5),
           rand(1.0, 1.8), 1, ["#b57d3a", "#c99a5a", "#d8b074"][i % 3], R);
    }

    // 6. Mga gulagulanit na dulo sa gilid, para hindi sakto ang bilog
    for (i = 0; i < 38; i++) {
      a = rand(0, Math.PI * 2);
      var r3 = R * rand(0.78, 0.95);
      twig(g, Math.cos(a) * r3, Math.sin(a) * r3, a + rand(-0.7, 0.7), R * rand(0.12, 0.28),
           rand(1.0, 1.6), 2, ["#946027", "#a97335", "#b57d3a"][i % 3], R * 1.12);
    }
    return c;
  }

  function makeTumble(startOnScreen) {
    var r = Math.max(26, Math.min(52, W * 0.032)) * rand(0.9, 1.15);   // mas malaki kaysa dati
    return {
      sprite: tumbleSprites[Math.floor(Math.random() * tumbleSprites.length)],
      r: r,
      x: startOnScreen ? rand(W * 0.1, W * 0.6) : -r * 2,
      v: rand(110, 170),         // bilis ng gulong (px/s) bago i-multiply sa hangin
      rot: rand(0, Math.PI * 2),
      h: 0,                      // taas ng talon mula sa lupa
      vh: 0,                     // bilis ng pagtalon (pataas/pababa)
      sq: 0,                     // "pisa" pagbagsak sa lupa (0 = wala, 1 = pinakamalakas)
      hopTimer: rand(0.4, 1.4),  // hintay bago ang susunod na talon
      wait: startOnScreen ? 0 : rand(1, 5)   // hintay bago pumasok sa screen
    };
  }

  function updateTumble(i, dt, wnd) {
    var t = tumbles[i];
    if (t.wait > 0) { t.wait -= dt; return; }

    t.x += t.v * wnd * dt;
    t.rot += (t.v * wnd * dt) / t.r;   // gumugulong: ang ikot ay kasukat ng layo ng takbo

    // Talon: tuloy-tuloy na tumatalbog. Mas mataas ang talon kapag malakas ang hangin.
    t.hopTimer -= dt;
    if (t.h <= 0 && t.vh <= 0 && t.hopTimer <= 0) {
      t.vh = rand(300, 450) * (0.8 + 0.25 * Math.min(wnd, 1.6));
      t.hopTimer = rand(0.9, 2.0);
    }
    t.vh -= 900 * dt;                  // gravity
    t.h += t.vh * dt;
    if (t.h <= 0) {
      t.h = 0;
      if (t.vh < -60) {                // tumama sa lupa: pumipisa at tumatalbog ulit (humihina bawat talbog)
        t.sq = Math.min(1, -t.vh / 380);
        t.vh = -t.vh * 0.5;
      } else {
        t.vh = 0;
      }
    }
    t.sq = Math.max(0, t.sq - dt * 5);

    if (t.x - t.r * 2 > W) tumbles[i] = makeTumble(false);   // lumabas sa kanan: gagawa ng bago
  }

  function drawTumbles() {
    for (var i = 0; i < tumbles.length; i++) {
      var t = tumbles[i];
      if (t.wait > 0) continue;
      var gy = surfaceY(t.x);
      var y = gy - t.r * 0.84 - t.h;

      // Anino sa lupa: lumiliit at lumalabo kapag mataas ang talon
      var lift = Math.min(1, t.h / 110);
      ctx.save();
      ctx.translate(t.x, gy + 2);
      ctx.scale(1 - lift * 0.4, 0.22);
      ctx.fillStyle = "rgba(60, 35, 12, " + (0.34 * (1 - lift * 0.65)) + ")";
      ctx.beginPath();
      ctx.arc(0, 0, t.r * 0.95, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Pisa pagbagsak: lumalapad at pumapayat sandali, nakadikit pa rin ang ilalim sa lupa
      var sx = 1 + t.sq * 0.16, sy = 1 - t.sq * 0.16;
      ctx.save();
      ctx.translate(t.x, y + t.r * t.sq * 0.16);
      ctx.scale(sx, sy);
      ctx.rotate(t.rot);
      ctx.drawImage(t.sprite, -t.r * 1.14, -t.r * 1.14, t.r * 2.28, t.r * 2.28);   // may kaunting sobra ang sprite para sa mga dulo
      ctx.restore();
    }
  }

  /* ---------- Gumawa ng mga bagay ---------- */
  function makeCloud(layerIndex, startAnywhere) {
    var L = LAYERS[layerIndex];
    var sprite = cloudSprites[Math.floor(Math.random() * cloudSprites.length)];
    var w = sprite.width * L.scale * (W < 700 ? 0.6 : 1);
    return {
      layer: layerIndex,
      sprite: sprite,
      w: w,
      h: sprite.height * L.scale * (W < 700 ? 0.6 : 1),
      x: startAnywhere ? rand(-w, W) : -w - rand(0, 200),   // pumapasok mula sa kaliwa
      y: rand(L.yMin, L.yMax) * H,
      bob: rand(0, Math.PI * 2),
      bobAmp: rand(3, 9),
      speedMul: rand(0.8, 1.2)
    };
  }

  function makeDust(startAnywhere) {
    return {
      x: startAnywhere ? rand(0, W) : -rand(10, 60),
      y: rand(H * 0.15, H * 0.97),
      r: rand(0.8, 2.6),
      v: rand(60, 170),              // bilis ng pagtangay
      wob: rand(0, Math.PI * 2),
      wobAmp: rand(4, 16),
      a: rand(0.22, 0.5)
    };
  }

  function makeLeaf(startAnywhere) {
    return {
      x: startAnywhere ? rand(0, W) : -rand(20, 120),
      y: rand(H * 0.55, H * 0.95),
      size: rand(6, 11),
      v: rand(90, 190),
      rot: rand(0, Math.PI * 2),
      rotV: rand(2, 5),
      wob: rand(0, Math.PI * 2),
      wobAmp: rand(10, 30),
      hue: Math.random() < 0.5 ? "#9a6a2c" : "#b88542"
    };
  }

  function makeStreak(startAnywhere) {
    return {
      x: startAnywhere ? rand(0, W) : -rand(100, 300),
      y: rand(H * 0.08, H * 0.85),
      len: rand(70, 190),
      v: rand(380, 620),
      a: rand(0.10, 0.22)
    };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!cloudSprites.length) {
      for (var s = 0; s < 4; s++) cloudSprites.push(makeCloudSprite());
    }

    var small = Math.min(1, W / 1200);
    clouds = [];
    LAYERS.forEach(function (L, li) {
      var n = Math.max(1, Math.round(SETTINGS.cloudsPerLayer[li] * (W < 700 ? 0.7 : 1)));
      for (var i = 0; i < n; i++) clouds.push(makeCloud(li, true));
    });
    // Ang pinakamalayong layer ang unang iguguhit
    clouds.sort(function (a, b) { return a.layer - b.layer; });

    dust = []; leaves = []; streaks = [];
    for (var d = 0; d < Math.max(20, Math.round(SETTINGS.dustCount * small)); d++) dust.push(makeDust(true));
    for (var l = 0; l < Math.max(3, Math.round(SETTINGS.leafCount * small)); l++) leaves.push(makeLeaf(true));
    for (var k = 0; k < Math.max(4, Math.round(SETTINGS.streakCount * small)); k++) streaks.push(makeStreak(true));

    buildGround();

    if (!tumbleSprites.length) {
      for (var ts = 0; ts < 3; ts++) tumbleSprites.push(makeTumbleSprite());
    }
    tumbles = [];
    for (var tw = 0; tw < SETTINGS.tumbleweedCount; tw++) tumbles.push(makeTumble(tw === 0));
  }

  /* ---------- Pagguhit ---------- */
  function drawSky(t) {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, SETTINGS.skyTop);
    g.addColorStop(0.55, SETTINGS.skyMid);
    g.addColorStop(1, SETTINGS.skyBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Mainit na araw na malabo dahil sa alikabok. Bahagyang pumipintig ang liwanag.
    var pulse = 1 + Math.sin(t * 0.6) * 0.04;
    var sx = W * 0.82, sy = H * 0.16, sr = Math.min(W, H) * 0.42 * pulse;
    var sun = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
    sun.addColorStop(0, "rgba(255, 246, 214, 0.95)");
    sun.addColorStop(0.12, "rgba(255, 232, 160, 0.65)");
    sun.addColorStop(0.45, "rgba(255, 210, 130, 0.22)");
    sun.addColorStop(1, "rgba(255, 200, 120, 0)");
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, W, H);
  }

  function drawClouds(t, dt, wnd) {
    for (var i = 0; i < clouds.length; i++) {
      var c = clouds[i];
      var L = LAYERS[c.layer];
      c.x += L.speed * c.speedMul * wnd * dt;
      if (c.x > W + 40) { clouds[i] = makeCloud(c.layer, false); continue; }
      var y = c.y + Math.sin(t * 0.5 + c.bob) * c.bobAmp;
      // Kapag malakas ang hangin, lalong humahaba (nauunat) ang ulap
      var stretch = 1 + Math.max(0, wnd - 1) * 0.12;
      ctx.globalAlpha = L.alpha;
      ctx.drawImage(c.sprite, c.x, y, c.w * stretch, c.h);
    }
    ctx.globalAlpha = 1;
  }

  function drawStreaks(dt, wnd) {
    ctx.lineCap = "round";
    ctx.lineWidth = 1.4;
    for (var i = 0; i < streaks.length; i++) {
      var s = streaks[i];
      s.x += s.v * wnd * dt;
      if (s.x - s.len > W) { streaks[i] = makeStreak(false); continue; }
      var g = ctx.createLinearGradient(s.x - s.len, 0, s.x, 0);
      g.addColorStop(0, "rgba(255, 255, 255, 0)");
      g.addColorStop(1, "rgba(255, 255, 255, " + (s.a * Math.min(1, wnd)) + ")");
      ctx.strokeStyle = g;
      ctx.beginPath();
      ctx.moveTo(s.x - s.len, s.y);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();
    }
  }

  function drawDust(t, dt, wnd) {
    for (var i = 0; i < dust.length; i++) {
      var d = dust[i];
      d.x += d.v * wnd * dt;
      if (d.x > W + 10) { dust[i] = makeDust(false); continue; }
      var y = d.y + Math.sin(t * 1.6 + d.wob) * d.wobAmp;
      ctx.beginPath();
      ctx.arc(d.x, y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(176, 124, 62, " + d.a + ")";
      ctx.fill();
    }
  }

  function drawLeaves(t, dt, wnd) {
    for (var i = 0; i < leaves.length; i++) {
      var f = leaves[i];
      f.x += f.v * wnd * dt;
      f.rot += f.rotV * wnd * dt;
      if (f.x > W + 30) { leaves[i] = makeLeaf(false); continue; }
      var y = f.y + Math.sin(t * 2 + f.wob) * f.wobAmp;
      ctx.save();
      ctx.translate(f.x, y);
      ctx.rotate(f.rot);
      ctx.fillStyle = f.hue;
      ctx.beginPath();
      ctx.ellipse(0, 0, f.size, f.size * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(70, 42, 16, 0.55)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-f.size, 0);
      ctx.lineTo(f.size, 0);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawGround() {
    if (!groundCanvas) return;
    var gh = groundCanvas.height / dpr;
    ctx.drawImage(groundCanvas, 0, H - gh, W, gh);
  }

  function frame(t, dt) {
    var wnd = wind(t);
    ctx.clearRect(0, 0, W, H);
    drawSky(t);
    drawClouds(t, dt, wnd);
    drawStreaks(dt, wnd);
    drawGround();
    for (var ti = 0; ti < tumbles.length; ti++) updateTumble(ti, dt, wnd);
    drawTumbles();
    drawDust(t, dt, wnd);
    drawLeaves(t, dt, wnd);
  }

  resize();
  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { resize(); if (reduceMotion) frame(0, 0); }, 150);
  });

  // Kung ayaw ng user ng animation: isang still na larawan lang
  if (reduceMotion) { frame(0, 0); return; }

  var last = null, clock = 0;
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
