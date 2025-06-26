export default {
  props: ['billId'],
  data() {
    return {
      billType: 'retail',
      customerId: null,
      customerName: '',
      customerMobile: '',
      customerUnpaid: 0,
      editingUnpaid: false,
      items: [],
      customerSuggestions: [],  
      showCustomerSuggestions: false,
      showProfit: false,
      unpaidList: [],
      errorMessage: '',
      showUnpaidList: false
    };
  },
  computed: {
    grandTotal() {
      return this.items.reduce((sum, item) => {
        const qty = parseFloat(item.quantity) || 0;
        const rate = parseFloat(item.rate) || 0;
        return sum + qty * rate;
      }, 0);
    },
    grandProfit() {
    return this.items.reduce((sum, item) => {
      if (item.details && item.details.buy_price !== undefined) {
        return sum + ((item.rate - item.details.buy_price) * item.quantity);
      }
      return sum;
    }, 0);
  }
  },
  methods: {
    addRow() {
      this.items.push({ itemId: null, itemName: '', size: '', quantity: 1, rate: 0, suggestions: [], sizeSuggestions: [] });
      this.$nextTick(() => {
        const container = this.$refs.tableContainer;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });

    },
    removeRow(idx) {
      const item = this.items[idx];
      // If the item has been saved to the backend, delete it there too
      if (item.billxitem_id) {
        fetch(`/api/billxitems/${item.billxitem_id}`, {
          method: 'DELETE'
        })
        .then(res => {
          if (!res.ok) throw new Error('Failed to delete item from bill');
          // Optionally show a success message
          this.$root.notify('Item deleted successfully!', 'success');
        })
        .catch(err => {
          this.errorMessage = 'Could not delete item: ' + err.message;
          this.$root.notify(this.errorMessage, 'error');
        });
      }
      // Remove from UI
      if (this.items.length > 1) this.items.splice(idx, 1);
    },
    amount(item) {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      return qty * rate;
    },
    async createNewItem(idx) {
      const item = this.items[idx];
      if (!item.itemName || !item.size) return;
      if (item.itemId) return;

      // Use the entered rate for the correct price field
      const payload = {
        name: item.itemName,
        size: item.size,
        category: '', // or any default
        buy_price: 0,
        quantity: 0,
        wholesale_price: this.billType === 'wholesale' ? (item.rate || 0) : 0,
        retail_price: this.billType === 'retail' ? (item.rate || 0) : 0,
        alert_quantity: 0,
        expiry_duration: 0
      };

      try {
        const res = await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && data.id) {
          this.$set(this.items, idx, {
            ...item,
            itemId: data.id,
            details: data
          });
          this.$root.notify('Item created successfully!', 'success');
        } else {
          this.errorMessage = data.message || 'Failed to create item';
          this.$root.notify(this.errorMessage, 'error');
        }
      } catch (err) {
        this.errorMessage = 'Failed to create item: ' + err.message;
        this.$root.notify(this.errorMessage, 'error');
      }
    },
    async finalizeBill(print = false) {
      try {
        // 1. Save or update all items in the bill
        for (let idx = 0; idx < this.items.length; idx++) {
          const item = this.items[idx];
          // Only save if itemId and quantity > 0
          if (item.itemId && item.quantity > 0) {
            const payload = {
              bill_id: parseInt(this.billId),
              item_id: item.itemId,
              quantity: parseFloat(item.quantity) || 0,
              price: parseFloat(item.rate) || 0
            };
            let url, method;
            if (item.billxitem_id) {
              url = `/api/billxitems/${item.billxitem_id}`;
              method = 'PUT';
            } else {
              url = '/api/billxitems';
              method = 'POST';
            }
            const res = await fetch(url, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            const data = await res.json();

            // Handle duplicate error from backend
            if (res.status === 409 && data.message && data.message.includes('Duplicate')) {
              this.$root.notify(
                `Duplicate item "${item.itemName} (${item.size})" removed from bill.`,
                'warning'
              );
              //this.items.splice(idx, 1);
              //idx--; // Adjust index after removal
              //continue; // Skip to next item
            }

            if (!res.ok) {
              this.errorMessage = data.message || 'Failed to save item';
              this.$root.notify(this.errorMessage, 'error');
              throw new Error(data.message || 'Failed to save item');

            }
            // Store the returned billxitem_id if new
            if (data.id) {
              this.$set(this.items, idx, { ...item, billxitem_id: data.id });
              this.$root.notify('Item created successfully!', 'success');
            }
          }
        }

        // 2. Finalize the bill
        const res = await fetch(`/api/bills/${this.billId}/finalize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_id: this.customerId
          })
        });
        const data = await res.json();
        if (!res.ok) {
          this.errorMessage = data.message || 'Failed to save bill';
          this.$root.notify(this.errorMessage, 'error');
          throw new Error(this.errorMessage);
        }
        if (print) {
          // Print logic
          const printRes = await fetch(`/api/bills/${this.billId}/print`, { method: 'POST' });
          const printData = await printRes.json();
          if (!printRes.ok) {
            this.errorMessage = printData.message || 'Failed to print bill';
            throw new Error(this.errorMessage);
          }
          this.$root.notify('Bill saved and sent to printer!', 'success');
        } else {
          this.$root.notify('Bill saved successfully!', 'success');
        }
      } catch (err) {
        this.errorMessage = err.message;
        this.$root.notify(this.errorMessage, 'error');
      }
    },
    onCustomerInput() {
    this.customerId = null;
    this.fetchCustomerSuggestions(this.customerName);
  },
    startEditUnpaid() {
      this.editingUnpaid = true;
      this.$nextTick(() => {
        const el = this.$el.querySelector('#unpaidInput');
        if (el) el.focus();
      });
    },
    saveCustomerInfo() {
      this.editingUnpaid = false;
      if (!this.customerName) return;

      // If customerId exists, update customer
      if (this.customerId) {
        fetch(`/api/customers/${this.customerId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: this.customerMobile,
            name: this.customerName,
            type: this.billType === 'wholesale' ? 0 : 1 
          })
        })
        .then(res => {

          if (!res.ok) {
            this.errorMessage = 'Failed to update customer';
            this.$root.notify(this.errorMessage, 'error');
            throw new Error(this.errorMessage);
          }
          this.$root.notify('Customer updated successfully!', 'success');
          return res.json();

        })
        .catch(err => {
          this.errorMessage = 'Could not update customer: ' + err.message;
          this.$root.notify(this.errorMessage, 'error');
        });
      } else {
        // Customer does not exist, create new
        fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: this.customerMobile,
            name: this.customerName,
            type: this.billType === 'wholesale' ? 0 : 1,
            unpaid_money: this.customerUnpaid || 0
          })
        })
        .then(res => {
          if (!res.ok) {
            this.errorMessage = 'Failed to create customer';
            this.$root.notify(this.errorMessage, 'error');
            throw new Error(this.errorMessage);
          }

          return res.json();
        })
        .then(data => {
          this.customerId = data.id;
          this.$root.notify('Customer created successfully!', 'success');
          this.$root.notify('Customer ID: ' + this.customerId, 'success');
          // Optionally fetch unpaid info, etc.
        })
        .catch(err => {
          this.errorMessage = 'Could not create customer: ' + err.message;
          this.$root.notify(this.errorMessage, 'error');
        });
      }
    },
    onAmountEnter(idx) {
      const item = this.items[idx];

      
      const duplicateIdx = this.items.findIndex(
      (it, i) =>
        i !== idx && // <-- excludes the current row
        it.itemId === item.itemId &&
        it.size === item.size
    );
    if (duplicateIdx !== -1) {
      this.$root.notify('This item and size is already in the bill.', 'error');
      return;
    }
      
      if (!item.itemId){
        this.createNewItem(idx);
        return;
      };
      const payload = {
        bill_id: parseInt(this.billId),
        item_id: item.itemId || null,
        quantity: parseFloat(item.quantity) || 0,
        price: parseFloat(item.rate) || 0
      };

      // 1. Detect if custom price is needed
      let defaultPrice = null;
      if (item.details) {
        defaultPrice = this.billType === 'wholesale'
          ? item.details.wholesale_price
          : item.details.retail_price;
      }
      const isCustomPrice = (
        item.itemId &&
        this.customerId &&
        defaultPrice !== null &&
        parseFloat(item.rate) !== parseFloat(defaultPrice)
      );

      // 2. Create or update billxitem
      const billxitemUrl = item.billxitem_id
        ? `/api/billxitems/${item.billxitem_id}`
        : '/api/billxitems';
      const billxitemMethod = item.billxitem_id ? 'PUT' : 'POST';

      fetch(billxitemUrl, {
        method: billxitemMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(res => {
          if (!res.ok) {
            this.errorMessage = 'Failed to save item';
            this.$root.notify(this.errorMessage, 'error');
            throw new Error(this.errorMessage);
          }
          return res.json();
        })
        .then(data => {
          // Store the returned billxitem_id in the item
          if (data.id) {
            this.$set(this.items, idx, { ...item, billxitem_id: data.id });
          }
          const updatedItem = this.items[idx];
          this.$root.notify(
            `Item ${updatedItem.itemName} ${updatedItem.size} ${data.id ? 'saved' : 'modified'} successfully!`,
            'success'
          );
          // 3. If custom price, save it to backend
          if (isCustomPrice) {
            if (item.custom_price_id) {
              // Update existing custom price
              fetch(`/api/custom_prices/${item.custom_price_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  price: parseFloat(item.rate)
                })
              })
                .then(res => {
                  if (!res.ok) {
                    this.errorMessage = 'Failed to update custom price';
                    this.$root.notify(this.errorMessage, 'error');
                    throw new Error(this.errorMessage);
                  }
                  this.$root.notify('Custom price updated successfully!', 'success');
                  return res.json();
                })
                .then(data => {
                  if (data.id) {
                    this.$set(this.items, idx, { ...item, custom_price_id: data.id });
                  }
                })
                .catch(err => {
                  this.errorMessage = 'Could not update custom price: ' + err.message;
                  this.$root.notify(this.errorMessage, 'error');
                });
            } else {
              // Create new custom price
              fetch('/api/custom_prices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  customer_id: this.customerId,
                  item_id: item.itemId,
                  price: parseFloat(item.rate)
                })
              })
                .then(res => {
                  if (!res.ok) {
                    this.errorMessage = 'Failed to save custom price';
                    this.$root.notify(this.errorMessage, 'error');
                    throw new Error(this.errorMessage);
                  }
                  
                  return res.json();
                })
                .then(data => {
                  if (data.id) {
                    this.$set(this.items, idx, { ...item, custom_price_id: data.id });
                    this.$root.notify('Custom price saved successfully!', 'success');
                  }
                })
                .catch(err => {
                  this.errorMessage = 'Could not save custom price: ' + err.message;
                  this.$root.notify(this.errorMessage, 'error');
                });
            }
          }

          this.addRow();
          this.$nextTick(() => {
            const newIdx = this.items.length - 1;
            const el = this.$el.querySelector(`input[placeholder="Item Name"]:nth-of-type(${newIdx + 1})`);
            if (el) el.focus();
          });
        })
        .catch(err => {
          this.errorMessage = 'Could not save item: ' + err.message;
        });
    },
    async fetchAndApplyCustomPrice(idx) {
      const item = this.items[idx];
      if (!this.customerId || !item.itemId) return;

      try {
        const res = await fetch(`/api/custom_prices/${this.customerId}/${item.itemId}`);
        if (res.ok) {
          const data = await res.json();
          // Update rate and store custom_price_id
          this.$set(this.items, idx, {
            ...item,
            rate: data.price,
            custom_price_id: data.id
          });
          this.$root.notify('Custom price applied successfully!', 'success');
        } else {
          // No custom price, clear custom_price_id and use default rate
          this.$set(this.items, idx, {
            ...item,
            custom_price_id: null,
            rate: this.billType === 'wholesale'
              ? item.details?.wholesale_price
              : item.details?.retail_price
          });
        }
      } catch (e) {
        // On error, fallback to default rate
        this.$set(this.items, idx, {
          ...item,
          custom_price_id: null,
          rate: this.billType === 'wholesale'
            ? item.details?.wholesale_price
            : item.details?.retail_price
        });
        this.$root.notify('Could not fetch custom price, using default rate.', 'warning');
      }
    },
    fetchBillData() {
      // Fetch bill data from backend
      fetch(`/api/bills/${this.billId}`)
        .then(res => res.json())
        .then(bill => {
          // Set customer details
          this.customerId = bill.customer_id || null;
          this.customerName = bill.customer_name || '';
          this.customerMobile = bill.customer_phone || '';
          this.customerUnpaid = bill.unpaid_money || 0;
          // Set bill type if available (fallback to 'retail')
          this.billType = bill.customer_type === 0 ? 'wholesale' : 'retail';
          // Set items
          this.items = (bill.items || []).map(item => ({
            billxitem_id: item.id,
            itemId: item.item_id,
            itemName: item.item_name,
            size: item.item_size,
            quantity: item.quantity,
            rate: item.price,
            details: item || {}, //All info for tooltips
            suggestions: [],
            sizeSuggestions: [],
            matchedItems: []
          }));

          // If no items, add a blank row
          if (this.items.length === 0) {
            this.addRow();
            this.addRow();
            this.addRow();
            this.addRow();
            this.addRow();
          }
        })
        .catch(() => {
          // On error, keep default blank bill
          this.items = [];
          this.addRow();
          this.addRow();
          this.addRow();
          this.addRow();
          this.addRow();
        });
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
      this.$set(this.items[idx], 'matchedItems', []);
      return;
    }
    let url = `/api/items/exact?name=${encodeURIComponent(itemName)}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        // Unique sizes only for the exact name
        let sizes = [...new Set(data.map(item => item.size))];
        if (query) {
          sizes = sizes.filter(size => size.toLowerCase().includes(query.toLowerCase()));
        }
        this.$set(this.items[idx], 'sizeSuggestions', sizes);
        this.$set(this.items[idx], 'matchedItems', data);
      })
      .catch(() => {
        this.$set(this.items[idx], 'sizeSuggestions', []);
        this.$set(this.items[idx], 'matchedItems', []);
      });
  },
    selectSizeSuggestion(idx, suggestion) {
      this.items[idx].size = suggestion;
      this.$set(this.items[idx], 'sizeSuggestions', []);
      // Find the matching item object
      const matchedItems = this.items[idx].matchedItems || [];
      const matched = matchedItems.find(item => item.size === suggestion);
      if (matched) {
        this.items[idx].rate = this.billType === 'wholesale'
          ? matched.wholesale_price
          : matched.retail_price;
          this.items[idx].itemId = matched.id;
          this.$set(this.items[idx], 'details', matched); // Store full details for tooltips
          // Fetch and apply custom price if available
          this.fetchAndApplyCustomPrice(idx);     
        }
        else {
          // No match found, create new item
          this.createNewItem(idx);

        }
    },
    selectFirstItemSuggestion(idx) {
        const suggestions = this.items[idx].suggestions;
        if (suggestions && suggestions.length) {
        this.selectItemSuggestion(idx, suggestions[0]);
        }
    },
    selectFirstSizeSuggestion(idx) {
        const suggestions = this.items[idx].sizeSuggestions;
        if (suggestions && suggestions.length) {
        this.selectSizeSuggestion(idx, suggestions[0]);
        }
    },
    fetchCustomerSuggestions(query) {
    if (!query) {
      this.customerSuggestions = [];
      this.showCustomerSuggestions = false;
      return;
    }
    fetch(`/api/customers?name=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => {
        this.customerSuggestions = data;
        this.showCustomerSuggestions = true;

      })
      .catch(() => {
        this.customerSuggestions = [];
        this.showCustomerSuggestions = false;
      });
  },
  selectCustomerSuggestion(suggestion) {
    this.customerId = suggestion.id;
    this.customerName = suggestion.name;
    this.customerMobile = suggestion.phone || '';
    this.customerUnpaid = suggestion.unpaid_money || 0;
    this.billType = suggestion.type === 0 ? 'wholesale' : 'retail';
    this.showCustomerSuggestions = false;
    // Fetch and apply custom price if available
    this.items.forEach((item, idx) => {
      this.fetchAndApplyCustomPrice(idx);
    });
    
  },
  hideCustomerSuggestions() {
    setTimeout(() => { this.showCustomerSuggestions = false; }, 200);
  },
  async saveUnpaid() {
    let value = String(this.customerUnpaid).trim();
    let payload = { customer_id: this.customerId };
    if (value.startsWith('+')) {
      payload.add = parseFloat(value.slice(1));
    } else if (value.startsWith('-')) {
      payload.sub = Math.abs(parseFloat(value));
    } else {
      // fallback: treat as add
      payload.add = parseFloat(value);
    }
    // POST request
    await fetch('/api/unpaid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => {
      if (!res.ok) {
        this.errorMessage = 'Failed to save unpaid amount';
        this.$root.notify(this.errorMessage, 'error');
      } else {
        this.$root.notify('Unpaid amount saved successfully!', 'success');
      }
      // Optionally refresh unpaid list and value
      this.fetchUnpaidList();
      this.fetchCustomerUnpaid();
      this.editingUnpaid = false;
    });

  },

  async fetchUnpaidList() {
    if (!this.customerId) return;
    const res = await fetch(`/api/unpaid?customer_id=${this.customerId}`);
    this.unpaidList = await res.json();
    if (this.unpaidList.length === 0) {
      this.$root.notify('No unpaid transactions found for this customer.', 'info');
    }
    else {
      this.$root.notify('Unpaid transactions loaded successfully!', 'success');
    }
  },

  async fetchCustomerUnpaid() {
    // Optionally, get the total from your API
    const res = await fetch(`/api/unpaid/customer/${this.customerId}/total`);
    const data = await res.json();
    this.customerUnpaid = data.unpaid_money;
    if (data.unpaid_money !== undefined) {
      this.$root.notify('Customer unpaid amount updated successfully!', 'success');
    } else {
      this.$root.notify('Could not fetch customer unpaid amount.', 'error');
    }
  },
  },
  watch: {
    billType() {
      // Update rates for all items when bill type changes
      this.items.forEach((item, idx) => {
        const matchedItems = item.matchedItems || [];
        const matched = matchedItems.find(i => i.size === item.size);
        if (matched) {
          item.rate = this.billType === 'wholesale'
            ? matched.wholesale_price
            : matched.retail_price;
        }
      });

    },
    billId: {
    immediate: true,
    handler() {
      // Reset all bill fields
      this.billType = 'retail';
      this.customerName = '';
      this.customerMobile = '';
      this.customerUnpaid = 0;
      this.items = [];
      // Fetch new bill data
      this.fetchBillData();
    }
  }
  },
  template: `
    <div class="container mt-3 mx-auto" >
      
      <div class="row mb-3">
      <div class="d-flex col-md-2 align-items-center">
        <h5 class="me-3 mb-0">Bill #{{ billId }}</h5>
        <span class="badge" :class="billType === 'wholesale' ? 'bg-primary' : 'bg-success'">
          {{ billType.charAt(0).toUpperCase() + billType.slice(1) }}
        </span>
      </div>
        <div class="col-md-3">
          <label class="form-label">Customer Name</label>
          <div class="d-flex align-items-center">
            <div class="d-flex align-items-center position-relative">
              <input v-model="customerName"
                    class="form-control"
                    placeholder="Enter customer name"
                    @input="onCustomerInput"
                    @focus="fetchCustomerSuggestions(customerName)"
                    @blur="hideCustomerSuggestions"
                    @keydown.enter="saveCustomerInfo"
                    autocomplete="off"
              />
              <span v-if="customerUnpaid !== null"
                    @mouseenter="showUnpaidList = true; fetchUnpaidList()"
                    @mouseleave="showUnpaidList = false"
                    @click.stop="startEditUnpaid"
                    class="badge bg-warning text-dark ms-2 position-relative"
                    style="cursor:pointer;">
                <template v-if="!editingUnpaid">
                  Unpaid: ₹{{ customerUnpaid }}
                </template>
                <template v-else>
                  <input id="unpaidInput"
                        type="text"
                        class="form-control form-control-sm d-inline-block"
                        style="width:80px;"
                        v-model="customerUnpaid"
                        @keydown.enter="saveUnpaid"
                        @blur="editingUnpaid = false"
                  />
                </template>
                <!-- Mini list on hover -->
                <div v-if="showUnpaidList" class="position-absolute border bg-dark rounded shadow p-2" style="top:110%; left:0; min-width:200px; z-index:3000; max-height:200px; overflow:auto;">
                  <div v-if="unpaidList.length === 0" class="text-muted small">No transactions</div>
                  <ul v-else class="list-unstyled mb-0 small">
                    <li v-for="u in unpaidList" :key="u.id">
                      <span :style="{color: u.add ? '#198754' : '#dc3545'}">
                        {{ u.add ? '+' + u.add : '-' + u.sub }}
                      </span>
                      <span class="text-muted ms-2">{{ new Date(u.date).toLocaleString() }}</span>
                    </li>
                  </ul>
                </div>
              </span>
              <ul v-if="showCustomerSuggestions && customerSuggestions.length"
                  class="list-group position-absolute w-100"
                  style="z-index:2000; top:100%; left:0;">
                <li v-for="suggestion in customerSuggestions"
                    :key="suggestion.id"
                    class="list-group-item list-group-item-action"
                    @mousedown.prevent="selectCustomerSuggestion(suggestion)">
                  {{ suggestion.name }} <span v-if="suggestion.phone">({{ suggestion.phone }})</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div class="col-md-3 ">
          <label class="form-label">Mobile Number</label>
          <input v-model="customerMobile" class="form-control" placeholder="Enter mobile number" @keydown.enter="saveCustomerInfo"/>
        </div>
        <div class="col-md-2 d-flex align-items-end">
          <select v-model="billType" class="form-select w-auto">
            <option value="retail">Retail</option>
            <option value="wholesale">Wholesale</option>
          </select>
          
        </div>
        <button class="btn btn-lg col-md-2 btn-primary d-flex align-items-center gap-2 shadow-sm ms-auto"  @click="addRow" style="width: 150px;">
          <i class="bi bi-plus-circle" style="font-size:1.5rem;"></i>
          Add Item
        </button>
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
            <th style="width: 50px;" >
            <div class="form-check form-switch d-flex justify-content-center align-items-center mx-auto">
              <input class="form-check-input" type="checkbox" id="profitSwitch" v-model="showProfit">
            </div></th>
            <th v-if="showProfit" style="min-width:60px;">Gain</th> <!-- Gain column -->
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
                     @keydown.enter.prevent="selectFirstItemSuggestion(idx)"
                     autocomplete="off"
                     :title="item.details ? 'ID: ' + item.details.id + ', In Stock: ' + item.details.quantity + ', Buy Price: ' + item.details.buy_price : ''"
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
                     @keydown.enter.prevent="selectFirstSizeSuggestion(idx)"
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
            <td>
            <input type="number"
                  class="form-control"
                  min="0"
                  :value="amount(item)"
                  @input="onAmountInput(idx, $event.target.value)"
                  @keydown.enter.prevent="onAmountEnter(idx)" />
          </td>
            <td class="text-center align-middle" style="vertical-align: middle;">
  <button class="btn btn-sm btn-danger d-flex justify-content-center align-items-center mx-auto" @click="removeRow(idx)" v-if="items.length > 1" style="width:32px; height:32px;">
    <i class="bi bi-trash"></i>
  </button>
</td>
            <td v-if="showProfit" style="color:#198754; font-weight:bold; text-align:right;">
        <span v-if="item.details && item.details.buy_price !== undefined">
          +₹{{ ((item.rate - item.details.buy_price) * item.quantity).toFixed(2) }}
        </span>
      </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="5" class="text-end fw-bold">
            <button class="btn btn-success me-2" @click="finalizeBill(false)">
              Save Bill
            </button>
            <button class="btn btn-primary me-2" @click="finalizeBill(true)">
              Save & Print
            </button>
            Grand Total</td>
            <td colspan="2" class="fw-bold">₹{{ grandTotal.toFixed(2) }}</td>
            <td v-if="showProfit" class="gain-col fw-bold" style="color:#198754;">
      ₹{{ grandProfit.toFixed(2) }}
    </td>
          </tr>
        </tfoot>
      </table>
      
    </div>
  `
};