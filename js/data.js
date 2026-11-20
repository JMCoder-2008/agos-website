// data.js - number ng Environmental Data Dashboard.
// once changed, the number change.

const dashboardData = {

  // true = may "SAMPLE DATA" na label(temporary) make false if meron na.
  isSample: true,

  // card in environmental dashboard, value or text.
  stats: [
    { label: "Temperature", value: "24.3", caption: "avg surface temp" },
    { label: "Total",       value: "8.2",  caption: "estimated total" },
    { label: "Average",     value: "8.05", caption: "global average" },
    { label: "Score",       value: "68",   caption: "overall index score" }
  ],

  // El Niño: line chart. edit value and labels.
  elNino: {
    unit: "°C",
    labels: ["2018", "2019", "2020", "2021", "2022", "2023"],
    values: [23.2, 23.4, 23.8, 24.0, 24.5, 25.0],
    source: ""   // sources
  },

  // Pax Silica: bar chart. edit value and labels
  paxSilica: {
    unit: "K tons",
    labels: ["2019", "2020", "2021", "2022", "2023"],
    values: [5.1, 5.8, 6.6, 7.2, 8.2],
    source: ""
  },

  // Water Resources: donut chart. values is percent.
  water: {
    labels: ["Below 7.8", "7.8 – 8.1", "8.1 – 8.4", "Above 8.4"],
    values: [15, 20, 30, 15],
    source: ""
  }
};
