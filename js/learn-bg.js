/* =====================================================================
   LEARN PAGE: ANIMATED NA LAWA (tanaw mula sa itaas)

   Ang dahon sa kanang taas at ang patak na bumabagsak mula rito (js/water-drop.js)
   ay nasa ibabaw ng lawang ito. Kapag nag-splash ang patak, may malaking alon sa lawa
   (event na "agos-splash").

   Laman ng lawa:
   - Malinaw na asul-berdeng tubig na may gumagalaw na liwanag (caustics)
   - Mga koi na malayang lumalangoy
   - Lily pads na may lotus na bahagyang umuugoy
   - Mga talulot at maliliit na dahon na palutang-lutang
   - Ripples at kumikislap na liwanag

   Magaan ito: prerendered ang tubig at caustic tile; ilang drawImage lang kada frame.
   Kapag naka-"reduce motion" ang device, isang still frame lang.
   ===================================================================== */
(function () {
  "use strict";

  var SETTINGS = {
    speed: 1,
    causticAlpha: 0.1,           // lakas ng gumagalaw na liwanag (0 hanggang 1)
    koiCount: 3,
    rippleEverySec: [2, 4],      // gaano kadalas ang ripple
    petalCount: 7,
    glintCount: 36
  };

  var canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.className = "learn-bg-canvas";
  document.body.insertBefore(canvas, document.body.firstChild);
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var W = 0, H = 0, dpr = 1, U = 1, TS = 384;
  var base = null, tile = null;
  var rings = [], pads = [], koi = [], petals = [], glints = [], nextRipple = 0.8;
  var TAU = Math.PI * 2;

  function rand(a, b) { return a + Math.random() * (b - a); }

  // ----- Tubig: gradient (parehong teal ng ibang page) -----
  function buildBase() {
    base = document.createElement("canvas");
    base.width = Math.round(W * dpr); base.height = Math.round(H * dpr);
    var b = base.getContext("2d");
    b.scale(dpr, dpr);
    var g = b.createLinearGradient(0, 0, W * 0.3, H);
    g.addColorStop(0, "#2f9fbd");
    g.addColorStop(0.45, "#4ab6cf");
    g.addColorStop(1, "#2b93b0");
    b.fillStyle = g; b.fillRect(0, 0, W, H);
    var r = b.createRadialGradient(W * 0.7, H * 0.55, 0, W * 0.7, H * 0.55, Math.max(W, H) * 0.65);
    r.addColorStop(0, "rgba(150,225,235,0.42)");
    r.addColorStop(1, "rgba(150,225,235,0)");
    b.fillStyle = r; b.fillRect(0, 0, W, H);
    var v = b.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.4, W / 2, H / 2, Math.max(W, H) * 0.8);
    v.addColorStop(0, "rgba(8,70,95,0)");
    v.addColorStop(1, "rgba(8,70,95,0.3)");
    b.fillStyle = v; b.fillRect(0, 0, W, H);
  }

  // ----- Caustic tile (seamless) -----
  function buildTile() {
    tile = document.createElement("canvas");
    tile.width = TS; tile.height = TS;
    var t = tile.getContext("2d");
    var img = t.createImageData(TS, TS), d = img.data, waves = [], i;
    for (i = 0; i < 6; i++) waves.push({ kx: Math.round(rand(1, 4)) * (Math.random() < 0.5 ? -1 : 1), ky: Math.round(rand(1, 4)), ph: rand(0, TAU) });
    for (var y = 0; y < TS; y++) {
      for (var x = 0; x < TS; x++) {
        var v = 0;
        for (var j = 0; j < waves.length; j++) v += Math.sin(TAU * (waves[j].kx * x + waves[j].ky * y) / TS + waves[j].ph);
        v /= waves.length;
        var line = Math.max(0, 1 - Math.abs(v) * 5.5);
        line *= line;
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

  // ===================== LILY PADS + LOTUS =====================
  function makePads() {
    pads = [];
    var n = Math.max(4, Math.min(8, Math.round(W * H / 150000))), tries = 0;
    while (pads.length < n && tries++ < 80) {
      var r = rand(28, 56) * U, x = rand(0.04, 0.96) * W, y = rand(0.08, 0.96) * H, ok = true;
      for (var i = 0; i < pads.length; i++) {
        var dx = pads[i].x - x, dy = pads[i].y - y;
        if (Math.sqrt(dx * dx + dy * dy) < (pads[i].r + r) * 1.9) ok = false;
      }
      if (ok) pads.push({ x: x, y: y, r: r, rot: rand(0, TAU), notch: rand(0.28, 0.42), ph: rand(0, TAU), sp: rand(0.3, 0.6),
        shade: rand(0, 1), lotus: pads.length % 3 === 1, dip: 0, cx: x, cy: y });
    }
  }

  function drawPad(p, t) {
    var sway = Math.sin(t * p.sp + p.ph);
    var x = p.x + Math.sin(t * 0.21 + p.ph) * 5 * U, y = p.y + Math.cos(t * 0.17 + p.ph) * 4 * U;
    var rot = p.rot + sway * 0.05, r = p.r * (1 + sway * 0.012 - p.dip * 0.06);
    p.cx = x; p.cy = y;
    // anino sa tubig
    ctx.save(); ctx.translate(x + 7 * U, y + 9 * U); ctx.rotate(rot);
    ctx.fillStyle = "rgba(6,60,80,0.2)";
    ctx.beginPath(); ctx.arc(0, 0, r, p.notch, TAU - p.notch); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
    ctx.restore();
    // dahon
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    var g = ctx.createRadialGradient(-r * 0.25, -r * 0.25, r * 0.1, 0, 0, r);
    g.addColorStop(0, "rgb(" + Math.round(104 + 20 * p.shade) + ",205,128)");
    g.addColorStop(1, "rgb(" + Math.round(38 + 14 * p.shade) + ",150,100)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, r, p.notch, TAU - p.notch); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(220,255,230,0.5)"; ctx.lineWidth = Math.max(1, 1.2 * U);
    ctx.stroke();
    ctx.strokeStyle = "rgba(24,110,80,0.35)"; ctx.lineWidth = Math.max(0.8, U);
    ctx.beginPath();
    for (var k = 0; k < 7; k++) {
      var a = p.notch + (TAU - 2 * p.notch) * (k + 0.5) / 7;
      ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92);
    }
    ctx.stroke();
    ctx.restore();
    if (p.lotus) drawLotus(x - r * 0.1, y - r * 0.1, r * 0.55, t, p.ph);
  }

  function drawLotus(x, y, r, t, ph) {
    var s = 1 + Math.sin(t * 0.8 + ph) * 0.03;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    var ring, i;
    for (ring = 0; ring < 2; ring++) {
      var n = ring === 0 ? 8 : 6, len = r * (ring === 0 ? 1 : 0.68), wd = r * (ring === 0 ? 0.36 : 0.3);
      for (i = 0; i < n; i++) {
        var a = (i / n) * TAU + ring * 0.4;
        ctx.save(); ctx.rotate(a);
        var g = ctx.createLinearGradient(0, 0, len, 0);
        g.addColorStop(0, "#ffd0e0"); g.addColorStop(1, ring === 0 ? "#fff6fa" : "#ffe4ee");
        ctx.fillStyle = g; ctx.strokeStyle = "rgba(230,120,160,0.45)"; ctx.lineWidth = Math.max(0.8, U * 0.9);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.5, -wd, len, 0); ctx.quadraticCurveTo(len * 0.5, wd, 0, 0);
        ctx.fill(); ctx.stroke();
        ctx.restore();
      }
    }
    ctx.fillStyle = "#ffd54a"; ctx.beginPath(); ctx.arc(0, 0, r * 0.18, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // ===================== KOI =====================
  var COLORS = [["#ff8a3d", "#fff3e6"], ["#ffb347", "#ffffff"], ["#f26d3d", "#ffe9d6"]];
  function makeKoi(i) {
    var len = rand(95, 140) * U, N = 9, col = COLORS[i % COLORS.length];
    var f = { x: rand(0.1, 0.9) * W, y: rand(0.15, 0.9) * H, ang: rand(0, TAU), tr: 0, speed: rand(26, 44) * U, len: len, N: N,
      segs: [], col: col, ph: rand(0, TAU), spots: [rand(0.5, 1), rand(0.4, 1), rand(0.3, 1)] };
    for (var k = 0; k < N; k++) f.segs.push({ x: f.x - Math.cos(f.ang) * k * len / N, y: f.y - Math.sin(f.ang) * k * len / N });
    return f;
  }

  function updateKoi(f, dt) {
    f.tr += (Math.random() - 0.5) * dt * 3.2;
    f.tr = Math.max(-0.7, Math.min(0.7, f.tr * (1 - dt * 0.6)));
    f.ang += f.tr * dt;
    var m = 80 * U;
    if (f.x < -m || f.x > W + m || f.y < -m || f.y > H + m) {          // bumabalik kapag lumayo
      var to = Math.atan2(H / 2 - f.y, W / 2 - f.x), diff = Math.atan2(Math.sin(to - f.ang), Math.cos(to - f.ang));
      f.ang += diff * Math.min(1, dt * 2);
    }
    f.x += Math.cos(f.ang) * f.speed * dt; f.y += Math.sin(f.ang) * f.speed * dt;
    var s = f.segs; s[0].x = f.x; s[0].y = f.y;
    var d = f.len / f.N;
    for (var k = 1; k < f.N; k++) {
      var dx = s[k].x - s[k - 1].x, dy = s[k].y - s[k - 1].y, dd = Math.sqrt(dx * dx + dy * dy) || 1;
      s[k].x = s[k - 1].x + dx / dd * d; s[k].y = s[k - 1].y + dy / dd * d;
    }
  }

  var PROFILE = [0.5, 0.85, 1, 0.92, 0.72, 0.52, 0.36, 0.22, 0.12];
  function koiPath(f, t, ox, oy) {
    var s = f.segs, N = f.N, L = [], R = [], pts = [], k;
    for (k = 0; k < N; k++) {
      var a = k === 0 ? Math.atan2(s[0].y - s[1].y, s[0].x - s[1].x) : Math.atan2(s[k - 1].y - s[k].y, s[k - 1].x - s[k].x);
      var nx = -Math.sin(a), ny = Math.cos(a);
      var wig = Math.sin(t * 3.2 - k * 0.7 + f.ph) * f.len * 0.035 * (k / N);
      var px = s[k].x + nx * wig + ox, py = s[k].y + ny * wig + oy, w = f.len * 0.085 * PROFILE[k];
      pts.push({ x: px, y: py, nx: nx, ny: ny, a: a });
      L.push([px + nx * w, py + ny * w]); R.push([px - nx * w, py - ny * w]);
    }
    ctx.beginPath(); ctx.moveTo(L[0][0], L[0][1]);
    for (k = 1; k < N; k++) ctx.lineTo(L[k][0], L[k][1]);
    for (k = N - 1; k >= 0; k--) ctx.lineTo(R[k][0], R[k][1]);
    ctx.closePath();
    return pts;
  }

  function drawKoi(f, t) {
    ctx.fillStyle = "rgba(6,60,80,0.16)"; koiPath(f, t, 6 * U, 9 * U); ctx.fill();
    var pts = koiPath(f, t, 0, 0), N = f.N, last = pts[N - 1], k;
    // buntot
    var sw = Math.sin(t * 3.2 - N * 0.7 + f.ph) * 0.5, tl = f.len * 0.3;
    ctx.save(); ctx.translate(last.x, last.y); ctx.rotate(last.a + Math.PI + sw * 0.5);
    ctx.fillStyle = "rgba(255,200,150,0.75)";
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(tl * 0.6, -tl * 0.55, tl, -tl * 0.3);
    ctx.quadraticCurveTo(tl * 0.7, 0, tl, tl * 0.3); ctx.quadraticCurveTo(tl * 0.6, tl * 0.55, 0, 0); ctx.fill();
    ctx.restore();
    // pakpak sa gilid
    for (var sd = -1; sd <= 1; sd += 2) {
      var p2 = pts[2], fl = f.len * 0.16, fa = p2.a + sd * (1.9 + Math.sin(t * 2 + f.ph) * 0.15);
      ctx.fillStyle = "rgba(255,190,140,0.8)";
      ctx.beginPath(); ctx.ellipse(p2.x + p2.nx * sd * f.len * 0.07, p2.y + p2.ny * sd * f.len * 0.07, fl, fl * 0.32, fa, 0, TAU); ctx.fill();
    }
    // katawan
    koiPath(f, t, 0, 0);
    var h = pts[0], tl2 = pts[N - 1];
    var g = ctx.createLinearGradient(h.x, h.y, tl2.x, tl2.y);
    g.addColorStop(0, f.col[1]); g.addColorStop(0.35, f.col[0]); g.addColorStop(1, f.col[0]);
    ctx.fillStyle = g; ctx.fill();
    // batik
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    for (k = 0; k < 3; k++) {
      var q = pts[2 + k], rr = f.len * 0.045 * f.spots[k];
      ctx.beginPath(); ctx.ellipse(q.x, q.y, rr * 1.4, rr, q.a, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = "rgba(40,50,70,0.8)";                  // mata
    ctx.beginPath(); ctx.arc(pts[0].x + pts[0].nx * f.len * 0.03, pts[0].y + pts[0].ny * f.len * 0.03, Math.max(1.2, f.len * 0.012), 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(pts[0].x - pts[0].nx * f.len * 0.03, pts[0].y - pts[0].ny * f.len * 0.03, Math.max(1.2, f.len * 0.012), 0, TAU); ctx.fill();
  }

  // ===================== PALAKA =====================
  // Nakaupo sa lily pad, kumukurap, humuhuni (umuumbok ang lalamunan), at paminsan-minsang tumatalon
  // sa ibang lily pad (may tilamsik na ripple sa pag-alis at pag-lapag).
  var frog = null;
  var TONGUE_OUT = 0.2, TONGUE_TOTAL = 0.5;

  function makeFrog() {
    frog = null;
    if (pads.length < 2) return;
    var idx = 0;
    for (var i = 0; i < pads.length; i++) if (!pads[i].lotus) { idx = i; break; }
    var p = pads[idx];
    frog = { pad: idx, x: p.cx, y: p.cy, ang: rand(0, TAU), state: "sit", wait: rand(2.5, 4.5), jt: 0, dur: 0.85,
      fx: 0, fy: 0, tx: 0, ty: 0, tp: 0, croak: -1, nextCroak: rand(1.5, 3), blink: -1, nextBlink: rand(1.5, 3.5), s: 14 * U, cool: 2, tj: 0, caught: false, tipX: 0, tipY: 0 };
  }

  function frogSize(p) { return Math.max(11, Math.min(p.r * 0.5, 21 * U)); }

  function updateFrog(dt) {
    var f = frog; if (!f) return;
    var cur = pads[f.pad];
    f.nextBlink -= dt; if (f.nextBlink <= 0 && f.blink < 0) f.blink = 0;
    if (f.blink >= 0) { f.blink += dt; if (f.blink > 0.18) { f.blink = -1; f.nextBlink = rand(2, 5); } }
    if (f.state !== "jump") {
      f.s = frogSize(cur);
      f.x = cur.cx + Math.cos(cur.rot + 0.3) * cur.r * 0.05; f.y = cur.cy + Math.sin(cur.rot + 0.3) * cur.r * 0.05;
    }
    if (f.cool > 0) f.cool -= dt;
    if (f.state === "turn") {
      // humaharap sa insekto
      if (!bug || !bug.alive) { f.state = "sit"; return; }
      var want = Math.atan2(bug.y - f.y, bug.x - f.x), diff = Math.atan2(Math.sin(want - f.ang), Math.cos(want - f.ang)), step = 8 * dt;
      if (Math.abs(diff) <= step) { f.ang = want; f.state = "tongue"; f.tj = 0; f.caught = false; f.tipX = bug.x; f.tipY = bug.y; }
      else f.ang += (diff > 0 ? 1 : -1) * step;
    } else if (f.state === "tongue") {
      // bumabanat ang dila at sinasalo ang insekto
      f.tj += dt;
      var mx = f.x + Math.cos(f.ang) * f.s * 0.98, my = f.y + Math.sin(f.ang) * f.s * 0.98;
      if (bug && bug.alive && f.tj < TONGUE_OUT) { f.tipX = bug.x; f.tipY = bug.y; f.ang += 0; }
      if (!f.caught && f.tj >= TONGUE_OUT && bug && bug.alive) {
        var dd = Math.sqrt(Math.pow(bug.x - mx, 2) + Math.pow(bug.y - my, 2));
        if (dd < f.s * 7.5) { f.caught = true; f.tipX = bug.x; f.tipY = bug.y; bug.alive = false; bug.respawn = rand(7, 11); }
      }
      if (f.tj >= TONGUE_TOTAL) {
        f.state = "sit"; f.cool = 3; f.wait = Math.max(f.wait, 2.5);
        if (f.caught) { f.croak = 0; f.nextCroak = rand(3, 5); }
      }
    } else if (f.state === "sit") {
      if (bug && bug.alive && f.cool <= 0) {
        var bd = Math.sqrt(Math.pow(bug.x - f.x, 2) + Math.pow(bug.y - f.y, 2));
        if (bd < f.s * 6.5 && bd > f.s * 1.8) { f.state = "turn"; f.croak = -1; return; }
      }
      f.nextCroak -= dt; if (f.nextCroak <= 0 && f.croak < 0) f.croak = 0;
      if (f.croak >= 0) { f.croak += dt; if (f.croak > 0.9) { f.croak = -1; f.nextCroak = rand(2.5, 5.5); } }
      f.wait -= dt;
      if (f.wait <= 0) {
        var best = -1, bd = 1e9, cands = [], i;
        for (i = 0; i < pads.length; i++) {
          if (i === f.pad) continue;
          var dx = pads[i].cx - cur.cx, dy = pads[i].cy - cur.cy, d = Math.sqrt(dx * dx + dy * dy);
          if (d < 420 * U) cands.push(i);
          if (d < bd) { bd = d; best = i; }
        }
        var to = cands.length ? cands[Math.floor(Math.random() * cands.length)] : best;
        if (to < 0) { f.wait = 4; return; }
        f.state = "jump"; f.jt = 0; f.croak = -1; f.fx = f.x; f.fy = f.y; f.tp = to;
        f.dur = 0.7 + Math.min(0.5, Math.sqrt(Math.pow(pads[to].cx - f.x, 2) + Math.pow(pads[to].cy - f.y, 2)) / (900 * U));
        cur.dip = 1; addRipple(cur.cx, cur.cy, 0.55, false);
      }
    } else {
      f.jt += dt;
      var tgt = pads[f.tp], p = Math.min(1, f.jt / f.dur);
      f.tx = tgt.cx; f.ty = tgt.cy;
      var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      var nx = f.fx + (f.tx - f.fx) * e, ny = f.fy + (f.ty - f.fy) * e;
      f.ang = Math.atan2(f.ty - f.fy, f.tx - f.fx);
      f.x = nx; f.y = ny; f.p = p;
      if (p >= 1) {
        f.state = "sit"; f.pad = f.tp; f.wait = rand(4, 8); f.nextCroak = rand(0.8, 2);
        tgt.dip = 1; addRipple(tgt.cx, tgt.cy, 0.7, false);
      }
    }
  }

  function drawFrog(t) {
    var f = frog; if (!f) return;
    var jumping = f.state === "jump", p = jumping ? f.p || 0 : 0;
    var air = jumping ? Math.sin(Math.PI * p) : 0;
    var s = f.s * (1 + air * 0.45);
    var lift = air * 26 * U;
    var ang = jumping ? f.ang : f.ang + Math.sin(t * 0.3) * 0.03;
    // anino (nananatili sa pad / tubig)
    ctx.fillStyle = "rgba(6,60,80," + (0.22 - air * 0.1) + ")";
    ctx.beginPath(); ctx.ellipse(f.x + 4 * U, f.y + 6 * U + lift * 0.9, s * 1.0, s * 0.62, ang, 0, TAU); ctx.fill();

    ctx.save(); ctx.translate(f.x, f.y - lift); ctx.rotate(ang);
    var G1 = "#7bd13f", G2 = "#4ea82f", DK = "rgba(24,92,36,0.75)", LW = Math.max(1, s * 0.07);
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    function leg(x, y, len, wd, a, fill) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.fillStyle = fill; ctx.strokeStyle = DK; ctx.lineWidth = LW;
      ctx.beginPath(); ctx.ellipse(len / 2, 0, len / 2, wd, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    var sd;
    // hulihang binti: nakatiklop kapag nakaupo, nakaunat kapag tumatalon
    for (sd = -1; sd <= 1; sd += 2) {
      if (jumping) leg(-s * 0.55, sd * s * 0.3, s * 1.5, s * 0.17, Math.PI + sd * (0.28 - air * 0.12), G2);
      else leg(-s * 0.3, sd * s * 0.5, s * 0.95, s * 0.25, sd * (Math.PI - 0.7), G2);
    }
    // unahang binti
    for (sd = -1; sd <= 1; sd += 2) leg(s * 0.45, sd * s * 0.38, s * 0.62, s * 0.13, jumping ? sd * -0.35 : sd * 0.7, G1);
    // katawan
    var g = ctx.createRadialGradient(-s * 0.1, -s * 0.15, s * 0.1, 0, 0, s * 0.95);
    g.addColorStop(0, G1); g.addColorStop(1, G2);
    ctx.fillStyle = g; ctx.strokeStyle = DK; ctx.lineWidth = LW;
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.85, s * 0.58, 0, 0, TAU); ctx.fill(); ctx.stroke();
    // batik sa likod
    ctx.fillStyle = "rgba(40,120,40,0.5)";
    ctx.beginPath(); ctx.ellipse(-s * 0.3, -s * 0.15, s * 0.16, s * 0.1, 0.4, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-s * 0.05, s * 0.2, s * 0.13, s * 0.09, -0.3, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-s * 0.5, s * 0.2, s * 0.11, s * 0.08, 0.2, 0, TAU); ctx.fill();
    // ulo
    ctx.fillStyle = G1; ctx.strokeStyle = DK; ctx.lineWidth = LW;
    ctx.beginPath(); ctx.ellipse(s * 0.72, 0, s * 0.5, s * 0.45, 0, 0, TAU); ctx.fill(); ctx.stroke();
    // lalamunan na umuumbok kapag humuhuni
    if (f.croak >= 0) {
      var cp = Math.sin(Math.PI * Math.min(1, f.croak / 0.9)), pulse = 0.55 + 0.45 * Math.abs(Math.sin(f.croak * 22));
      ctx.fillStyle = "rgba(235,250,190," + (0.85 * cp) + ")";
      ctx.beginPath(); ctx.arc(s * 1.12, 0, s * (0.12 + 0.2 * cp * pulse), 0, TAU); ctx.fill();
    }
    // mata
    var bl = f.blink >= 0 ? 0.15 : 1;
    for (sd = -1; sd <= 1; sd += 2) {
      var ex = s * 0.78, ey = sd * s * 0.32;
      ctx.fillStyle = "#a6e26a"; ctx.strokeStyle = DK; ctx.lineWidth = LW * 0.9;
      ctx.beginPath(); ctx.arc(ex, ey, s * 0.2, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#1c2a1c";
      ctx.beginPath(); ctx.ellipse(ex + s * 0.03, ey, s * 0.1, s * 0.1 * bl + 0.4, 0, 0, TAU); ctx.fill();
    }
    ctx.restore();
    if (f.state === "tongue") {
      var mx = f.x + Math.cos(f.ang) * f.s * 0.98, my = f.y + Math.sin(f.ang) * f.s * 0.98;
      var pr = f.tj < TONGUE_OUT ? 1 - Math.pow(1 - f.tj / TONGUE_OUT, 3) : 1 - (f.tj - TONGUE_OUT) / (TONGUE_TOTAL - TONGUE_OUT);
      var tx = mx + (f.tipX - mx) * pr, ty = my + (f.tipY - my) * pr;
      ctx.strokeStyle = "#ff7f9a"; ctx.lineWidth = Math.max(2, f.s * 0.14); ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.fillStyle = "#ff6f8d"; ctx.beginPath(); ctx.arc(tx, ty, Math.max(2.5, f.s * 0.16), 0, TAU); ctx.fill();
      if (f.caught && f.tj > TONGUE_OUT) { ctx.fillStyle = "#e8453c"; ctx.beginPath(); ctx.arc(tx, ty, Math.max(1.5, f.s * 0.09), 0, TAU); ctx.fill(); }
    }
  }

  // ===================== LIPAD NA INSEKTO (dragonfly) =====================
  // Paikot-ikot sa ibabaw ng lawa. Madalas itong lumalapit sa palaka, at sinasalo ito ng palaka gamit ang dila.
  // Pagkatapos, may bagong insekto na papasok mula sa gilid ng screen.
  var bug = null;

  function makeBug(edge) {
    var x, y;
    if (edge) {
      var side = Math.floor(Math.random() * 4);
      x = side === 0 ? -20 : side === 1 ? W + 20 : rand(0.1, 0.9) * W;
      y = side === 2 ? -20 : side === 3 ? H + 20 : rand(0.1, 0.9) * H;
    } else { x = rand(0.1, 0.9) * W; y = rand(0.15, 0.85) * H; }
    return { x: x, y: y, vx: 0, vy: 0, ang: rand(0, TAU), wx: x, wy: y, wpT: 0, sp: rand(75, 105) * U, alive: true, respawn: 0, ph: rand(0, TAU) };
  }

  function updateBug(dt) {
    var b = bug; if (!b) return;
    if (!b.alive) { b.respawn -= dt; if (b.respawn <= 0) bug = makeBug(true); return; }
    b.wpT -= dt;
    if (b.wpT <= 0) {
      if (frog && Math.random() < 0.6) { var a = rand(0, TAU), rr = frog.s * rand(2.6, 5.4); b.wx = frog.x + Math.cos(a) * rr; b.wy = frog.y + Math.sin(a) * rr; }
      else { b.wx = rand(0.05, 0.95) * W; b.wy = rand(0.1, 0.95) * H; }
      b.wpT = rand(1.5, 3.2);
    }
    var dx = b.wx - b.x, dy = b.wy - b.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
    var k = Math.min(1, dt * 2.6), sp = d < 30 * U ? b.sp * (d / (30 * U)) : b.sp;
    b.vx += (dx / d * sp - b.vx) * k + (Math.random() - 0.5) * dt * 260 * U;
    b.vy += (dy / d * sp - b.vy) * k + (Math.random() - 0.5) * dt * 260 * U;
    b.x += b.vx * dt; b.y += b.vy * dt;
    var sp2 = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
    if (sp2 > 8 * U) { var want = Math.atan2(b.vy, b.vx), diff = Math.atan2(Math.sin(want - b.ang), Math.cos(want - b.ang)); b.ang += diff * Math.min(1, dt * 8); }
  }

  function drawBug(t) {
    var b = bug; if (!b || !b.alive) return;
    var L = 10 * U, fl = Math.sin(t * 60 + b.ph);
    // anino sa tubig
    ctx.save(); ctx.translate(b.x + 9 * U, b.y + 15 * U); ctx.rotate(b.ang);
    ctx.fillStyle = "rgba(6,60,80,0.16)";
    ctx.beginPath(); ctx.ellipse(-L * 0.35, 0, L * 1.05, L * 0.12, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(L * 0.3, 0, L * 0.25, L * 1.0, 0, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.ang);
    // pakpak (mabilis kumampay)
    ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = Math.max(0.8, U * 0.8);
    for (var sd = -1; sd <= 1; sd += 2) {
      for (var w = 0; w < 2; w++) {
        ctx.save(); ctx.translate(L * (0.32 - w * 0.2), 0); ctx.rotate(sd * (1.25 + w * 0.3 + fl * 0.22));
        ctx.beginPath(); ctx.ellipse(L * 0.55, 0, L * 0.6, L * 0.17, 0, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
    }
    // katawan
    ctx.strokeStyle = "#e8453c"; ctx.lineCap = "round"; ctx.lineWidth = Math.max(1.6, L * 0.17);
    ctx.beginPath(); ctx.moveTo(L * 0.1, 0); ctx.lineTo(-L * 1.1, 0); ctx.stroke();
    ctx.strokeStyle = "#a82a2a"; ctx.lineWidth = Math.max(1, L * 0.19);
    ctx.beginPath(); ctx.moveTo(-L * 0.45, 0); ctx.lineTo(-L * 0.5, 0); ctx.moveTo(-L * 0.8, 0); ctx.lineTo(-L * 0.85, 0); ctx.stroke();
    ctx.fillStyle = "#c93a35"; ctx.beginPath(); ctx.ellipse(L * 0.28, 0, L * 0.3, L * 0.2, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = "#2a3a50"; ctx.beginPath(); ctx.arc(L * 0.62, 0, L * 0.2, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // ===================== PAPER BOAT =====================
  // Lumulutang nang dahan-dahan sa lawa: lumilihis ang direksyon, umuugoy, at may maliliit na ripple sa likod.
  var boat = null;

  function makeBoat() {
    boat = { x: rand(0.2, 0.8) * W, y: rand(0.25, 0.8) * H, ang: rand(0, TAU), tr: 0, speed: rand(15, 22) * U, s: 31 * U,
      ph: rand(0, TAU), wake: 0.5 };
  }

  function updateBoat(dt) {
    var b = boat; if (!b) return;
    b.tr += (Math.random() - 0.5) * dt * 1.6;
    b.tr = Math.max(-0.35, Math.min(0.35, b.tr * (1 - dt * 0.5)));
    var steer = 0, i;
    for (i = 0; i < pads.length; i++) {                      // umiiwas sa lily pads
      var dx = b.x - pads[i].cx, dy = b.y - pads[i].cy, d = Math.sqrt(dx * dx + dy * dy), lim = pads[i].r + b.s * 1.6;
      if (d < lim) {
        var away = Math.atan2(dy, dx), diff = Math.atan2(Math.sin(away - b.ang), Math.cos(away - b.ang));
        steer += diff * (1 - d / lim) * 3;
      }
    }
    var m = 60 * U;
    if (b.x < m || b.x > W - m || b.y < m || b.y > H - m) {   // bumabalik kapag malapit sa gilid
      var to = Math.atan2(H / 2 - b.y, W / 2 - b.x), df = Math.atan2(Math.sin(to - b.ang), Math.cos(to - b.ang));
      steer += df * 1.2;
    }
    b.ang += (b.tr + steer) * dt;
    b.x += Math.cos(b.ang) * b.speed * dt; b.y += Math.sin(b.ang) * b.speed * dt;
    b.wake -= dt;
    if (b.wake <= 0) {
      b.wake = rand(0.8, 1.3);
      addRipple(b.x - Math.cos(b.ang) * b.s * 0.9, b.y - Math.sin(b.ang) * b.s * 0.9, 0.35, false);
    }
  }

  function drawBoat(t) {
    var b = boat; if (!b) return;
    var s = b.s, rock = Math.sin(t * 1.1 + b.ph) * 0.06, bob = 1 + Math.sin(t * 1.6 + b.ph) * 0.015;
    // anino sa tubig
    ctx.save(); ctx.translate(b.x + 5 * U, b.y + 8 * U); ctx.rotate(b.ang + rock); ctx.scale(bob, bob);
    ctx.fillStyle = "rgba(6,60,80,0.22)";
    ctx.beginPath(); ctx.moveTo(-s, 0); ctx.lineTo(-s * 0.7, -s * 0.34); ctx.lineTo(s * 0.7, -s * 0.34); ctx.lineTo(s, 0);
    ctx.lineTo(s * 0.7, s * 0.34); ctx.lineTo(-s * 0.7, s * 0.34); ctx.closePath(); ctx.fill();
    ctx.restore();

    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.ang + rock); ctx.scale(bob, bob);
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    var LW = Math.max(1, s * 0.035), ED = "rgba(95,125,150,0.75)";
    // katawan (dalawang tiklop ng papel: mas maliwanag sa isang gilid)
    ctx.fillStyle = "#fffaf0"; ctx.strokeStyle = ED; ctx.lineWidth = LW;
    ctx.beginPath(); ctx.moveTo(-s, 0); ctx.lineTo(-s * 0.7, -s * 0.34); ctx.lineTo(s * 0.7, -s * 0.34); ctx.lineTo(s, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#e3ecf1";
    ctx.beginPath(); ctx.moveTo(-s, 0); ctx.lineTo(-s * 0.7, s * 0.34); ctx.lineTo(s * 0.7, s * 0.34); ctx.lineTo(s, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    // layag (nakatiklop na gitna): tatsulok na nakaangat, may anino sa isang gilid
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.moveTo(-s * 0.62, 0); ctx.lineTo(0, -s * 0.2); ctx.lineTo(s * 0.62, 0); ctx.lineTo(0, s * 0.06); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "rgba(150,180,200,0.45)";
    ctx.beginPath(); ctx.moveTo(-s * 0.62, 0); ctx.lineTo(0, s * 0.06); ctx.lineTo(s * 0.62, 0); ctx.lineTo(0, s * 0.02); ctx.closePath(); ctx.fill();
    // guhit ng tiklop sa dulo
    ctx.strokeStyle = "rgba(95,125,150,0.5)";
    ctx.beginPath(); ctx.moveTo(-s * 0.7, -s * 0.34); ctx.lineTo(-s * 0.45, 0); ctx.moveTo(-s * 0.7, s * 0.34); ctx.lineTo(-s * 0.45, 0);
    ctx.moveTo(s * 0.7, -s * 0.34); ctx.lineTo(s * 0.45, 0); ctx.moveTo(s * 0.7, s * 0.34); ctx.lineTo(s * 0.45, 0); ctx.stroke();
    // kulay-kahel na guhit sa gilid para madaling makita
    ctx.strokeStyle = "#ff8a5b"; ctx.lineWidth = LW * 1.6;
    ctx.beginPath(); ctx.moveTo(-s * 0.7, -s * 0.34); ctx.lineTo(s * 0.7, -s * 0.34); ctx.stroke();
    ctx.restore();
  }

  // ===================== TALULOT AT DAHON =====================
  function makePetal(x, y) {
    var leaf = Math.random() < 0.35;
    return { x: x === undefined ? rand(0, W) : x, y: y === undefined ? rand(0, H) : y, r: rand(5, 9) * U, rot: rand(0, TAU), vr: rand(-0.3, 0.3),
      vx: rand(5, 14) * U, vy: rand(-3, 5) * U, leaf: leaf, ph: rand(0, TAU) };
  }
  function drawPetals(t, dt) {
    for (var i = 0; i < petals.length; i++) {
      var p = petals[i];
      p.x += (p.vx + Math.sin(t * 0.5 + p.ph) * 4) * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      if (p.x > W + 20) { p.x = -20; p.y = rand(0, H); }
      if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = "rgba(6,60,80,0.15)"; ctx.beginPath(); ctx.ellipse(3 * U, 4 * U, p.r, p.r * 0.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = p.leaf ? "rgba(110,205,130,0.92)" : "rgba(255,225,235,0.95)";
      ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * 0.5, 0, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }

  // ===================== RIPPLES AT KISLAP =====================
  function addRipple(x, y, scale, strong) {
    rings.push({ x: x, y: y, t: 0, dur: rand(3.4, 4.6) * (strong ? 1.2 : 1), maxR: rand(60, 120) * U * scale, n: strong ? 3 : 2, a: strong ? 0.55 : 0.4 });
  }
  function drawRipples(dt) {
    for (var i = rings.length - 1; i >= 0; i--) {
      var r = rings[i]; r.t += dt;
      var p = r.t / r.dur;
      if (p >= 1) { rings.splice(i, 1); continue; }
      for (var k = 0; k < r.n; k++) {
        var pk = p - k * 0.1;
        if (pk <= 0) continue;
        var rr = r.maxR * (1 - Math.pow(1 - pk, 2.2)), a = r.a * Math.pow(1 - pk, 1.6);
        ctx.lineWidth = Math.max(1, (2.6 - 1.6 * pk) * U);
        ctx.strokeStyle = "rgba(255,255,255," + a + ")";
        ctx.beginPath(); ctx.arc(r.x, r.y, rr, 0, TAU); ctx.stroke();
        ctx.lineWidth = Math.max(0.8, U);
        ctx.strokeStyle = "rgba(190,240,250," + a * 0.7 + ")";
        ctx.beginPath(); ctx.arc(r.x, r.y, rr * 0.88, 0, TAU); ctx.stroke();
      }
    }
  }
  function drawGlints(t) {
    for (var i = 0; i < glints.length; i++) {
      var g = glints[i], a = Math.pow(Math.max(0, Math.sin(t * g.sp + g.ph)), 6) * g.a;
      if (a < 0.03) continue;
      ctx.fillStyle = "rgba(255,255,255," + a + ")";
      ctx.beginPath(); ctx.ellipse(g.x, g.y, g.w, g.w * 0.3, 0, 0, TAU); ctx.fill();
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth; H = window.innerHeight;
    U = Math.max(0.7, Math.min(1.4, W / 1300));
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    buildBase(); makePads(); makeFrog(); bug = makeBug(false); makeBoat();
    koi = []; petals = []; glints = [];
    var i;
    for (i = 0; i < SETTINGS.koiCount; i++) koi.push(makeKoi(i));
    for (i = 0; i < SETTINGS.petalCount; i++) petals.push(makePetal());
    for (i = 0; i < SETTINGS.glintCount; i++) glints.push({ x: rand(0, W), y: rand(0, H), w: rand(5, 13) * U, sp: rand(0.4, 1.1), ph: rand(0, 6.28), a: rand(0.25, 0.5) });
  }

  function frame(t, dt) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.drawImage(base, 0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    var size = TS * 0.8 * Math.max(1, W / 1300);
    drawTiled(tile, size, t * 14, t * 9, SETTINGS.causticAlpha);
    drawTiled(tile, size * 1.35, -t * 10 + 120, t * 7 + 60, SETTINGS.causticAlpha * 0.75);
    ctx.globalCompositeOperation = "source-over";
    var i;
    for (i = 0; i < koi.length; i++) { updateKoi(koi[i], dt); drawKoi(koi[i], t); }
    for (i = 0; i < pads.length; i++) drawPad(pads[i], t);
    for (i = 0; i < pads.length; i++) if (pads[i].dip > 0) pads[i].dip = Math.max(0, pads[i].dip - dt * 2.2);
    updateBug(dt); updateFrog(dt); drawFrog(t); drawBug(t);
    updateBoat(dt); drawBoat(t);
    drawPetals(t, dt);
    if (!reduce) {
      nextRipple -= dt;
      if (nextRipple <= 0) { addRipple(rand(0.05, 0.95) * W, rand(0.12, 0.95) * H, 1, false); nextRipple = rand(SETTINGS.rippleEverySec[0], SETTINGS.rippleEverySec[1]); }
    }
    drawRipples(dt);
    drawGlints(t);
  }

  // Kapag nag-splash ang patak mula sa dahon: malaking alon sa lawa
  window.addEventListener("agos-splash", function (e) {
    if (reduce || !e.detail) return;
    addRipple(e.detail.x, Math.max(H * 0.6, e.detail.y - 14), 1.9, true);
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
    var t = now / 1000, dt = last ? Math.min(t - last, 0.05) * SETTINGS.speed : 0;
    last = t;
    frame(t * SETTINGS.speed, dt);
  }
  requestAnimationFrame(loop);
})();
