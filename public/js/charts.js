/**
 * Charts Manager using Chart.js
 * Reproduces the 4 charts from the reference screenshot with responsive styling and data binding.
 */

class DashboardCharts {
  constructor() {
    this.efficiencyChart = null;
    this.donutChart = null;
    this.fuelChart = null;
    this.distanceChart = null;
  }

  /**
   * Initialize all 4 charts
   */
  initCharts() {
    this.initEfficiencyChart();
    this.initDonutChart();
    this.initFuelChart();
    this.initDistanceChart();
  }

  /**
   * Chart 1: Weekly bin cleaning efficiency (Stacked Bar Chart)
   */
  initEfficiencyChart() {
    const ctx = document.getElementById('efficiencyChart')?.getContext('2d');
    if (!ctx) return;

    const labels = ['27/08/2021', '29/08/2021', '31/08/2021', '01/09/2021', '02/09/2021', '03/09/2021', '04/09/2021'];

    this.efficiencyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Not Cleaned',
            data: [42, 50, 8, 12, 48, 18, 45],
            backgroundColor: '#4a5568', // Dark Slate
            stack: 'Stack 0',
            barPercentage: 0.45,
          },
          {
            label: 'Cleaned late',
            data: [45, 28, 20, 10, 42, 14, 40],
            backgroundColor: '#48bb78', // Mint green
            stack: 'Stack 0',
            barPercentage: 0.45,
          },
          {
            label: 'Cleaned on time',
            data: [85, 45, 45, 12, 110, 16, 75],
            backgroundColor: '#4299e1', // Bright blue
            stack: 'Stack 0',
            barPercentage: 0.45,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false, // Clean look matching image
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(26, 32, 44, 0.9)',
            padding: 10,
            cornerRadius: 6,
          },
        },
        scales: {
          x: {
            stacked: true,
            grid: {
              display: false,
            },
            ticks: {
              color: '#718096',
              font: { size: 11 },
            },
          },
          y: {
            stacked: true,
            min: 0,
            max: 200,
            ticks: {
              stepSize: 50,
              color: '#718096',
              font: { size: 11 },
            },
            grid: {
              color: '#edf2f7',
              drawBorder: false,
            },
          },
        },
      },
    });
  }

  /**
   * Chart 2: Weekly total distance travelled / Trip Breakdown (Donut Chart)
   * 63% Cleaned on time, 21% Cleaned late, 7% Not Cleaned, 9% Other
   */
  initDonutChart() {
    const ctx = document.getElementById('donutChart')?.getContext('2d');
    if (!ctx) return;

    this.donutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Cleaned on time', 'Cleaned late', 'Not Cleaned'],
        datasets: [
          {
            data: [63, 21, 16],
            backgroundColor: ['#4299e1', '#48bb78', '#4a5568'],
            borderWidth: 2,
            borderColor: '#ffffff',
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            display: false, // Custom HTML legend on the right side
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return ` ${context.label}: ${context.raw}%`;
              },
            },
          },
        },
      },
    });
  }

  /**
   * Chart 3: Weekly fuel consumption (Spline Line Chart)
   */
  initFuelChart() {
    const ctx = document.getElementById('fuelChart')?.getContext('2d');
    if (!ctx) return;

    const labels = ['27/08/2021', '29/08/2021', '31/08/2021', '01/09/2021', '02/09/2021', '03/09/2021', '04/09/2021'];

    this.fuelChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Fuel Consumption (in liters)',
            data: [8.5, 10.2, 13.0, 7.5, 20.0, 9.2, 23.5],
            borderColor: '#4299e1',
            backgroundColor: 'rgba(66, 153, 225, 0.08)',
            fill: false,
            tension: 0.45, // Smooth spline curve matching image
            pointBackgroundColor: '#4299e1',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(26, 32, 44, 0.9)',
            callbacks: {
              label: function (context) {
                return ` Fuel: ${context.parsed.y} Liters`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#718096',
              font: { size: 11 },
            },
          },
          y: {
            min: 5,
            max: 25,
            ticks: {
              callback: function (val) {
                if ([7.5, 10, 12.5, 20].includes(val)) return val;
                return '';
              },
              color: '#718096',
              font: { size: 11 },
            },
            title: {
              display: true,
              text: 'Fuel Consumption (in liters)',
              color: '#a0aec0',
              font: { size: 10 },
            },
            grid: {
              color: '#edf2f7',
              drawBorder: false,
            },
          },
        },
      },
    });
  }

  /**
   * Chart 4: Weekly total distance travelled (Bar Chart)
   */
  initDistanceChart() {
    const ctx = document.getElementById('distanceChart')?.getContext('2d');
    if (!ctx) return;

    const labels = ['27/08/2021', '29/08/2021', '31/08/2021', '01/09/2021', '02/09/2021', '03/09/2021', '04/09/2021'];

    this.distanceChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Distance travelled (in km)',
            data: [192.87, 115.4, 92.0, 76.5, 138.2, 195.0, 208.5],
            backgroundColor: '#4299e1',
            borderRadius: 2,
            barPercentage: 0.45,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: true,
            backgroundColor: '#ffffff',
            titleColor: '#718096',
            bodyColor: '#2b6cb0',
            borderColor: '#e2e8f0',
            borderWidth: 1,
            padding: 10,
            displayColors: true,
            boxWidth: 8,
            boxHeight: 8,
            cornerRadius: 8,
            callbacks: {
              label: function (context) {
                return ` Distance travelled (in km) ${context.parsed.y}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#718096',
              font: { size: 11 },
            },
          },
          y: {
            min: 0,
            max: 200,
            ticks: {
              stepSize: 50,
              color: '#718096',
              font: { size: 11 },
            },
            title: {
              display: true,
              text: 'Distance travelled (in KM)',
              color: '#a0aec0',
              font: { size: 10 },
            },
            grid: {
              color: '#edf2f7',
              drawBorder: false,
            },
          },
        },
      },
    });
  }

  /**
   * Dynamically update chart values when a specific vehicle is selected
   */
  updateForVehicle(unit) {
    if (!unit) {
      // Reset to fleet defaults
      this.resetToFleet();
      return;
    }

    const factor = (unit.todayDistanceKm || 50) / 60;

    // 1. Update distance chart
    if (this.distanceChart) {
      const baseDist = [192.87, 115.4, 92.0, 76.5, 138.2, 195.0, 208.5];
      this.distanceChart.data.datasets[0].data = baseDist.map(val => +(val * factor).toFixed(2));
      this.distanceChart.update();
    }

    // 2. Update fuel chart
    if (this.fuelChart) {
      const baseFuel = [8.5, 10.2, 13.0, 7.5, 20.0, 9.2, 23.5];
      const fuelFactor = (unit.todayFuelLiters || 8) / 10;
      this.fuelChart.data.datasets[0].data = baseFuel.map(val => +(val * fuelFactor).toFixed(1));
      this.fuelChart.update();
    }

    // 3. Update task efficiency chart
    if (this.efficiencyChart) {
      const mult = Math.max(0.4, factor);
      this.efficiencyChart.data.datasets[0].data = [42, 50, 8, 12, 48, 18, 45].map(v => Math.round(v * mult));
      this.efficiencyChart.data.datasets[1].data = [45, 28, 20, 10, 42, 14, 40].map(v => Math.round(v * mult));
      this.efficiencyChart.data.datasets[2].data = [85, 45, 45, 12, 110, 16, 75].map(v => Math.round(v * mult));
      this.efficiencyChart.update();
    }

    // 4. Update donut chart based on vehicle efficiency
    if (this.donutChart) {
      const onTime = Math.min(85, Math.max(50, Math.round(63 + (unit.fuelLevel % 15) - 7)));
      const late = Math.round((100 - onTime) * 0.7);
      const notCleaned = 100 - onTime - late;
      this.donutChart.data.datasets[0].data = [onTime, late, notCleaned];
      this.donutChart.update();
    }
  }

  /**
   * Reset charts to overall fleet data from reference screenshot
   */
  resetToFleet() {
    if (this.distanceChart) {
      this.distanceChart.data.datasets[0].data = [192.87, 115.4, 92.0, 76.5, 138.2, 195.0, 208.5];
      this.distanceChart.update();
    }
    if (this.fuelChart) {
      this.fuelChart.data.datasets[0].data = [8.5, 10.2, 13.0, 7.5, 20.0, 9.2, 23.5];
      this.fuelChart.update();
    }
    if (this.efficiencyChart) {
      this.efficiencyChart.data.datasets[0].data = [42, 50, 8, 12, 48, 18, 45];
      this.efficiencyChart.data.datasets[1].data = [45, 28, 20, 10, 42, 14, 40];
      this.efficiencyChart.data.datasets[2].data = [85, 45, 45, 12, 110, 16, 75];
      this.efficiencyChart.update();
    }
    if (this.donutChart) {
      this.donutChart.data.datasets[0].data = [63, 21, 16];
      this.donutChart.update();
    }
  }
}

// Global instance
window.dashboardCharts = new DashboardCharts();
