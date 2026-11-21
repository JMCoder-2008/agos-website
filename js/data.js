// data.js - number ng Environmental Data Dashboard.
// once changed, the number change.

const dashboardData = {

  // true = may "SAMPLE DATA" na label(temporary) make false if meron na.
  isSample: false,

  // card in environmental dashboard, value or text.
  stats: [
    { label: "Water Stress",                value: "31.1%",  caption: "Philippines, 2025" },
    { label: "Freshwater Withdrawals",      value: "101.61", caption: "Billion m³, 2025" },
    { label: "At Least Basic Drinking Water", value: "97.5%", caption: "Families, 2024" },
    { label: "Safely Managed Drinking Water", value: "53.1%", caption: "Families, 2024" }
  ],

  // Note sa ilalim ng apat na stat card
  statsNote: "Note: The 53.1% safely managed group is included within the 97.5% at-least-basic figure. These figures are not additive.",

  // A. El Niño: bar chart. Bilang ng provinces kada kategorya.
  elNino: {
    title: "El Niño and Dry Conditions in the Philippines",
    labels: ["Drought", "Dry spell", "Dry conditions"],
    values: [5, 11, 10],
    caption: "Number of provinces under each reported drought or dry-condition category in October 2026. Source: PAGASA."
  },

  // B. Pax Silica: dalawang stat card (walang chart)
  paxSilica: {
    title: "Pax Silica: Proposed Water Demand",
    stats: [
      { value: "65–90",   unit: "Million liters per day", caption: "BCDA's estimated daily water requirement for the proposed industries." },
      { value: "Up to 120", unit: "Million liters per day", caption: "Initial proposed design capacity of the surface-water harvesting system." }
    ]
  },

  // C. Water Resources: donut chart. values is percent.
  water: {
    title: "Water Allocation by Use, 2025",
    labels: ["Power Generation", "Irrigation", "Industrial Use", "Other Uses"],
    values: [58.9, 26.9, 10.0, 4.2],
    caption: "Percentage distribution of allocated water by use in 2025. Other uses is the remaining share calculated from 100%."
  },

  // D. Water Stress: line chart. values is percent.
  waterStress: {
    title: "Philippine Water Stress Level (2016–2025)",
    labels: ["2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025"],
    values: [26.4, 28.1, 28.2, 26.3, 26.7, 27.2, 27.8, 27.9, 28.5, 31.1],
    caption: "Annual Philippine water stress levels from 2016 to 2025. Source: PSA Water Accounts."
  }
};
