/* =====================================================================
   MAP FREEZE (Interactive page lang)

   Ang mapa ng PAGASA ay hiwalay na website sa loob ng iframe. Hindi natin ito mapapahinto mula sa labas, at mabigat
   itong i-scroll kahit walang gumagalaw. Kaya:

   1. Larawan ng mapa (images/interactive/map-preview.jpg) ang nakikita. Naglo-load ang totoong mapa sa likod (nakatago).
   2. Kapag na-click ang larawan, lalabas ang buhay na mapa at gagana nang normal.
   3. Babalik ang larawan kapag: nag-click sa labas ng mapa, o nag-scroll ng page nang lampas SCROLL_LIMIT.
      Hindi nawawala ang zoom o napiling probinsya: nasa likod lang ang mapa. Pagka-click ulit, nandoon pa rin.

   4. Ang animation ng langit (js/sky-bg.js) ay humihinto lang habang NAKIKIPAG-INTERACT ka sa mapa (buhay ito) AT
      kita ang kalahati (50%) o higit pa ng mapa sa screen. Kapag na-freeze ang mapa, o wala nang kalahati ang kita,
      gumagalaw ulit ang langit.

   Ang CSS ay nasa dulo ng css/interactive.css (MAP FREEZE). Kapag nawawala ang larawan, o walang JavaScript,
   ang buhay na mapa lang ang ipinapakita (gaya ng dati).
   ===================================================================== */
(function () {
  "use strict";

  var SCROLL_LIMIT = 60;   // ilang pixel ng pag-scroll bago bumalik ang larawan
  var MIN_VISIBLE = 0.5;   // kailangang kita ang kalahati ng mapa para huminto ang langit

  var wrap = document.getElementById("map-wrap");
  if (!wrap) return;
  var frame = document.getElementById("ph-map");
  var btn = wrap.querySelector(".map-activate");
  var preview = wrap.querySelector(".map-preview");
  if (!frame || !btn || !preview) return;

  var live = false;
  var visible = false;      // kita ba ang MIN_VISIBLE o higit pa ng mapa?
  var skyPaused = false;
  var startY = 0;

  function arm() { wrap.classList.add("is-armed", "is-frozen"); }
  function disarm() { wrap.classList.remove("is-armed", "is-frozen"); live = false; }

  // Kapag hindi ma-load ang larawan, huwag i-freeze: buhay na mapa na lang
  if (preview.complete && preview.naturalWidth === 0) return;
  preview.addEventListener("error", disarm);
  arm();

  // Sabihin sa js/sky-bg.js kung hihinto o gagalaw ang langit (kapag nagbago lang)
  function syncSky() {
    var pause = live && visible;
    if (pause === skyPaused) return;
    skyPaused = pause;
    document.dispatchEvent(new CustomEvent("agos:map-live", { detail: pause }));
  }

  function setLive(on) {
    live = on;
    wrap.classList.toggle("is-frozen", !on);
    syncSky();
  }

  // Sinusubaybayan kung gaano kakita ang mapa. Walang IntersectionObserver? Ituring na kita ito.
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      var e = entries[entries.length - 1];
      visible = e.intersectionRatio >= MIN_VISIBLE;
      syncSky();
    }, { threshold: [0, MIN_VISIBLE, 1] }).observe(wrap);
  } else {
    visible = true;
  }

  function thaw() {
    if (live) return;
    startY = window.scrollY;
    setLive(true);
    try { frame.focus({ preventScroll: true }); } catch (e) { /* okay lang */ }
  }

  function freeze() {
    if (!live) return;
    setLive(false);
  }

  btn.addEventListener("click", thaw);

  // Click o tap sa labas ng mapa
  document.addEventListener("pointerdown", function (e) {
    if (live && !wrap.contains(e.target)) freeze();
  });

  // Pag-scroll ng page (wheel sa labas ng mapa, scrollbar, keyboard)
  window.addEventListener("scroll", function () {
    if (live && Math.abs(window.scrollY - startY) > SCROLL_LIMIT) freeze();
  }, { passive: true });
})();
