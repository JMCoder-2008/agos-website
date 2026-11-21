/* =====================================================================
   WATER DROP ANIMATION (Learn page lang)

   Paano gumagana:
   1. Sa dulo ng dahon (yung nakasabit na patak) lumalaki ang isang bagong patak.
   2. Kapag buo na, bumabagsak ito (may gravity, bumibilis habang pababa).
   3. Pagdating sa PINAKABABA NG SCREEN (hindi ng buong page), may splash:
      ripple + talsik ng maliliit na patak.
   4. Pagkatapos, may panibago na ulit na patak. Walang tigil hangga't nasa page ka.

   Scroll:
   - Ang dahon ay bahagi ng page (nag-i-scroll kasama ng page), pero ang splash ay
     laging nasa ilalim ng screen.
   - Kapag nag-scroll ka pababa, umaakyat ang dahon at ang patak na nasa ere; ang
     splash ay nananatili sa ilalim ng screen.
   - Kapag nag-scroll ka pataas, bumababa ang dahon at ang patak; sasaluhin ito ng
     ilalim ng screen at magsa-splash.

   Responsive: lahat ng sukat (laki ng patak, ripple, talsik, bilis) ay galing sa
   laki ng dahon at taas ng screen, kaya gumagana sa kahit anong device.
   Ang laki/posisyon ng dahon ay HINDI ginagalaw nito: binabasa lang mula sa learn.css.
   ===================================================================== */
