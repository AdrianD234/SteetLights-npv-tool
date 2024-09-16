// script.js

// Global variables
let cashFlowChart;

// Initialize the chart when the page loads
window.onload = function() {
  initializeChart();
  updateCalculations();
};

// Function to initialize the chart
function initializeChart() {
  const ctx = document.getElementById('cashFlowChart').getContext('2d');
  cashFlowChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [], // Years
      datasets: [
        {
          label: 'Option 1: Maintain HPS',
          data: [],
          borderColor: 'rgba(255, 99, 132, 1)',
          fill: false,
        },
        {
          label: 'Option 2: Replace with LED',
          data: [],
          borderColor: 'rgba(54, 162, 235, 1)',
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      title: {
        display: true,
        text: 'Cumulative Cash Flow Over Time',
      },
      tooltips: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(tooltipItem, data) {
            return (
              data.datasets[tooltipItem.datasetIndex].label +
              ': $' +
              tooltipItem.yLabel.toFixed(2)
            );
          },
        },
      },
      hover: {
        mode: 'nearest',
        intersect: true,
      },
      scales: {
        xAxes: [
          {
            display: true,
            scaleLabel: {
              display: true,
              labelString: 'Year',
            },
          },
        ],
        yAxes: [
          {
            display: true,
            scaleLabel: {
              display: true,
              labelString: 'Cumulative Cost ($)',
            },
            ticks: {
              callback: function(value, index, values) {
                return '$' + value.toLocaleString();
              },
            },
          },
        ],
      },
    },
  });
}

