// home.js - float-up animation in "LEARN AND DISCOVER"
// change speed here; speed move (reveal)

(function () {
  const COLUMN_DELAY = 0.15;   //delay of every column (0.15s, 0.30s)
  const CARD_DELAY   = 0.3;    // delay for cards
  const PANEL_WAIT   = 250;    // panel(navy blue bg) first and how much delay before the video and card show up

  const panel = document.getElementById("intro");
  const items = document.querySelectorAll(".topics-grid .video-frame, .topics-grid .card");
  if (!items.length || !("IntersectionObserver" in window)) return;   // walang animation, nakikita pa rin lahat
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  //  column element (0, 1, 2)
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
      observer.unobserve(item);   // one time
      //after animation, delay is removed, so that hover doesn't get bugs
      setTimeout(function () { item.style.transitionDelay = ""; }, (delay + 0.7) * 1000);
    });
  }, { threshold: 0.15 });

  function startItems() {
    items.forEach(function (item) { observer.observe(item); });
  }

  if (!panel) { startItems(); return; }

  //1. panel first: the navy blue background, float up animation. 2. PANEL_WAIT, and the card and video
  const panelObserver = new IntersectionObserver(function (entries) {
    if (!entries.some(function (e) { return e.isIntersecting; })) return;
    panelObserver.disconnect();
    panel.classList.add("in");
    setTimeout(startItems, PANEL_WAIT);
  }, { threshold: 0.1 });
  panelObserver.observe(panel);
})();

// ===== YOUTUBE FACADE =====
// thumbnail muna bago ang buong video para di mag-fliker
//this code is getting the video id and title from the <iframe in index.html
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


    // high resolution first (maxres). if this video doesn't have, "hqdefault" will be use.
    const img = document.createElement("img");
    img.alt = "";
    img.decoding = "async";
    img.src = "https://i.ytimg.com/vi/" + id + "/maxresdefault.jpg";
    img.addEventListener("error", function () {
      if (!img.dataset.fallback) { img.dataset.fallback = "1"; img.src = "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg"; }
    });
    //maxres that is empty is 120px of width
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

    //when click: the video will automatic played
    btn.addEventListener("click", function () {
      iframe.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1";
      iframe.removeAttribute("loading");
      btn.replaceWith(iframe);
      iframe.focus();
    });

    iframe.replaceWith(btn);
  });
})();
