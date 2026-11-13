// learn.js - gumagawa ng mga stat card at chart galing sa dashboardData (js/data.js)

// Mga kulay ng chart (galing sa design: navy at teal)
const NAVY = "#0b2d5c";
const TEAL = "#0fb0c9";
const TEAL_LIGHT = "#6cd0dd";
const PALE = "#b7d6e8";

// Ang font ng mga chart ay sumusunod sa font ng website (galing sa css/fonts.css)
Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;

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
    '<p class="stat-caption">' + stat.caption + "</p>" +
    '<p class="sample-tag">SAMPLE DATA</p>';
  statContainer.appendChild(card);
});

// 2. EL NIÑO: line chart
const elNino = dashboardData.elNino;
const canvas_chart_el_nino = document.getElementById("chart-el-nino");
whenVisible(canvas_chart_el_nino, function () {
  new Chart(canvas_chart_el_nino, {
    type: "line",
    data: {
      labels: elNino.labels,
      datasets: [{
        data: elNino.values,
        borderColor: TEAL,
        backgroundColor: TEAL,
        tension: 0.3,
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { callback: function (value) { return value + elNino.unit; } } }
      }
    }
  });
});

// 3. PAX SILICA: bar chart
const pax = dashboardData.paxSilica;
const canvas_chart_pax_silica = document.getElementById("chart-pax-silica");
whenVisible(canvas_chart_pax_silica, function () {
  new Chart(canvas_chart_pax_silica, {
    type: "bar",
    data: {
      labels: pax.labels,
      datasets: [{ data: pax.values, backgroundColor: TEAL }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: pax.unit } }
      }
    }
  });
});

// 4. WATER RESOURCES: donut chart (nasa legend ang label at porsyento)
const water = dashboardData.water;
const canvas_chart_water = document.getElementById("chart-water");
whenVisible(canvas_chart_water, function () {
  new Chart(canvas_chart_water, {
    type: "doughnut",
    data: {
      labels: water.labels.map(function (label, i) {
        return label + " (" + water.values[i] + "%)";
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

// 5. SOURCES: ipapakita lang kung may nakalagay sa data.js
[
  ["source-el-nino", elNino.source],
  ["source-pax-silica", pax.source],
  ["source-water", water.source]
].forEach(function (item) {
  const element = document.getElementById(item[0]);
  element.textContent = item[1] ? "Source: " + item[1] : "";
});

// 6. SAMPLE DATA label: nakatago kapag isSample ay false
document.querySelectorAll(".sample-tag, .sample-note").forEach(function (element) {
  element.hidden = !dashboardData.isSample;
});
