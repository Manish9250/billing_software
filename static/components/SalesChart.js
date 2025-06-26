export default {
  data() {
    return {
      chart: null,
      salesData: [],
      labels: [],
      openHour: 8,
      closeHour: 20,
      period: 'today', // 'today', 'daily', 'monthly'
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
    period() {
      this.fetchSales();
    }
  },
  methods: {
    async fetchSales() {
      let url;
      if (this.period === 'today') {
        const today = new Date().toISOString().slice(0, 10);
        url = `/api/sales/hourly?date=${today}`;
        const res = await fetch(url);
        const data = await res.json();
        this.openHour = data.open_hour;
        this.closeHour = data.close_hour;
        const now = new Date();
        const currentHour = now.getHours();
        const endHour = Math.min(currentHour, this.closeHour);
        this.labels = [];
        this.salesData = [];
        for (let h = this.openHour; h <= endHour; h++) {
          this.labels.push(`${h}:00`);
          this.salesData.push(data.sales[h] || 0);
        }
      } else if (this.period === 'daily') {
        url = `/api/sales/daily?days=7`;
        const res = await fetch(url);
        const data = await res.json();
        this.labels = data.labels;
        this.salesData = data.sales;
      } else if (this.period === 'monthly') {
        url = `/api/sales/monthly?months=12`;
        const res = await fetch(url);
        const data = await res.json();
        this.labels = data.labels;
        this.salesData = data.sales;
      }
      this.renderChart();
    },
    renderChart() {
      if (this.chart) {
        this.chart.data.labels = this.labels;
        this.chart.data.datasets[0].data = this.salesData;
        this.chart.data.datasets[0].label =
          this.period === 'today'
            ? 'Sales per Hour'
            : this.period === 'daily'
            ? 'Sales per Day'
            : 'Sales per Month';
        this.chart.update();
        return;
      }
      const ctx = this.$refs.canvas.getContext('2d');
      this.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.labels,
          datasets: [{
            label:
              this.period === 'today'
                ? 'Sales per Hour'
                : this.period === 'daily'
                ? 'Sales per Day'
                : 'Sales per Month',
            data: this.salesData,
            backgroundColor: '#0d6efd'
          }]
        },
        options: {
          responsive: true,
          scales: {
            x: { title: { display: true, text: this.period === 'today' ? 'Time' : this.period === 'daily' ? 'Date' : 'Month' } },
            y: { title: { display: true, text: 'Sales (₹)' }, beginAtZero: true }
          }
        }
      });
    }
  },
  template: `
    <div class="my-4">
      <div class="d-flex align-items-center mb-2">
        <h4 class="me-3 mb-0">Sales Chart</h4>
        <select v-model="period" class="form-select w-auto">
          <option value="today">Today (Hourly)</option>
          <option value="daily">Last 7 Days</option>
          <option value="monthly">Last 12 Months</option>
        </select>
      </div>
      <canvas ref="canvas" height="100"></canvas>
    </div>
  `
};