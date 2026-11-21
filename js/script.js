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
  // ===== Mga page =====
  { title: "Home",        page: "index.html",       anchor: "",           where: "Page", keywords: "main homepage" },
  { title: "Learn",       page: "learn.html",       anchor: "",           where: "Page", keywords: "articles tips data dashboard references" },
  { title: "Interactive", page: "interactive.html", anchor: "",           where: "Page", keywords: "map quiz drought" },
  { title: "About Us",    page: "about.html",       anchor: "",           where: "Page", keywords: "team group purpose members" },

  // ===== HOME =====
  { title: "Every Drop Matters",   page: "index.html", anchor: "hero",  where: "Home", keywords: "discover water resources understand environmental challenges protect future explore now" },
  { title: "Learn and Discover",   page: "index.html", anchor: "intro", where: "Home", keywords: "introduction videos topics conserve water home" },
  { title: "Pax Silica",           page: "index.html", anchor: "intro", where: "Home", keywords: "international initiative cooperation security supply chain semiconductors advanced technology ai hub economy video" },
  { title: "El Niño",              page: "index.html", anchor: "intro", where: "Home", keywords: "el nino weather phenomenon hot temperatures less rainfall drought water shortages video" },
  { title: "Water Resources",      page: "index.html", anchor: "intro", where: "Home", keywords: "rivers lakes groundwater oceans drinking farming daily activities video" },
  { title: "Why Every Drop Counts: Easy Ways to Save Water Today!", page: "index.html", anchor: "intro", where: "Home > Video", keywords: "youtube conserve save water tips" },

  // ===== LEARN: Save Water, Save Life =====
  { title: "Save Water, Save Life",        page: "learn.html", anchor: "conservation", where: "Learn", keywords: "conservation tips small actions today protect future simple choices lasting impact" },
  { title: "Turn off the tap",             page: "learn.html", anchor: "conservation", where: "Learn > Save Water, Save Life", keywords: "faucet shut off not in use save clean water" },
  { title: "Fix leaks",                    page: "learn.html", anchor: "conservation", where: "Learn > Save Water, Save Life", keywords: "repair leak prevent water waste home" },
  { title: "Reuse water",                  page: "learn.html", anchor: "conservation", where: "Learn > Save Water, Save Life", keywords: "collect cleaning gardening recycle" },
  { title: "Choose eco-friendly products", page: "learn.html", anchor: "conservation", where: "Learn > Save Water, Save Life", keywords: "gentle on water environment" },

  // ===== LEARN: Environmental Data Dashboard =====
  { title: "Environmental Data Dashboard", page: "learn.html", anchor: "data", where: "Learn", keywords: "charts graphs statistics numbers figures" },
  { title: "Water Stress (31.1%)",         page: "learn.html", anchor: "data", where: "Learn > Dashboard", keywords: "philippines 2025 percent" },
  { title: "Freshwater Withdrawals",       page: "learn.html", anchor: "data", where: "Learn > Dashboard", keywords: "101.61 billion cubic meters 2025" },
  { title: "At Least Basic Drinking Water",page: "learn.html", anchor: "data", where: "Learn > Dashboard", keywords: "97.5 families 2024 access" },
  { title: "Safely Managed Drinking Water",page: "learn.html", anchor: "data", where: "Learn > Dashboard", keywords: "53.1 families 2024 access" },
  { title: "El Niño and Dry Conditions in the Philippines", page: "learn.html", anchor: "title-el-nino", where: "Learn > Dashboard > Chart", keywords: "bar chart drought dry spell provinces october 2026 pagasa" },
  { title: "Pax Silica: Proposed Water Demand",             page: "learn.html", anchor: "title-pax-silica", where: "Learn > Dashboard", keywords: "bcda million liters per day surface-water harvesting 65 90 120" },
  { title: "Water Allocation by Use, 2025",                 page: "learn.html", anchor: "title-water", where: "Learn > Dashboard > Chart", keywords: "donut chart power generation irrigation industrial use percent" },
  { title: "Philippine Water Stress Level (2016\u20132025)", page: "learn.html", anchor: "title-water-stress", where: "Learn > Dashboard > Chart", keywords: "line chart 2016 2017 2018 2019 2020 2021 2022 2023 2024 2025 psa water accounts" },

  // ===== LEARN: Our References =====
  { title: "Our References",        page: "learn.html", anchor: "references", where: "Learn", keywords: "sources links trusted data citations" },
  { title: "DOST-PAGASA, PH Meteorological Drought Monitor", page: "learn.html", anchor: "references", where: "Learn > References > Trusted Sources", keywords: "drought caster" },
  { title: "Philippine Water Statistics",       page: "learn.html", anchor: "references", where: "Learn > References > Data", keywords: "psa water stress freshwater withdrawals" },
  { title: "Drinking Water Access",             page: "learn.html", anchor: "references", where: "Learn > References > Data", keywords: "psa basic safely managed apis 2024" },
  { title: "Water Allocation by Use (PSA)",     page: "learn.html", anchor: "references", where: "Learn > References > Data", keywords: "psa volume allocated water power generation irrigation industrial" },
  { title: "El Niño and Dry Conditions (PAGASA press release)", page: "learn.html", anchor: "references", where: "Learn > References > Data", keywords: "pagasa drought dry spell provinces" },
  { title: "Pax Silica: Proposed Water Demand (PCO news)",      page: "learn.html", anchor: "references", where: "Learn > References > Data", keywords: "bcda jobs million liters" },
  { title: "YouTube videos",                    page: "learn.html", anchor: "references", where: "Learn > References > Links", keywords: "pax silica el nino why every drop counts" },

  // ===== INTERACTIVE =====
  { title: "Explore the Philippines",        page: "interactive.html", anchor: "map-section", where: "Interactive", keywords: "map province drought assessment outlook pagasa drought caster" },
  { title: "Drought Monitoring in the Philippines", page: "interactive.html", anchor: "map-section", where: "Interactive > Map", keywords: "pagasa drought caster" },
  { title: "Understanding Drought Conditions", page: "interactive.html", anchor: "map-section", where: "Interactive > Map", keywords: "observed drought assessments outlook rainfall" },
  { title: "What You Can Discover",          page: "interactive.html", anchor: "map-section", where: "Interactive > Map", keywords: "drought-affected provinces forecasts outlooks classification levels" },
  { title: "Drought Classification",         page: "interactive.html", anchor: "map-section", where: "Interactive > Map", keywords: "not affected dry condition dry spell drought no data categories" },
  { title: "Latest reported drought assessment", page: "interactive.html", anchor: "map-section", where: "Interactive > Map", keywords: "october 2026 5 drought 11 dry spell 10 dry condition provinces" },
  { title: "Think Wise",                     page: "interactive.html", anchor: "quiz", where: "Interactive", keywords: "quiz questions test knowledge check score" },

  // ===== ABOUT US =====
  { title: "Purpose",         page: "about.html", anchor: "purpose",  where: "About Us", keywords: "goal mission inform educate water resources environmental issues" },
  { title: "Group Photo",     page: "about.html", anchor: "picture",  where: "About Us", keywords: "picture project members" },
  { title: "Project Members", page: "about.html", anchor: "members",  where: "About Us", keywords: "team group roles" },
  { title: "Lance Jay Aguilera",      page: "about.html", anchor: "members", where: "About Us > Group Leader / Project Coordinator", keywords: "aguilera lance" },
  { title: "Princess Nadine Atienza", page: "about.html", anchor: "members", where: "About Us > UI/UX Designer / Content Developer", keywords: "atienza nadine" },
  { title: "Jemil Devota",            page: "about.html", anchor: "members", where: "About Us > System Developer / Programmer", keywords: "devota" },
  { title: "Jayvee Gatinao",          page: "about.html", anchor: "members", where: "About Us > Documentation and Testing", keywords: "gatinao" },
  { title: "Loren Kempis",            page: "about.html", anchor: "members", where: "About Us > Presentation and Documentation", keywords: "kempis" },
  { title: "Lyka Jane Linatoc",       page: "about.html", anchor: "members", where: "About Us > UI/UX Designer / Content Developer", keywords: "linatoc lyka" },
  { title: "Jhon Ashley Manese",      page: "about.html", anchor: "members", where: "About Us > Presentation and Documentation", keywords: "manese ashley" },
  { title: "Gian Carlo Sagales",      page: "about.html", anchor: "members", where: "About Us > Documentation and Testing", keywords: "sagales gian" }
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

  // Sukatin ang taas ng navbar para tama ang espasyo sa ilalim nito (fixed ang navbar kaya wala na ito sa daloy ng page)
  function measureHeader() {
    document.documentElement.style.setProperty("--header-h", header.offsetHeight + "px");
  }
  measureHeader();
  window.addEventListener("resize", measureHeader);
  window.addEventListener("load", measureHeader);
  if (window.ResizeObserver) new ResizeObserver(measureHeader).observe(header);

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
