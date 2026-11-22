/* =====================================================================
   ANIMATED SKY BACKGROUND (Interactive page lang)

   Pamalit sa dating tuyong (dry) background. Blue na ito para pareho ang
   dating ng Home, Learn, at About Us.

   Ano ang makikita:
   1. Asul na langit (mas matingkad sa taas, mas maputla sa baba) na may malambot na liwanag.
   2. Mga puting ulap na dahan-dahang inililipad ng hangin. Tatlong layer ng lalim:
      mas malayo = mas maliit, mas mabagal, mas malabo.
   3. Mga kulay-abong-asul na ulap na umuulan. Pabago-bago ang lakas: minsan ambon, minsan
      mas malakas na ulan.
   4. Ang ulan ay bumabagsak papunta sa tubig sa ilalim ng screen at gumagawa ng maliliit na ripple.
   5. Dalawang layer ng mahinahong alon sa baba (kapareho ng About Us).

   Naka-fixed sa likod ng page (hindi gumagalaw kapag nag-scroll). Nasa ibabaw nito
   ang mga navy na panel kaya mababasa pa rin ang lahat.
   Kapag naka-"reduce motion" ang device ng user, isang still na larawan lang ang ilalabas.
   ===================================================================== */
(function () {
  "use strict";

  // ----- SETTINGS (pwedeng baguhin) -----
  var SETTINGS = {
    // Ang kulay ng langit (gradient + liwanag) ay nasa CSS na (body::before sa css/interactive.css),
    // hindi na iginuguhit dito kada frame. Doon palitan kung gusto ng ibang kulay.
    fps: 30,                    // pinakamataas na frame rate ng animation (mas mababa = mas magaan ang pag-scroll)
    maxPixels: 1400000,         // limitasyon ng pixel ng canvas (malabo naman ang ulap at ulan kaya hindi halata)
    maxDpr: 1,                  // huwag gumamit ng higit sa 1x resolution ng canvas
    cloudsPerLayer: [3, 3, 2],  // ilang puting ulap sa bawat layer (likod -> harap)
    rainClouds: 2,              // ilang ulap na umuulan (0 = walang ulan)
    rainRate: 140,              // dami ng patak bawat segundo sa bawat ulap sa pinakamalakas na ulan
    maxDrops: 500,              // limitasyon ng patak sa screen (para magaan)
    waterRatio: 0.12,           // taas ng tubig sa baba (porsyento ng taas ng screen)
    windBase: 1,                // 1 = normal na hangin, 0.5 = mahina, 2 = malakas
    speed: 1                    // bilis ng buong animation
  };

  // Mga layer ng puting ulap: scale (laki), speed (bilis, px/s), alpha (labo), y (saan sa taas, ratio)
  var LAYERS = [
    { scale: 0.70, speed: 7,  alpha: 0.55, yMin: 0.03, yMax: 0.30 },
    { scale: 1.00, speed: 13, alpha: 0.75, yMin: 0.10, yMax: 0.42 },
    { scale: 1.40, speed: 22, alpha: 0.90, yMin: 0.20, yMax: 0.50 }
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

  var W = 0, H = 0, dpr = 1, sizeScale = 1;
  var clouds = [], rainClouds = [], drops = [], ripples = [];
  var whiteSprites = [], rainSprites = [];

  function rand(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ---------- Hangin: banayad, may kaunting pabugso ---------- */
  function wind(t) {
    var w = 1 + 0.25 * Math.sin(t * 0.3) + 0.1 * Math.sin(t * 0.8 + 1.1);
    return w * SETTINGS.windBase;
  }

  /* ---------- Ulap: ginuhit muna sa maliit na canvas (sprite) para magaan ---------- */
  function makeCloudSprite(kind) {
    var w = 520, h = 210;
    var c = document.createElement("canvas");
    c.width = w; c.height = h;
    var g = c.getContext("2d");
    var isRain = kind === "rain";
    var baseY = h * 0.70;     // ang "sahig" ng ulap

    var puffs = [];
    var n = 8 + Math.floor(Math.random() * 3);
    for (var i = 0; i < n; i++) {
      var t = i / (n - 1);
      var hf = Math.sin(Math.PI * t);                       // mas mataas sa gitna
      var ry = 28 + 40 * hf + rand(-6, 6);
      puffs.push({
        x: w * 0.12 + t * w * 0.76 + rand(-14, 14),
        y: baseY - ry * 0.55 - hf * 16,
        rx: 48 + 32 * hf + rand(-8, 8),
        ry: ry,
        a: rand(0.7, 0.95)
      });
    }
    // Mga mababang puff sa ilalim para medyo patag ang ilalim ng ulap
    for (var j = 0; j < 6; j++) {
      puffs.push({
        x: w * 0.16 + j * (w * 0.68 / 5) + rand(-10, 10),
        y: baseY - 10,
        rx: rand(52, 70),
        ry: rand(16, 22),
        a: 0.85
      });
    }

    puffs.forEach(function (p) {
      g.save();
      g.translate(p.x, p.y);
      g.scale(p.rx, p.ry);
      var grad = g.createRadialGradient(0, -0.25, 0, 0, 0, 1);
      if (isRain) {
        grad.addColorStop(0, "rgba(168, 192, 210, " + p.a + ")");
        grad.addColorStop(0.6, "rgba(128, 156, 180, " + (p.a * 0.65) + ")");
        grad.addColorStop(1, "rgba(96, 126, 154, 0)");
      } else {
        grad.addColorStop(0, "rgba(255, 255, 255, " + p.a + ")");
        grad.addColorStop(0.6, "rgba(240, 250, 255, " + (p.a * 0.6) + ")");
        grad.addColorStop(1, "rgba(210, 235, 245, 0)");
      }
      g.fillStyle = grad;
      g.beginPath();
      g.arc(0, 0, 1, 0, Math.PI * 2);
      g.fill();
      g.restore();
    });

    // Lilim sa ilalim ng ulap (mas madilim sa ulap na umuulan)
    var shade = g.createLinearGradient(0, h * 0.35, 0, baseY + 14);
    if (isRain) {
      shade.addColorStop(0, "rgba(50, 78, 104, 0)");
      shade.addColorStop(1, "rgba(50, 78, 104, 0.42)");
    } else {
      shade.addColorStop(0, "rgba(120, 170, 200, 0)");
      shade.addColorStop(1, "rgba(120, 170, 200, 0.20)");
    }
    g.globalCompositeOperation = "source-atop";
    g.fillStyle = shade;
    g.fillRect(0, 0, w, h);

    c.baseRatio = baseY / h;  // saan nasa sprite ang ilalim ng ulap (para dito lumabas ang ulan)
    return c;
  }

  function buildSprites() {
    whiteSprites = [];
    rainSprites = [];
    for (var i = 0; i < 3; i++) whiteSprites.push(makeCloudSprite("white"));
    for (var j = 0; j < 2; j++) rainSprites.push(makeCloudSprite("rain"));
  }

  /* ---------- Gumawa ng mga ulap ---------- */
  function makeCloud(layer, startAnywhere) {
    var L = LAYERS[layer];
    var sprite = whiteSprites[Math.floor(Math.random() * whiteSprites.length)];
    var w = sprite.width * L.scale * sizeScale;
    var h = sprite.height * L.scale * sizeScale;
    return {
      layer: layer,
      sprite: sprite,
      w: w, h: h,
      x: startAnywhere ? rand(-w, W) : -w - rand(0, 200),
      y: rand(L.yMin, L.yMax) * H,
      speedMul: rand(0.8, 1.2),
      bob: rand(0, Math.PI * 2),
      bobAmp: rand(3, 8)
    };
  }

  function makeRainCloud(i, total, startAnywhere) {
    var sprite = rainSprites[i % rainSprites.length];
    var scale = rand(1.15, 1.45) * sizeScale;
    var w = sprite.width * scale;
    var h = sprite.height * scale;
    return {
      sprite: sprite,
      w: w, h: h,
      x: startAnywhere ? (i + 0.15 + rand(0, 0.35)) * (W / total) - w / 2 : -w - rand(0, 200),
      y: rand(0.02, 0.12) * H,
      speed: rand(9, 14),
      phase: rand(0, Math.PI * 2),   // iba-iba ang oras ng lakas/hina ng ulan ng bawat ulap
      bob: rand(0, Math.PI * 2),
      emit: 0
    };
  }

  function seed() {
    clouds = [];
    rainClouds = [];
    SETTINGS.cloudsPerLayer.forEach(function (count, layer) {
      for (var i = 0; i < count; i++) clouds.push(makeCloud(layer, true));
    });
    for (var r = 0; r < SETTINGS.rainClouds; r++) {
      rainClouds.push(makeRainCloud(r, SETTINGS.rainClouds, true));
    }
  }

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    // Limitado ang dami ng pixel ng canvas (SETTINGS.maxPixels). Sa malalaking o high-DPI na screen, bumibigat ang pag-scroll
    // kapag buong resolution ang iginuguhit kada frame. Malabo na rin naman ang ulap at ulan kaya hindi halata.
    dpr = Math.min(window.devicePixelRatio || 1, SETTINGS.maxDpr, Math.sqrt(SETTINGS.maxPixels / (W * H)));
    sizeScale = clamp(W / 1280, 0.55, 1.15);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!whiteSprites.length) buildSprites();
    drops = [];
    ripples = [];
    seed();
  }

  /* ---------- Lakas ng ulan: pabago-bago (ambon <-> malakas) ---------- */
  function intensity(rc, t) {
    return 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 0.22 + rc.phase));
  }

  /* ---------- UPDATE ---------- */
  function update(t, dt) {
    var wnd = wind(t);
    var waterTop = H * (1 - SETTINGS.waterRatio);
    var i;

    // Puting ulap
    for (i = 0; i < clouds.length; i++) {
      var c = clouds[i];
      c.x += LAYERS[c.layer].speed * c.speedMul * wnd * dt;
      if (c.x > W + 40) clouds[i] = makeCloud(c.layer, false);
    }

    // Ulap na umuulan + pagbuo ng patak
    for (i = 0; i < rainClouds.length; i++) {
      var rc = rainClouds[i];
      rc.x += rc.speed * wnd * dt;
      if (rc.x > W + 40) { rainClouds[i] = rc = makeRainCloud(i, rainClouds.length, false); }

      rc.emit += SETTINGS.rainRate * intensity(rc, t) * dt;
      var baseY = rc.y + Math.sin(t * 0.4 + rc.bob) * 6 + rc.h * rc.sprite.baseRatio - 14 * sizeScale;
      while (rc.emit >= 1) {
        rc.emit -= 1;
        if (drops.length >= SETTINGS.maxDrops) break;
        drops.push({
          x: rc.x + rand(0.2, 0.8) * rc.w,
          y: baseY + rand(-6, 8),
          vy: rand(520, 760) * (0.8 + 0.2 * sizeScale),
          len: rand(10, 20) * sizeScale + 4,
          endY: rand(waterTop + 10, H - 6)
        });
      }
    }

    // Patak
    for (i = drops.length - 1; i >= 0; i--) {
      var d = drops[i];
      d.y += d.vy * dt;
      d.x += d.vy * 0.10 * wnd * dt;     // sumisilip ang ulan dahil sa hangin
      if (d.y >= d.endY) {
        if (ripples.length < 120) {
          ripples.push({ x: d.x, y: d.endY, r: 1, max: rand(10, 22) * sizeScale + 4, life: 0 });
        }
        drops[i] = drops[drops.length - 1];
        drops.pop();
      }
    }

    // Ripple
    for (i = ripples.length - 1; i >= 0; i--) {
      var r = ripples[i];
      r.life += dt / 0.9;                 // 0.9 segundo ang buhay ng ripple
      r.r = 1 + (r.max - 1) * r.life;
      if (r.life >= 1) {
        ripples[i] = ripples[ripples.length - 1];
        ripples.pop();
      }
    }
  }

  /* ---------- DRAW ---------- */
  function drawWhiteLayer(layer, t) {
    var L = LAYERS[layer];
    ctx.globalAlpha = L.alpha;
    for (var i = 0; i < clouds.length; i++) {
      var c = clouds[i];
      if (c.layer !== layer) continue;
      var y = c.y + Math.sin(t * 0.4 + c.bob) * c.bobAmp;
      ctx.drawImage(c.sprite, c.x, y, c.w, c.h);
    }
    ctx.globalAlpha = 1;
  }

  function drawRainClouds(t) {
    ctx.globalAlpha = 0.95;
    for (var i = 0; i < rainClouds.length; i++) {
      var rc = rainClouds[i];
      var y = rc.y + Math.sin(t * 0.4 + rc.bob) * 6;
      ctx.drawImage(rc.sprite, rc.x, y, rc.w, rc.h);
    }
    ctx.globalAlpha = 1;
  }

  function drawDrops(t) {
    if (!drops.length) return;
    var wnd = wind(t);
    ctx.lineCap = "round";
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = "rgba(235, 248, 255, 0.55)";
    ctx.beginPath();
    for (var i = 0; i < drops.length; i++) {
      var d = drops[i];
      var slant = 0.10 * wnd;                       // pareho ng paggalaw sa update()
      ctx.moveTo(d.x - d.len * slant, d.y - d.len);
      ctx.lineTo(d.x, d.y);
    }
    ctx.stroke();
  }

  function drawWater(t) {
    var top = H * (1 - SETTINGS.waterRatio);
    var bandH = H - top;
    var layers = [
      { color: "rgba(36, 151, 184, 0.38)", amp: 5, len: 0.9, speed: 0.5,  off: 0.0, base: 0.00 },
      { color: "rgba(23, 87, 125, 0.42)",  amp: 4, len: 1.3, speed: -0.7, off: 2.3, base: 0.30 }
    ];
    for (var l = 0; l < layers.length; l++) {
      var L = layers[l];
      var k = (Math.PI * 2) / (W * L.len);
      ctx.fillStyle = L.color;
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (var x = 0; x <= W + 12; x += 12) {
        var y = top + bandH * L.base + Math.sin(x * k + t * L.speed + L.off) * L.amp * sizeScale;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawRipples() {
    if (!ripples.length) return;
    ctx.lineWidth = 1.2;
    for (var i = 0; i < ripples.length; i++) {
      var r = ripples[i];
      ctx.strokeStyle = "rgba(235, 248, 255, " + (0.6 * (1 - r.life)) + ")";
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, r.r, r.r * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function draw(t) {
    // Transparent ang canvas: ang langit (gradient at liwanag) ay galing sa body::before sa CSS,
    // kaya hindi na kailangang punuin ng canvas ang buong screen kada frame.
    ctx.clearRect(0, 0, W, H);
    drawWhiteLayer(0, t);
    drawWhiteLayer(1, t);
    drawRainClouds(t);
    drawWhiteLayer(2, t);
    drawDrops(t);
    drawWater(t);
    drawRipples();
  }

  /* ---------- Simula ---------- */
  resize();

  // Painitin muna ang ulan nang ilang segundo para hindi biglang magsimula pagbukas ng page
  var clock = 0;
  for (var s = 0; s < 70; s++) { clock += 0.05; update(clock, 0.05); }

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resize();
      for (var k = 0; k < 70; k++) { clock += 0.05; update(clock, 0.05); }
      if (reduceMotion) draw(clock);
    }, 150);
  });

  // Kung ayaw ng user ng animation: isang still na larawan lang
  if (reduceMotion) { draw(clock); return; }

  // Naka-limit sa SETTINGS.fps (30). Ang galaw ay nakabase sa oras (dt), kaya pareho pa rin ang bilis ng ulap at ulan;
  // mas kaunti lang ang iginuguhit, kaya may natitirang oras ang browser para sa makinis na pag-scroll.
  var FRAME_MS = 1000 / SETTINGS.fps;
  var last = null;

  // Habang buhay (na-click) ang mapa ng PAGASA, humihinto ang langit para hindi magsabay ang dalawang mabigat na iginuguhit.
  // Ang event ay galing sa js/map-freeze.js. Bumabalik ang galaw kapag na-freeze ulit ang mapa.
  var paused = false;
  document.addEventListener("agos:map-live", function (e) {
    paused = !!(e.detail);
    if (!paused) last = null;   // para hindi tumalon ang oras pagbalik
  });

  function loop(now) {
    requestAnimationFrame(loop);
    if (paused) return;
    if (last === null) { last = now; return; }
    if (now - last < FRAME_MS - 2) return;   // laktawan ang frame na hindi pa oras (may 2ms na luwag para sa 60Hz screen)
    var dt = Math.min((now - last) / 1000, 0.1) * SETTINGS.speed;  // limitado para hindi tumalon pagbalik sa tab
    last = now;
    clock += dt;
    update(clock, dt);
    draw(clock);
  }
  requestAnimationFrame(loop);
})();
