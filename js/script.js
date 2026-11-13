// ===== NAVBAR: markahan ang menu button ng page na binuksan (active) =====
const currentPage = location.pathname.split("/").pop() || "index.html";

document.querySelectorAll("nav ul a").forEach(function (link) {
  if (link.getAttribute("href") === currentPage) {
    link.classList.add("active");
    link.setAttribute("aria-current", "page");
  }
});

// ===== SEARCH =====
// DITO LANG dadagdagan kapag may bagong mahahanap. Isang linya = isang suggestion.
//   title: lumalabas na pangalan | page: file | anchor: id ng section (pwedeng walang laman)
//   where: lumalabas sa ilalim ng title | keywords: ibang salita na dapat makahanap dito
const searchIndex = [
  // Mga page
  { title: "Home",        page: "index.html",       anchor: "",           where: "Page",  keywords: "main homepage every drop matters" },
  { title: "Learn",       page: "learn.html",       anchor: "",           where: "Page",  keywords: "articles tips data" },
  { title: "Interactive", page: "interactive.html", anchor: "",           where: "Page",  keywords: "map quiz" },
  { title: "About Us",    page: "about.html",       anchor: "",           where: "Page",  keywords: "team group purpose" },

  // Home
  { title: "Every Drop Matters", page: "index.html", anchor: "hero",  where: "Home", keywords: "discover water resources explore now" },
  { title: "Pax Silica",         page: "index.html", anchor: "intro", where: "Home", keywords: "ai semiconductor technology supply chain video" },
  { title: "El Niño",            page: "index.html", anchor: "intro", where: "Home", keywords: "el nino weather drought hot rainfall video" },
  { title: "Water Resources",    page: "index.html", anchor: "intro", where: "Home", keywords: "rivers lakes groundwater oceans video" },

  // Learn
  { title: "Save Water, Save Life",         page: "learn.html", anchor: "conservation", where: "Learn", keywords: "conservation tips" },
  { title: "Turn off the tap",              page: "learn.html", anchor: "conservation", where: "Learn > Save Water, Save Life", keywords: "faucet" },
  { title: "Fix leaks",                     page: "learn.html", anchor: "conservation", where: "Learn > Save Water, Save Life", keywords: "repair leak" },
  { title: "Reuse water",                   page: "learn.html", anchor: "conservation", where: "Learn > Save Water, Save Life", keywords: "gardening cleaning recycle" },
  { title: "Choose eco-friendly products",  page: "learn.html", anchor: "conservation", where: "Learn > Save Water, Save Life", keywords: "environment" },
  { title: "Environmental Data Dashboard",  page: "learn.html", anchor: "data",         where: "Learn", keywords: "charts graph statistics temperature" },
  { title: "Our References",                page: "learn.html", anchor: "references",   where: "Learn", keywords: "sources links trusted" },

  // Interactive
  { title: "Explore the Philippines", page: "interactive.html", anchor: "map-section", where: "Interactive", keywords: "map province drought pagasa" },
  { title: "Think Wise",              page: "interactive.html", anchor: "quiz",        where: "Interactive", keywords: "quiz questions test" },

  // About Us
  { title: "Purpose",          page: "about.html", anchor: "purpose", where: "About Us", keywords: "goal mission" },
  { title: "Project Members",  page: "about.html", anchor: "members", where: "About Us", keywords: "team group" },
  { title: "Lance Jay Aguilera",       page: "about.html", anchor: "members", where: "About Us > Group Leader / Project Coordinator", keywords: "aguilera" },
  { title: "Princess Nadine Atienza",  page: "about.html", anchor: "members", where: "About Us > UI/UX Designer / Content Developer", keywords: "atienza" },
  { title: "Jemil Devota",             page: "about.html", anchor: "members", where: "About Us > System Developer / Programmer", keywords: "devota" },
  { title: "Jayvee Gatinao",           page: "about.html", anchor: "members", where: "About Us > Documentation and Testing", keywords: "gatinao" },
  { title: "Loren Kempis",             page: "about.html", anchor: "members", where: "About Us > Presentation and Documentation", keywords: "kempis" },
  { title: "Lyka Jane Linatoc",        page: "about.html", anchor: "members", where: "About Us > UI/UX Designer / Content Developer", keywords: "linatoc" },
  { title: "Jhon Ashley Manese",       page: "about.html", anchor: "members", where: "About Us > Presentation and Documentation", keywords: "manese" },
  { title: "Gian Carlo Sagales",       page: "about.html", anchor: "members", where: "About Us > Documentation and Testing", keywords: "sagales" }
];