// Function to update calculations and chart
function updateCalculations() {
  // Gather input values
  const energyCost = parseFloat(document.getElementById('energyCost').value) / 100; // Convert cents to dollars
  const discountRate = parseFloat(document.getElementById('discountRate').value) / 100;
  const analysisPeriod = parseInt(document.getElementById('analysisPeriod').value);

  const hpsUnits = parseInt(document.getElementById('hpsUnits').value);
  const ledUnits = parseInt(document.getElementById('ledUnits').value);
  const operatingHours = parseFloat(document.getElementById('operatingHours').value);

  const hpsConsumption = parseFloat(document.getElementById('hpsConsumption').value);
  const ledConsumption = parseFloat(document.getElementById('ledConsumption').value);
  const hpsLampLife = parseInt(document.getElementById('hpsLampLife').value);

  const hpsLampCost = parseFloat(document.getElementById('hpsLampCost').value);
  const ledLuminaireCost = parseFloat(document.getElementById('ledLuminaireCost').value);
  const ledInstallationCost = parseFloat(document.getElementById('ledInstallationCost').value);

  const ledCleaningCost = parseFloat(document.getElementById('ledCleaningCost').value);
  const ledCleaningFrequency = parseInt(document.getElementById('ledCleaningFrequency').value);
  const hpsReplacementRate = parseFloat(document.getElementById('hpsReplacementRate').value) / 100;

  const linesChargeSavings = parseFloat(document.getElementById('linesChargeSavings').value);
  const ledDimmingReduction = parseFloat(document.getElementById('ledDimmingReduction').value) / 100;
  const includeDimming = document.getElementById('includeDimming').checked;

  // Initialize arrays to store annual costs and cash flows
  let npvOption1 = 0;
  let npvOption2 = 0;
  let cumulativeCostOption1 = [];
  let cumulativeCostOption2 = [];

  let cashFlowsOption1 = [];
  let cashFlowsOption2 = [];

  // Option 1 Constants
  // Energy cost per annum
  const totalEnergyHPS = (hpsUnits * hpsConsumption * operatingHours) / 1000; // kWh
  const energyCostOption1 = totalEnergyHPS * energyCost;

  // Lamp replacement cost per annum
  const totalLampReplacementCost = hpsUnits * hpsLampCost;
  const lampReplacementCostOption1 = totalLampReplacementCost / hpsLampLife;

  // Luminaire replacement cost per annum
  const unitsReplacedPerYear = hpsUnits * hpsReplacementRate;
  const luminaireReplacementCostPerUnit = ledLuminaireCost + ledInstallationCost;
  const luminaireReplacementCostOption1 = unitsReplacedPerYear * luminaireReplacementCostPerUnit;

  // Total annual cost for Option 1
  const totalAnnualCostOption1 = energyCostOption1 + lampReplacementCostOption1 + luminaireReplacementCostOption1;

  // Option 2 Constants
  // Initial investment
  const initialInvestmentOption2 = ledUnits * (ledLuminaireCost + ledInstallationCost);

  // Energy cost per annum
  let totalEnergyLED = (ledUnits * ledConsumption * operatingHours) / 1000; // kWh
  const energyCostNoDimming = totalEnergyLED * energyCost;

  if (includeDimming) {
    totalEnergyLED *= 1 - ledDimmingReduction;
  }
  const energyCostOption2 = totalEnergyLED * energyCost;

  // Energy cost savings through dimming
  const energySavingsThroughDimming = energyCostNoDimming - energyCostOption2;

  // Lines company charge savings
  const totalLinesChargeSavings = ledUnits * linesChargeSavings;

  // Annual energy cost after lines charge savings
  const netEnergyCostOption2 = energyCostOption2 - totalLinesChargeSavings;

  // Annual maintenance cost (LED cleaning)
  const maintenanceCostOption2 = [];
  for (let t = 0; t <= analysisPeriod; t++) {
    if (t > 0 && ledCleaningFrequency > 0 && t % ledCleaningFrequency === 0) {
      maintenanceCostOption2[t] = ledUnits * ledCleaningCost;
    } else {
      maintenanceCostOption2[t] = 0;
    }
  }

  // Calculate for each year
  for (let t = 0; t <= analysisPeriod; t++) {
    // Option 1
    let totalCostOption1 = totalAnnualCostOption1;

    // Discount the cost
    const discountedCostOption1 = totalCostOption1 / Math.pow(1 + discountRate, t);
    if (t > 0) {
      npvOption1 += discountedCostOption1;
    }

    // Cumulative cost
    if (t === 0) {
      cumulativeCostOption1[t] = 0; // No cost at year 0
    } else {
      cumulativeCostOption1[t] = cumulativeCostOption1[t - 1] + totalCostOption1;
    }

    cashFlowsOption1[t] = totalCostOption1;

    // Option 2
    let totalCostOption2 = 0;

    if (t === 0) {
      totalCostOption2 = initialInvestmentOption2 + netEnergyCostOption2 - energySavingsThroughDimming;
      npvOption2 += initialInvestmentOption2; // Initial investment at t=0 (not discounted)
      cumulativeCostOption2[t] = totalCostOption2;
      cashFlowsOption2[t] = totalCostOption2;
    } else {
      totalCostOption2 = netEnergyCostOption2 + maintenanceCostOption2[t] - energySavingsThroughDimming;
      const discountedCostOption2 = totalCostOption2 / Math.pow(1 + discountRate, t);
      npvOption2 += discountedCostOption2;
      cumulativeCostOption2[t] = cumulativeCostOption2[t - 1] + totalCostOption2;
      cashFlowsOption2[t] = totalCostOption2;
    }
  }

  // Update Results on the Page
  document.getElementById('npvOption1').innerText = `$${npvOption1.toFixed(0)}`;
  document.getElementById('npvOption2').innerText = `$${npvOption2.toFixed(0)}`;

  // Calculate Payback Period
  let paybackPeriod = null;
  for (let t = 0; t <= analysisPeriod; t++) {
    if (cumulativeCostOption2[t] <= cumulativeCostOption1[t]) {
      paybackPeriod = t;
      break;
    }
  }
  document.getElementById('paybackPeriod').innerText = paybackPeriod !== null
    ? `${paybackPeriod} years`
    : 'Beyond analysis period';

  // Update the chart
  updateChart(analysisPeriod, cumulativeCostOption1, cumulativeCostOption2);
}

// Function to update the chart
function updateChart(period, dataOption1, dataOption2) {
  const labels = [];
  for (let i = 0; i <= period; i++) {
    labels.push(i);
  }

  cashFlowChart.data.labels = labels;
  cashFlowChart.data.datasets[0].data = dataOption1;
  cashFlowChart.data.datasets[1].data = dataOption2;
  cashFlowChart.update();
}
