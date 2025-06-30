export default {
  data() {
    return {
      chart: null,
      salesData: [],
      profitData: [],
      labels: [],
      openHour: 8,
      closeHour: 20,
      period: 'today', // 'today', 'daily', 'monthly'
      billType: 'both', // 'both', 'retail', 'wholesale'
    };
  },
  mounted() {
    this.fetchSales();
    this.timer = setInterval(this.fetchSales, 60 * 1000);
  },
  beforeDestroy() {
    clearInterval(this.timer);
  },
  watch: {
    period() { this.fetchSales(); },
    billType() { this.fetchSales(); }
  },
  methods: {
    async fetchSales() {
      let url;
      let params = `type=${this.billType}`;
      if (this.period === 'today') {
        const today = new Date().toISOString().slice(0, 10);
        url = `/api/sales/hourly?date=${today}&${params}`;
        const res = await fetch(url);
        const data = await res.json();
        this.openHour = data.open_hour;
        this.closeHour = data.close_hour;
        const now = new Date();
        const currentHour = now.getHours();
        const endHour = Math.min(currentHour, this.closeHour);
        this.labels = [];
        this.salesData = [];
        this.profitData = [];
        for (let h = this.openHour; h <= endHour; h++) {
          this.labels.push(`${h}:00`);
          this.salesData.push(data.sales[h] || 0);
          this.profitData.push(data.profit[h] || 0);
        }
      } else if (this.period === 'daily') {
        url = `/api/sales/daily?days=7&${params}`;
        const res = await fetch(url);
        const data = await res.json();
        this.labels = data.labels;
        this.salesData = data.sales;
        this.profitData = data.profit;
      } else if (this.period === 'monthly') {
        url = `/api/sales/monthly?months=12&${params}`;
        const res = await fetch(url);
        const data = await res.json();
        this.labels = data.labels;
        this.salesData = data.sales;
        this.profitData = data.profit;
      }
      this.renderChart();
    },
    renderChart() {
      // Cost = sales - profit
      const costData = this.salesData.map((sale, i) => Math.max(0, sale - (this.profitData[i] || 0)));
      if (this.chart) {
        this.chart.data.labels = this.labels;
        this.chart.data.datasets[0].data = costData;
        this.chart.data.datasets[1].data = this.profitData;
        this.chart.update();
        return;
      }
      const ctx = this.$refs.canvas.getContext('2d');
      this.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.labels,
          datasets: [
            {
              label: 'Cost (Sale - Profit)',
              data: costData,
              backgroundColor: '#0d6efd'
            },
            {
              label: 'Profit',
              data: this.profitData,
              backgroundColor: '#198754'
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            tooltip: { mode: 'index', intersect: false }
          },
          scales: {
            x: {
              stacked: true,
              title: {
                display: true,
                text: this.period === 'today'
                  ? 'Time'
                  : this.period === 'daily'
                  ? 'Date'
                  : 'Month'
              }
            },
            y: {
              stacked: true,
              title: { display: true, text: 'Sales (₹)' },
              beginAtZero: true
            }
          }
        }
      });
    }
  },
  template: `
    <div class="my-4">
      <div class="d-flex align-items-center mb-2">
        <h4 class="me-3 mb-0">Sales Chart</h4>
        <select v-model="period" class="form-select w-auto me-2">
          <option value="today">Today (Hourly)</option>
          <option value="daily">Last 7 Days</option>
          <option value="monthly">Last 12 Months</option>
        </select>
        <select v-model="billType" class="form-select w-auto">
          <option value="both">All Bills</option>
          <option value="retail">Retail Only</option>
          <option value="wholesale">Wholesale Only</option>
        </select>
      </div>
      <canvas ref="canvas" height="100"></canvas>
    </div>
  `
};