(function () {
  "use strict";

  // Kung ayaw ng user ng animation (accessibility setting), huwag nang ituloy
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // ----- SETTINGS (pwedeng baguhin) -----
  var SETTINGS = {
    dropWidthPerLeafPx: 68,  // lapad ng bumabagsak na patak, sukat sa 640px na orihinal na dahon (mas malaki = mas malaking patak)
    growSeconds: 1.1,        // gaano katagal lumaki ang patak sa dulo ng dahon bago bumagsak
    gravityPerScreen: 2.6,   // bilis ng bagsak (x taas ng screen kada segundo kada segundo)
    groundOffset: 6,         // layo (px) ng splash mula sa pinakababa ng screen
    ripples: 3,              // ilang ring ng ripple
    sprayCount: 11           // ilang talsik na patak
  };

  // ----- Sukat ng dahon na larawan (images/learn-leaf.webp) at kung saan ang dulo ng nakasabit na patak -----
  var LEAF_IMG_W = 640;
  var LEAF_IMG_H = 1112;
  var TIP_X = 122;   // gitna ng patak sa dahon (x, sa pixels ng orihinal na larawan)
  var TIP_Y = 746;   // pinakababang dulo ng patak sa dahon (y, sa pixels ng orihinal na larawan)

  var canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText =
    "position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:-1;";
  document.body.appendChild(canvas);
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var sprite = new Image();
  var spriteReady = false;
  sprite.onload = function () { spriteReady = true; };
  sprite.src = "images/water-drop.webp";

  // Pantulong na element para mabasa ang aktwal na sukat ng dahon (vw, px, atbp.) mula sa CSS variables
  var probe = document.createElement("div");
  probe.setAttribute("aria-hidden", "true");
  probe.style.cssText =
    "position:absolute;visibility:hidden;pointer-events:none;height:0;left:0;top:0;";
  document.body.appendChild(probe);

  function cssPx(varName) {
    probe.style.width = "var(" + varName + ")";
    return probe.getBoundingClientRect().width;
  }

  var dpr = 1, W = 0, H = 0;
  var leaf = { scale: 1, left: 0, topPage: 0, tipX: 0, tipPageY: 0, dropW: 20, dropH: 30 };

  function measure() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);

    var leafW = cssPx("--leaf-width");
    var leafRight = cssPx("--leaf-right");
    var leafTop = cssPx("--leaf-top");
    var docW = document.documentElement.clientWidth; // walang scrollbar

    leaf.scale = leafW / LEAF_IMG_W;
    leaf.left = docW - leafRight - leafW;
    leaf.topPage = leafTop;
    leaf.tipX = leaf.left + TIP_X * leaf.scale;
    leaf.tipPageY = leafTop + TIP_Y * leaf.scale;

    leaf.dropW = Math.max(14, SETTINGS.dropWidthPerLeafPx * leaf.scale);
    var ratio = spriteReady ? sprite.naturalHeight / sprite.naturalWidth : 1.5;
    leaf.dropH = leaf.dropW * ratio;
  }

  window.addEventListener("resize", measure);
  window.addEventListener("load", measure);
  if (window.ResizeObserver) new ResizeObserver(measure).observe(document.documentElement);
  measure();

  // ----- STATE -----
  var drop = { phase: "grow", t: 0, y: 0, vy: 0 };   // y = ibabaw ng patak, sa viewport
  var splashes = [];
  var lastScroll = window.scrollY;
  var lastTime = 0;

  function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function gravity() { return H * SETTINGS.gravityPerScreen; }
  function groundY() { return H - SETTINGS.groundOffset; }
  function tipViewY() { return leaf.tipPageY - window.scrollY; }

  function startDrop() {
    // Laging may paglaki muna (kahit nasa labas ng screen ang dahon) para pareho ang tiyempo ng bawat patak,
    // gaano man kalayo ang na-scroll
    drop.phase = "grow";
    drop.t = 0;
    drop.vy = 0;
  }

  function makeSplash(x, y, power) {
    var u = leaf.dropW;
    var s = { t: 0, x: x, y: y, power: power, u: u, parts: [], ripples: [] };

    for (var i = 0; i < SETTINGS.ripples; i++) {
      s.ripples.push({ delay: i * 0.13, maxR: u * (3.6 + i * 1.5) * power });
    }

    // Gitnang talsik pataas (mas malaki) + mga talsik sa gilid
    var g = gravity() * 0.85;
    s.g = g;
    s.parts.push({
      x: x, y: y - u * 0.3, vx: rand(-12, 12) * (u / 22), vy: -rand(0.95, 1.1) * Math.sqrt(2 * g * H * 0.16) * power,
      size: 0.7, life: 0
    });
    for (var j = 0; j < SETTINGS.sprayCount; j++) {
      var side = j % 2 === 0 ? -1 : 1;
      var ang = rand(0.25, 1.15);                       // anggulo mula sa pahalang
      var sp = rand(0.55, 1.0) * Math.sqrt(2 * g * H * 0.12) * power;
      s.parts.push({
        x: x + side * rand(0, u * 0.5),
        y: y - u * 0.1,
        vx: side * Math.cos(ang) * sp * rand(0.5, 0.9),
        vy: -Math.sin(ang) * sp,
        size: rand(0.26, 0.5),
        life: 0
      });
    }
    // Maliliit na ambon
    for (var k = 0; k < 8; k++) {
      var sd = Math.random() < 0.5 ? -1 : 1;
      s.parts.push({
        x: x + sd * rand(0, u),
        y: y,
        vx: sd * rand(20, 160) * (u / 22),
        vy: -rand(120, 360) * (H / 800),
        size: rand(0.07, 0.13),
        mist: true,
        life: 0
      });
    }
    splashes.push(s);
  }

  // ----- DRAW -----
  function drawDrop(cx, topY, sx, sy, alpha) {
    var w = leaf.dropW * sx, h = leaf.dropH * sy;
    ctx.globalAlpha = alpha;
    ctx.drawImage(sprite, cx - w / 2, topY, w, h);
  }

  function drawSplash(s, dt) {
    s.t += dt;
    var t = s.t;
    var u = s.u;

    // Saglit na liwanag sa tama
    if (t < 0.22) {
      var fa = (1 - t / 0.22) * 0.35 * s.power;
      var fr = u * (1.2 + t * 8);
      var grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, fr);
      grad.addColorStop(0, "rgba(255,255,255," + fa + ")");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.globalAlpha = 1;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, fr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ripples (pahabang bilog na lumalaki at nawawala)
    var RIPPLE_LIFE = 1.15;
    var alive = t < 0.13 * SETTINGS.ripples + RIPPLE_LIFE;
    for (var i = 0; i < s.ripples.length; i++) {
      var r = s.ripples[i];
      var p = (t - r.delay) / RIPPLE_LIFE;
      if (p <= 0 || p >= 1) continue;
      var e = easeOutCubic(p);
      var rx = 3 + r.maxR * e;
      var ry = rx * 0.3;
      var a = (1 - p) * (1 - p) * 0.85;
      ctx.globalAlpha = 1;
      ctx.lineWidth = Math.max(1, (2.6 - 1.6 * p) * (u / 22));
      ctx.strokeStyle = "rgba(255,255,255," + a + ")";
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      // Manipis na mas matingkad na ring sa loob para magmukhang tubig
      ctx.lineWidth = Math.max(0.6, 1 * (u / 22));
      ctx.strokeStyle = "rgba(190,240,250," + a * 0.8 + ")";
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, rx * 0.86, ry * 0.86, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Mga talsik
    for (var n = 0; n < s.parts.length; n++) {
      var q = s.parts[n];
      if (q.done) continue;
      q.life += dt;
      q.vy += s.g * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      var gone = q.y > s.y + u * 0.6 && q.vy > 0;
      if (gone) { q.done = true; continue; }
      alive = true;

      // Humihina habang pababa
      var fade = q.vy > 0 ? Math.max(0, 1 - (q.y - (s.y - u * 3)) / (u * 3.6)) : 1;
      var pw = leaf.dropW * q.size;
      var ph = pw * (leaf.dropH / leaf.dropW);
      ctx.save();
      ctx.translate(q.x, q.y);
      // Ang dulo ng patak ay nakaturo sa direksyon ng galaw
      ctx.rotate(Math.atan2(q.vy, q.vx) + Math.PI / 2);
      if (q.mist) {
        ctx.globalAlpha = 0.55 * fade;
        ctx.fillStyle = "rgba(255,255,255,1)";
        ctx.beginPath();
        ctx.arc(0, 0, pw * 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.globalAlpha = Math.min(1, fade * 1.1);
        ctx.drawImage(sprite, -pw / 2, -ph / 2, pw, ph);
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    return alive;
  }

  // ----- LOOP -----
  function frame(now) {
    requestAnimationFrame(frame);
    if (!spriteReady) { lastTime = now; return; }

    var dt = lastTime ? (now - lastTime) / 1000 : 0.016;
    lastTime = now;
    if (dt > 0.05) dt = 0.05;   // iwas talon kapag nag-tab switch

    var scrollY = window.scrollY;
    var dScroll = scrollY - lastScroll;
    lastScroll = scrollY;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    var dw = leaf.dropW, dh = leaf.dropH;

    if (drop.phase === "grow") {
      drop.t += dt;
      var p = Math.min(1, drop.t / SETTINGS.growSeconds);
      var k = easeOutCubic(p);
      var scale = 0.15 + 0.85 * k;
      // Nakadikit sa dulo ng dahon; bahagyang bumababa (lumalaylay) habang lumalaki
      var top = tipViewY() - dh * 0.62 + dh * 0.22 * p * p;
      var hang = 1 + 0.1 * p * p;   // bahagyang humahaba bago bumitaw
      if (top + dh > -dh) {
        ctx.save();
        ctx.translate(leaf.tipX, top);
        ctx.scale(scale, scale * hang);
        drawDrop(0, 0, 1, 1, 1);
        ctx.restore();
      }
      if (p >= 1) {
        drop.phase = "fall";
        if (top < -dh * 2) {
          // Nasa labas ng screen (sa taas) ang dahon: pumapasok ang patak mula sa taas ng screen
          // na may bilis na parang galing sa taas, para hindi bumagal o bumilis ang tiyempo
          drop.y = -dh * 2;
          drop.vy = Math.sqrt(2 * gravity() * H * 0.3);
        } else {
          drop.y = top;
          drop.vy = 0;
        }
      }
    } else {
      // Sumasama sa scroll ang patak sa ere (para sinasalo ng ilalim ng screen kapag nag-scroll pataas)
      drop.y -= dScroll;
      if (drop.y < -dh * 2) drop.y = -dh * 2;

      drop.vy += gravity() * dt;
      drop.y += drop.vy * dt;

      var stretch = 1 + 0.25 * Math.min(1, drop.vy / (H * 1.4));
      var sx = 1 / Math.sqrt(stretch);
      var hh = dh * stretch;
      if (drop.y + hh >= groundY()) {
        var power = Math.max(0.65, Math.min(1.15, drop.vy / (H * 1.3)));
        makeSplash(leaf.tipX, groundY(), power);
        try { window.dispatchEvent(new CustomEvent("agos-splash", { detail: { x: leaf.tipX, y: groundY(), power: power } })); } catch (e) {}   // para sa js/learn-bg.js
        startDrop();
      } else {
        drawDrop(leaf.tipX, drop.y, sx, stretch, 1);
      }
    }

    for (var i = splashes.length - 1; i >= 0; i--) {
      if (!drawSplash(splashes[i], dt)) splashes.splice(i, 1);
    }
  }

  requestAnimationFrame(frame);
})();
