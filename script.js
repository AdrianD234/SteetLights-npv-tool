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

  let hpsUnitsRemaining = hpsUnits;
  let ledUnitsInstalled = 0;

  // Annual HPS luminaire replacements
  const annualHPSReplacements = Math.round(hpsUnits * hpsReplacementRate);

  // Calculate for each year
  for (let t = 0; t <= analysisPeriod; t++) {
    // Option 1 Calculations (Maintain HPS)
    let energyCostOption1 = 0;
    let lampReplacementCostOption1 = 0;
    let luminaireReplacementCostOption1 = 0;
    let totalCostOption1 = 0;

    // Energy consumption
    const totalConsumptionHPS = hpsUnitsRemaining * hpsConsumption;
    const totalConsumptionLED = ledUnitsInstalled * ledConsumption;
    const totalEnergyOption1 =
      ((totalConsumptionHPS + totalConsumptionLED) * operatingHours) / 1000; // Convert W to kW
    energyCostOption1 = totalEnergyOption1 * energyCost;

    // Lamp replacements every hpsLampLife years
    if (t > 0 && hpsLampLife > 0 && t % hpsLampLife === 0) {
      lampReplacementCostOption1 = hpsUnitsRemaining * hpsLampCost;
    }

    // Luminaire replacements (HPS to LED)
    if (t > 0 && annualHPSReplacements > 0 && hpsUnitsRemaining > 0) {
      const unitsToReplace = Math.min(annualHPSReplacements, hpsUnitsRemaining);
      luminaireReplacementCostOption1 =
        unitsToReplace * (ledLuminaireCost + ledInstallationCost);
      hpsUnitsRemaining -= unitsToReplace;
      ledUnitsInstalled += unitsToReplace;
    }

    totalCostOption1 =
      energyCostOption1 + lampReplacementCostOption1 + luminaireReplacementCostOption1;

    // Discount the cost
    const discountedCostOption1 = totalCostOption1 / Math.pow(1 + discountRate, t);
    npvOption1 += discountedCostOption1;

    // Cumulative cost
    if (t === 0) {
      cumulativeCostOption1.push(totalCostOption1);
    } else {
      cumulativeCostOption1.push(
        cumulativeCostOption1[t - 1] + totalCostOption1
      );
    }

    cashFlowsOption1.push(totalCostOption1);

    // Option 2 Calculations (Replace with LED)
    let totalCostOption2 = 0;

    if (t === 0) {
      // Initial investment
      totalCostOption2 = ledUnits * (ledLuminaireCost + ledInstallationCost);
    } else {
      // Energy consumption
      let totalEnergyOption2 = (ledUnits * ledConsumption * operatingHours) / 1000;
      if (includeDimming) {
        totalEnergyOption2 *= 1 - ledDimmingReduction;
      }
      let energyCostOption2 = totalEnergyOption2 * energyCost;

      // Maintenance cost (LED cleaning)
      let maintenanceCostOption2 = 0;
      if (ledCleaningFrequency > 0 && t % ledCleaningFrequency === 0) {
        maintenanceCostOption2 = ledUnits * ledCleaningCost;
      }

      // Lines company charge savings
      let linesSavings = ledUnits * linesChargeSavings;

      totalCostOption2 =
        energyCostOption2 + maintenanceCostOption2 - linesSavings;
    }

    // Discount the cost
    const discountedCostOption2 = totalCostOption2 / Math.pow(1 + discountRate, t);
    npvOption2 += discountedCostOption2;

    // Cumulative cost
    if (t === 0) {
      cumulativeCostOption2.push(totalCostOption2);
    } else {
      cumulativeCostOption2.push(
        cumulativeCostOption2[t - 1] + totalCostOption2
      );
    }

    cashFlowsOption2.push(totalCostOption2);
  }

  // Update Results on the Page
  document.getElementById('npvOption1').innerText = `$${npvOption1.toFixed(2)}`;
  document.getElementById('npvOption2').innerText = `$${npvOption2.toFixed(2)}`;

  // Calculate Payback Period
  let paybackPeriod = null;
  for (let t = 0; t <= analysisPeriod; t++) {
    if (cumulativeCostOption2[t] <= cumulativeCostOption1[t]) {
      paybackPeriod = t;
      break;
    }
  }
  document.getElementById('paybackPeriod').innerText = paybackPeriod
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
