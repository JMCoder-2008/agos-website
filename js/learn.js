// learn.js - gumagawa ng mga stat card at chart galing sa dashboardData (js/data.js)

// Mga kulay ng chart (galing sa design: navy at teal)
const NAVY = "#0b2d5c";
const TEAL = "#0fb0c9";
const TEAL_LIGHT = "#6cd0dd";
const PALE = "#b7d6e8";

// Ang font ng mga chart ay sumusunod sa font ng website (galing sa css/fonts.css)
Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
// Navy ang text ng chart (axis labels, legend) para mabasa sa puting card kahit medyo transparent
Chart.defaults.color = "#123B5D";

// Gumagawa lang ng chart (at nagpe-play ang animation nito) kapag nakikita na ito sa screen,
// para hindi maubos ang animation habang hindi pa nakikita ng user.
// Para baguhin kung kailan magsisimula: palitan ang threshold (0.35 = kapag 35% na ng chart ang nakikita)
function whenVisible(element, create) {
  if (!("IntersectionObserver" in window)) { create(); return; }
  const observer = new IntersectionObserver(function (entries) {
    if (entries.some(function (e) { return e.isIntersecting; })) {
      observer.disconnect();
      create();
    }
  }, { threshold: 0.35 });
  observer.observe(element);
}

// 1. STAT CARDS: gagawa ng isang card para sa bawat item sa dashboardData.stats
const statContainer = document.getElementById("stat-cards");

dashboardData.stats.forEach(function (stat) {
  const card = document.createElement("article");
  card.className = "stat-card";
  card.innerHTML =
    '<p class="stat-label">' + stat.label + "</p>" +
    '<p class="stat-value">' + stat.value + "</p>" +
    '<p class="stat-caption">' + stat.caption + "</p>";
  statContainer.appendChild(card);
});

// Note sa ilalim ng stat cards
document.getElementById("stat-note").textContent = dashboardData.statsNote || "";

// A. EL NIÑO: bar chart (bilang ng provinces)
const elNino = dashboardData.elNino;
document.getElementById("title-el-nino").textContent = elNino.title;
const canvas_chart_el_nino = document.getElementById("chart-el-nino");
whenVisible(canvas_chart_el_nino, function () {
  new Chart(canvas_chart_el_nino, {
    type: "bar",
    data: {
      labels: elNino.labels,
      datasets: [{ data: elNino.values, backgroundColor: TEAL }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 12, ticks: { stepSize: 3 } }
      }
    }
  });
});

// B. PAX SILICA: dalawang stat card (walang chart)
const pax = dashboardData.paxSilica;
document.getElementById("title-pax-silica").textContent = pax.title;
const paxContainer = document.getElementById("pax-cards");
pax.stats.forEach(function (stat) {
  const card = document.createElement("div");
  card.className = "pax-card";
  card.innerHTML =
    '<p class="pax-value">' + stat.value + "</p>" +
    '<p class="pax-unit">' + stat.unit + "</p>" +
    '<p class="pax-caption">' + stat.caption + "</p>";
  paxContainer.appendChild(card);
});

// C. WATER RESOURCES: donut chart (nasa legend ang label at porsyento)
const water = dashboardData.water;
document.getElementById("title-water").textContent = water.title;
const canvas_chart_water = document.getElementById("chart-water");
whenVisible(canvas_chart_water, function () {
  new Chart(canvas_chart_water, {
    type: "doughnut",
    data: {
      labels: water.labels.map(function (label, i) {
        return label + " (" + water.values[i].toFixed(1) + "%)";
      }),
      datasets: [{
        data: water.values,
        backgroundColor: [NAVY, TEAL, TEAL_LIGHT, PALE]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "right" } }
    }
  });
});

// D. WATER STRESS: line chart (percent)
const stress = dashboardData.waterStress;
document.getElementById("title-water-stress").textContent = stress.title;
const canvas_chart_water_stress = document.getElementById("chart-water-stress");
whenVisible(canvas_chart_water_stress, function () {
  new Chart(canvas_chart_water_stress, {
    type: "line",
    data: {
      labels: stress.labels,
      datasets: [{
        data: stress.values,
        borderColor: TEAL,
        backgroundColor: TEAL,
        tension: 0.3,
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: function (ctx) { return ctx.parsed.y.toFixed(1) + "%"; } } }
      },
      scales: {
        y: { min: 24, max: 32, ticks: { stepSize: 2, callback: function (value) { return value + "%"; } } }
      }
    }
  });
});

// 5. CAPTIONS / SOURCES: nasa ilalim ng bawat chart
[
  ["source-el-nino", elNino.caption],
  ["source-water", water.caption],
  ["source-water-stress", stress.caption]
].forEach(function (item) {
  document.getElementById(item[0]).textContent = item[1] || "";
});

// 6. SAMPLE DATA label (kung meron): nakatago kapag isSample ay false
document.querySelectorAll(".sample-tag, .sample-note").forEach(function (element) {
  element.hidden = !dashboardData.isSample;
});
