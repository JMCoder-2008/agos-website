// home.js - float-up animation ng navy panel, 3 video at 3 card sa Home page.
// Lumalabas ang bawat isa kapag napasok na sa screen (nag-scroll o pinindot ang Explore Now).
// Hindi sabay-sabay: bawat column ay 0.15s na huli sa kaliwa, at ang mga card ay 0.3s na huli sa mga video sa taas nila.
// Para baguhin ang bilis: palitan ang mga numero sa ibaba (seconds). Ang haba ng galaw ay nasa css/home.css (.reveal).

(function () {
  const COLUMN_DELAY = 0.15;   // huli ng bawat column (0.15s, 0.30s)
  const CARD_DELAY   = 0.3;    // dagdag na huli ng card kumpara sa video
  const PANEL_WAIT   = 350;    // ms: lalabas muna ang navy panel, tapos saka magsisimula ang mga video at card

  const panel = document.getElementById("intro");
  const items = document.querySelectorAll(".topics-grid .video-frame, .topics-grid .card");
  if (!items.length || !("IntersectionObserver" in window)) return;   // walang animation, nakikita pa rin lahat
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // Anong column ang elemento (0, 1, 2)
  function column(item) {
    const topics = Array.from(document.querySelectorAll(".topics-grid .topic"));
    return topics.indexOf(item.closest(".topic"));
  }

  items.forEach(function (item) { item.classList.add("reveal"); });
  if (panel) panel.classList.add("reveal-panel");

  const observer = new IntersectionObserver(function (entries) {
    const visible = entries.filter(function (e) { return e.isIntersecting; });
    // May video ba na lalabas kasabay nito? Kung oo, mahuhuli nang kaunti ang mga card sa ilalim nila.
    const withVideos = visible.some(function (e) { return e.target.classList.contains("video-frame"); });

    visible.forEach(function (e) {
      const item = e.target;
      let delay = column(item) * COLUMN_DELAY;
      if (item.classList.contains("card") && withVideos) delay += CARD_DELAY;
      item.style.transitionDelay = delay + "s";
      item.classList.add("in");
      observer.unobserve(item);   // isang beses lang
      // Pagkatapos ng animation, tanggalin ang delay para hindi maantala ang hover at iba pa
      setTimeout(function () { item.style.transitionDelay = ""; }, (delay + 0.7) * 1000);
    });
  }, { threshold: 0.15 });

  function startItems() {
    items.forEach(function (item) { observer.observe(item); });
  }

  if (!panel) { startItems(); return; }

  // 1. Panel muna: lumulutang kapag nakikita na. 2. Pagkatapos ng PANEL_WAIT ms, ang mga video at card.
  const panelObserver = new IntersectionObserver(function (entries) {
    if (!entries.some(function (e) { return e.isIntersecting; })) return;
    panelObserver.disconnect();
    panel.classList.add("in");
    setTimeout(startItems, PANEL_WAIT);
  }, { threshold: 0.1 });
  panelObserver.observe(panel);
})();

// ===== YOUTUBE FACADE =====
// Hindi pwedeng i-cache ang YouTube iframe, kaya nagfli-flicker ito habang gumagalaw. Kaya larawan (thumbnail) muna ang ipinapakita
// (na nakakacache ng browser), at ilo-load lang ang totoong video kapag kinlick ang play. Hindi na kailangang galawin ang HTML:
// kinukuha ng code na ito ang video ID at title mula sa <iframe> na nasa index.html.
(function () {
  document.querySelectorAll(".topics-grid .video-frame").forEach(function (frame) {
    const iframe = frame.querySelector("iframe");
    if (!iframe) return;
    const match = iframe.src.match(/\/embed\/([\w-]{11})/);
    if (!match) return;
    const id = match[1];
    const title = iframe.getAttribute("title") || "Video";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "yt-facade";
    btn.setAttribute("aria-label", "Play video: " + title);

    // Pinakamalinaw muna (maxres). Kung wala nito ang video, hqdefault ang gagamitin
    const img = document.createElement("img");
    img.alt = "";
    img.decoding = "async";
    img.src = "https://i.ytimg.com/vi/" + id + "/maxresdefault.jpg";
    img.addEventListener("error", function () {
      if (!img.dataset.fallback) { img.dataset.fallback = "1"; img.src = "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg"; }
    });
    // Ang maxres na walang laman ay 120px lang ang lapad; palitan din ng hqdefault
    img.addEventListener("load", function () {
      if (img.naturalWidth <= 120 && !img.dataset.fallback) { img.dataset.fallback = "1"; img.src = "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg"; }
    });

    const cap = document.createElement("span");
    cap.className = "yt-title";
    cap.textContent = title;

    const play = document.createElement("span");
    play.className = "yt-play";
    play.setAttribute("aria-hidden", "true");
    play.innerHTML = '<svg viewBox="0 0 68 48" width="68" height="48"><rect width="68" height="48" rx="14" fill="#ff0033"/><path d="M27 14l20 10-20 10z" fill="#fff"/></svg>';

    btn.append(img, cap, play);

    // Kapag kinlick: ilagay ang totoong video at awtomatikong mag-play
    btn.addEventListener("click", function () {
      iframe.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1";
      iframe.removeAttribute("loading");
      btn.replaceWith(iframe);
      iframe.focus();
    });

    iframe.replaceWith(btn);
  });
})();