(function () {
  const nav = document.querySelector("nav");
  if (!nav) return;

  // Gawin ang search box sa loob ng navbar (kaya hindi na kailangang galawin ang HTML ng bawat page)
  const wrap = document.createElement("div");
  wrap.className = "search";
  wrap.innerHTML =
    '<div class="search-box">' +
      '<svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">' +
        '<circle cx="11" cy="11" r="7"></circle><line x1="16.5" y1="16.5" x2="21" y2="21"></line>' +
      '</svg>' +
      '<input type="text" class="search-input" placeholder="Search" aria-label="Search" autocomplete="off" spellcheck="false">' +
    '</div>' +
    '<div class="search-results" role="listbox" hidden></div>';
  nav.appendChild(wrap);

  const input   = wrap.querySelector(".search-input");
  const results = wrap.querySelector(".search-results");
  let items = [];     // mga <a> na nasa listahan
  let selected = -1;  // naka-highlight gamit ang arrow keys

  // Gawing simple ang text: maliit na letra, tanggalin ang tuldok/tilde (ñ -> n)
  function clean(text) {
    return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  // Bigyan ng score ang bawat entry (mas mataas = mas relevant). 0 = hindi tugma
  function score(entry, query) {
    const title = clean(entry.title);
    const extra = clean(entry.keywords + " " + entry.where);
    const words = query.split(/\s+/).filter(Boolean);
    let total = 0;
    for (const w of words) {
      if (title.startsWith(w))                  total += 100;
      else if (title.includes(" " + w))         total += 70;
      else if (title.includes(w))               total += 50;
      else if ((" " + extra).includes(" " + w)) total += 20;   // sa keywords: simula lang ng salita
      else return 0;                            // kailangang tugma ang LAHAT ng salita
    }
    return total;
  }

  // I-bold ang tugmang parte ng title (gamit ang textContent, kaya ligtas)
  function fillTitle(el, text, query) {
    const first = query.split(/\s+/)[0];
    const i = clean(text).indexOf(first);
    if (i < 0 || !first) { el.textContent = text; return; }
    el.append(text.slice(0, i));
    const mark = document.createElement("mark");
    mark.textContent = text.slice(i, i + first.length);
    el.append(mark, text.slice(i + first.length));
  }

  function render() {
    const query = clean(input.value.trim());
    results.innerHTML = "";
    items = [];
    selected = -1;
    if (!query) { results.hidden = true; return; }

    const found = searchIndex
      .map(function (e) { return { e: e, s: score(e, query) }; })
      .filter(function (x) { return x.s > 0; })
      .sort(function (a, b) { return b.s - a.s; })
      .slice(0, 6);

    if (!found.length) {
      const empty = document.createElement("div");
      empty.className = "r-empty";
      empty.textContent = "No results found";
      results.appendChild(empty);
    }

    found.forEach(function (x) {
      const a = document.createElement("a");
      a.href = x.e.page + (x.e.anchor ? "#" + x.e.anchor : "");   // gumagana kahit nasa ibang page
      const t = document.createElement("span");
      t.className = "r-title";
      fillTitle(t, x.e.title, query);
      const w = document.createElement("span");
      w.className = "r-where";
      w.textContent = x.e.where;
      a.append(t, w);
      results.appendChild(a);
      items.push(a);
    });
    results.hidden = false;
  }

  function select(n) {
    if (!items.length) return;
    selected = (n + items.length) % items.length;
    items.forEach(function (a, i) { a.classList.toggle("selected", i === selected); });
  }

  input.addEventListener("input", render);
  input.addEventListener("focus", render);

  input.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown")    { e.preventDefault(); select(selected + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); select(selected - 1); }
    else if (e.key === "Enter")   { const a = items[selected] || items[0]; if (a) location.href = a.href; }
    else if (e.key === "Escape")  { input.value = ""; results.hidden = true; input.blur(); }
  });

  // Pindot sa labas = itago ang mga suggestion
  document.addEventListener("click", function (e) {
    if (!wrap.contains(e.target)) results.hidden = true;
  });
})();

// ===== NAVBAR: auto-hide =====
// Laging nakikita ang navbar habang nag-i-scroll. Kapag 1 segundo nang walang scroll, nagtatago ito (full screen ang page).
// Lalabas ulit kapag: nag-scroll, pumunta ang mouse sa taas ng screen, o na-Tab / na-click ang search.
(function () {
  const header = document.querySelector("header");
  if (!header) return;

  const HIDE_DELAY = 1000;   // ms bago magtago (1 segundo)
  const TOP_ZONE = 60;       // px mula sa taas: kapag nandito ang mouse, lalabas ang navbar
  let timer;

  function keepOpen() {
    const results = document.querySelector(".search-results");
    return header.matches(":hover") ||                       // nasa navbar ang mouse
           header.contains(document.activeElement) ||        // nakapokus (halimbawa nagta-type sa search)
           (results && !results.hidden);                     // may nakabukas na suggestion
  }

  function hide() {
    if (window.scrollY <= 5 || keepOpen()) { schedule(); return; }   // nasa pinakataas pa ng page: huwag itago
    header.classList.add("nav-hidden");
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(hide, HIDE_DELAY);
  }

  function show() {
    header.classList.remove("nav-hidden");
    schedule();
  }

  // Manipis na hindi nakikitang strip sa taas ng screen. Kailangan ito dahil kapag video/mapa (iframe)
  // ang nasa ilalim ng mouse, hindi nakikita ng page ang galaw ng mouse.
  const hotzone = document.createElement("div");
  hotzone.className = "nav-hotzone";
  hotzone.addEventListener("mouseenter", show);
  hotzone.addEventListener("mousemove", show);
  document.body.appendChild(hotzone);

    // Pagbalik sa pinakataas ng page: laging nakikita ang navbar (hindi na magtatago hanggang mag-scroll pababa ulit)
  window.addEventListener("scroll", function () {
    if (window.scrollY <= 5) header.classList.remove("nav-hidden");
    schedule();
  }, { passive: true });
  document.addEventListener("mousemove", function (e) {
    if (e.clientY <= TOP_ZONE) show();
  });

  schedule();
})();
