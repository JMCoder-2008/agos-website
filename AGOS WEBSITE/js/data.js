// data.js - DITO LANG papalitan ang mga numero ng Environmental Data Dashboard.
// Kapag nagbago ang mga numero dito, awtomatikong magbabago ang mga card at chart sa Learn page.

const dashboardData = {

  // true = may "SAMPLE DATA" na label. Gawing false kapag totoong data na (mawawala ang label).
  isSample: true,

  // Apat na card sa taas. Ang value ay puwedeng numero o text.
  stats: [
    { label: "Temperature", value: "24.3", caption: "avg surface temp" },
    { label: "Total",       value: "8.2",  caption: "estimated total" },
    { label: "Average",     value: "8.05", caption: "global average" },
    { label: "Score",       value: "68",   caption: "overall index score" }
  ],

  // El Niño: line chart. Dapat magkapareho ang bilang ng labels at values.
  elNino: {
    unit: "°C",
    labels: ["2018", "2019", "2020", "2021", "2022", "2023"],
    values: [23.2, 23.4, 23.8, 24.0, 24.5, 25.0],
    source: ""   // ilagay ang source kapag totoong data na, halimbawa: "DOST-PAGASA"
  },

  // Pax Silica: bar chart
  paxSilica: {
    unit: "K tons",
    labels: ["2019", "2020", "2021", "2022", "2023"],
    values: [5.1, 5.8, 6.6, 7.2, 8.2],
    source: ""
  },

  // Water Resources: donut chart. Ang values ay porsyento (dapat 100 ang kabuuan).
  water: {
    labels: ["Below 7.8", "7.8 – 8.1", "8.1 – 8.4", "Above 8.4"],
    values: [15, 40, 30, 15],
    source: ""
  }
};
