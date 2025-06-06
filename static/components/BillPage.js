export default {
  props: ['billId'],
  data() {
    return {
      billType: 'retail',
      customerName: '',
      customerMobile: '',
      items: [
        { itemName: '', size: '', quantity: 1, rate: 0, suggestions: [], sizeSuggestions: [] }
      ]
    };
  },
  computed: {
    grandTotal() {
      return this.items.reduce((sum, item) => {
        const qty = parseFloat(item.quantity) || 0;
        const rate = parseFloat(item.rate) || 0;
        return sum + qty * rate;
      }, 0);
    }
  },
  methods: {
    addRow() {
      this.items.push({ itemName: '', size: '', quantity: 1, rate: 0, suggestions: [], sizeSuggestions: [] });
    },
    removeRow(idx) {
      if (this.items.length > 1) this.items.splice(idx, 1);
    },
    amount(item) {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      return qty * rate;
    },
    fetchItemSuggestions(idx, query) {
      if (!query) {
        this.$set(this.items[idx], 'suggestions', []);
        return;
      }
      fetch(`/api/items?name=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
          // Unique names only
          const names = [...new Set(data.map(item => item.name))];
          this.$set(this.items[idx], 'suggestions', names);
        })
        .catch(() => this.$set(this.items[idx], 'suggestions', []));
    },
    selectItemSuggestion(idx, suggestion) {
      this.items[idx].itemName = suggestion;
      this.$set(this.items[idx], 'suggestions', []);
      // Optionally, fetch size suggestions for this item name
      this.fetchSizeSuggestions(idx, suggestion, '');
    },
    fetchSizeSuggestions(idx, itemName, query) {
      if (!itemName) {
        this.$set(this.items[idx], 'sizeSuggestions', []);
        return;
      }
      let url = `/api/items?name=${encodeURIComponent(itemName)}`;
      if (query) url += `&size=${encodeURIComponent(query)}`;
      fetch(url)
        .then(res => res.json())
        .then(data => {
          // Unique sizes only
          const sizes = [...new Set(data.map(item => item.size))];
          this.$set(this.items[idx], 'sizeSuggestions', sizes);
        })
        .catch(() => this.$set(this.items[idx], 'sizeSuggestions', []));
    },
    selectSizeSuggestion(idx, suggestion) {
      this.items[idx].size = suggestion;
      this.$set(this.items[idx], 'sizeSuggestions', []);
    }
  },
  template: `
    <div class="container mt-3 mx-auto" >
      <div class="d-flex align-items-center mb-2">
        <h5 class="me-3 mb-0">Bill #{{ billId }}</h5>
        <span class="badge" :class="billType === 'wholesale' ? 'bg-primary' : 'bg-success'">
          {{ billType.charAt(0).toUpperCase() + billType.slice(1) }}
        </span>
      </div>
      <div class="row mb-3">
        <div class="col-md-4 mb-2">
          <label class="form-label">Customer Name</label>
          <input v-model="customerName" class="form-control" placeholder="Enter customer name" />
        </div>
        <div class="col-md-4 mb-2">
          <label class="form-label">Mobile Number</label>
          <input v-model="customerMobile" class="form-control" placeholder="Enter mobile number" />
        </div>
        <div class="col-md-4 mb-2 d-flex align-items-end">
          <select v-model="billType" class="form-select w-auto">
            <option value="retail">Retail</option>
            <option value="wholesale">Wholesale</option>
          </select>
        </div>
      </div>
      <table class="table table-bordered align-middle">
        <thead>
          <tr>
            <th style="width: 60px;">S. No.</th>
            <th>Item Name</th>
            <th>Size</th>
            <th style="width: 100px;">Quantity</th>
            <th style="width: 120px;">Rate</th>
            <th style="width: 120px;">Amount</th>
            <th style="width: 50px;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in items" :key="idx">
            <td>{{ idx + 1 }}</td>
            <td style="position:relative;">
              <input v-model="item.itemName"
                     class="form-control"
                     placeholder="Item Name"
                     @input="fetchItemSuggestions(idx, item.itemName)"
                     @focus="fetchItemSuggestions(idx, item.itemName)"
                     autocomplete="off"
              />
              <ul v-if="item.suggestions && item.suggestions.length"
                  class="list-group position-absolute w-100"
                  style="z-index:1050; max-height:150px; overflow:auto; bottom:100%; margin-bottom:2px;">
                <li v-for="suggestion in item.suggestions"
                    :key="suggestion"
                    class="list-group-item list-group-item-action"
                    @mousedown.prevent="selectItemSuggestion(idx, suggestion)">
                  {{ suggestion }}
                </li>
              </ul>
            </td>
            <td style="position:relative;">
              <input v-model="item.size"
                     class="form-control"
                     placeholder="Size"
                     @input="fetchSizeSuggestions(idx, item.itemName, item.size)"
                     @focus="fetchSizeSuggestions(idx, item.itemName, item.size)"
                     autocomplete="off"
              />
              <ul v-if="item.sizeSuggestions && item.sizeSuggestions.length"
                  class="list-group position-absolute w-100"
                  style="z-index:10; max-height:150px; overflow:auto; bottom:100%; margin-bottom:2px;">
                <li v-for="suggestion in item.sizeSuggestions"
                    :key="suggestion"
                    class="list-group-item list-group-item-action"
                    @mousedown.prevent="selectSizeSuggestion(idx, suggestion)">
                  {{ suggestion }}
                </li>
              </ul>
            </td>
            <td><input v-model.number="item.quantity" type="number" min="1" class="form-control" /></td>
            <td><input v-model.number="item.rate" type="number" min="0" class="form-control" /></td>
            <td>{{ amount(item).toFixed(2) }}</td>
            <td>
              <button class="btn btn-sm btn-danger" @click="removeRow(idx)" v-if="items.length > 1">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="5" class="text-end fw-bold">Grand Total</td>
            <td colspan="2" class="fw-bold">{{ grandTotal.toFixed(2) }}</td>
          </tr>
        </tfoot>
      </table>
      <button class="btn btn-primary" @click="addRow">
        <i class="bi bi-plus"></i> Add Item
      </button>
    </div>
  `
};