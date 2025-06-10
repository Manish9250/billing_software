export default {
  props: ['searchTerm'],
  data() {
    return {
      items: [
        {
          itemCode: '',
          itemName: '',
          itemCategory: '',
          size: '',
          buyPrice: '',
          quantity: '',
          wholesalePrice: '',
          retailPrice: '',
          alertQuantity: '',
          expiryDuration: ''
        }
      ],
      editing: { row: 0, col: 1 },
      columns: [
        { label: 'Item code', key: 'itemCode', editable: false },
        { label: 'Item Name', key: 'itemName', editable: true },
        { label: 'Item Category', key: 'itemCategory', editable: true },
        { label: 'Size', key: 'size', editable: true },
        { label: 'Buy Price', key: 'buyPrice', editable: true },
        { label: 'Quantity', key: 'quantity', editable: true },
        { label: 'Wholesale Price', key: 'wholesalePrice', editable: true },
        { label: 'Retail Price', key: 'retailPrice', editable: true },
        { label: 'Alert Quantity', key: 'alertQuantity', editable: true },
        { label: 'Expiry Duration', key: 'expiryDuration', editable: true }
      ]
    };
  },
  methods: {
    // Helper to map filtered row index to original items array index
    getOriginalIndex(filteredRowIdx) {
      const filteredItem = this.filteredItems[filteredRowIdx];
      return this.items.findIndex(i => i.itemCode === filteredItem.itemCode);
    },

    startEdit(rowIdx, colIdx) {
      if (this.columns[colIdx].editable) {
        this.editing = { row: rowIdx, col: colIdx };
        const refName = `input-${rowIdx}-${colIdx}`;
        const tryFocus = (retries = 10) => {
          this.$nextTick(() => {
            setTimeout(() => {
              const input = this.$refs[refName];
              if (input && input.focus) {
                input.focus();
              } else if (retries > 0) {
                tryFocus(retries - 1);
              }
            }, 0);
          });
        };
        tryFocus();
      }
    },

    handleKeyDown(e, rowIdx, colIdx) {
      const editableCols = this.columns
        .map((col, idx) => ({ ...col, idx }))
        .filter(col => col.editable);

      const currentEditableColIdx = editableCols.findIndex(col => col.idx === colIdx);

      // Commit value and blur before moving
      const moveAndEdit = (nextRow, nextCol) => {
        this.editing = {}; // Clear editing to force re-render
        this.$nextTick(() => {
          this.startEdit(nextRow, nextCol);
        });
      };

      if (e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault();
        // Evaluate expression if input starts with '='
        const colKey = this.columns[colIdx].key;
        const origIdx = this.getOriginalIndex(rowIdx);
        let val = this.items[origIdx][colKey];
        if (typeof val === 'string' && val.trim().startsWith('=')) {
          try {
            // Only allow numbers and math operators for safety
            const expr = val.trim().slice(1);
            if (/^[\d+\-*/().\s]+$/.test(expr)) {
              // eslint-disable-next-line no-eval
              const result = eval(expr);
              if (!isNaN(result)) {
                this.items[origIdx][colKey] = result;
              }
            }
          } catch (err) {
            // Optionally show error or ignore
          }
        }

        if (currentEditableColIdx < editableCols.length - 1) {
          moveAndEdit(rowIdx, editableCols[currentEditableColIdx + 1].idx);
        } else {
          let nextRow = rowIdx + 1;
          this.saveRow(rowIdx);
          if (nextRow >= this.filteredItems.length) {
            this.addRow(() => {
              moveAndEdit(nextRow, editableCols[0].idx);
            });
          } else {
            moveAndEdit(nextRow, editableCols[0].idx);
          }
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentEditableColIdx > 0) {
          moveAndEdit(rowIdx, editableCols[currentEditableColIdx - 1].idx);
        } else if (rowIdx > 0) {
          moveAndEdit(rowIdx - 1, editableCols[editableCols.length - 1].idx);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextRow = rowIdx + 1;
        if (nextRow < this.filteredItems.length) {
          moveAndEdit(nextRow, colIdx);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevRow = rowIdx - 1;
        if (prevRow >= 0) {
          moveAndEdit(prevRow, colIdx);
        }
      }
    },

    addRow(callback) {
      this.items.push({
        itemCode: '',
        itemName: '',
        itemCategory: '',
        size: '',
        buyPrice: '',
        quantity: '',
        wholesalePrice: '',
        retailPrice: '',
        alertQuantity: '',
        expiryDuration: ''
      });
      this.$nextTick(() => {
        if (callback) callback();
      });
    },

    saveRow(filteredRowIdx) {
      const origIdx = this.getOriginalIndex(filteredRowIdx);
      const item = this.items[origIdx];
      // Only send if required fields are filled
      if (item.itemName && item.size) {
        // Detect if quantity input is "+N"
        let qtyInput = String(item.quantity).trim();
        let isAddition = qtyInput.startsWith('+');
        let addQty = isAddition ? parseFloat(qtyInput.slice(1)) : null;

        const payload = {
          name: item.itemName,
          category: item.itemCategory || '',
          size: item.size,
          buy_price: parseFloat(item.buyPrice) || 0,
          quantity: isAddition
            ? (parseFloat(item.prevQuantity) || 0) + (addQty || 0)
            : parseFloat(item.quantity) || 0,
          wholesale_price: parseFloat(item.wholesalePrice) || 0,
          retail_price: parseFloat(item.retailPrice) || 0,
          alert_quantity: parseFloat(item.alertQuantity) || 0,
          expiry_duration: parseInt(item.expiryDuration) || 0
        };
        if (item.itemCode) {
          // Existing item, use PUT
          fetch(`/api/items/${item.itemCode}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }).then(() => {
            // If +N, also POST to /api/purchase
            if (isAddition && addQty > 0) {
              fetch('/api/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  item_id: item.itemCode,
                  quantity: addQty,
                  buy_price: parseFloat(item.buyPrice) || 0,
                  sell_price: parseFloat(item.wholesalePrice) || 0
                })
              });
              // Update the displayed quantity
              this.items[origIdx].quantity = ((parseFloat(item.prevQuantity) || 0) + addQty).toString();
            }
            // Save the new quantity as prevQuantity for next edit
            this.items[origIdx].prevQuantity = this.items[origIdx].quantity;
          });
        } else {
          // New item, use POST
          fetch('/api/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
            .then(res => res.json())
            .then(data => {
              // Save the returned id to avoid duplicate POSTs
              if (data.id) this.items[origIdx].itemCode = data.id;
              // Creating Purchase entry
              fetch('/api/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  item_id: data.id,
                  quantity: item.quantity,
                  buy_price: item.buyPrice,
                  sell_price: item.wholesalePrice
                })
              });
              this.items[origIdx].prevQuantity = payload.quantity.toString();
            })
            .catch(err => {
              // Handle error (show message, etc.)
              console.error('Failed to save row:', err);
            });
        }
      }
    }
  },
  computed: {
    filteredItems() {
      if (!this.searchTerm) return this.items;
      const term = this.searchTerm.toLowerCase();
      return this.items.filter(item =>
        Object.values(item).some(val =>
          String(val).toLowerCase().includes(term)
        )
      );
    }
  },
  mounted() {
    // Fetch data from backend on mount
    fetch('/api/items')
      .then(res => res.json())
      .then(data => {
        // Map backend data to your table structure
        this.items = data.map(item => ({
          itemCode: item.id || '', // or item.itemCode if your backend uses that
          itemName: item.name || '',
          itemCategory: item.category || '',
          size: item.size || '',
          buyPrice: item.buy_price || '',
          quantity: item.quantity || '',
          prevQuantity: item.quantity || '',
          wholesalePrice: item.wholesale_price || '',
          retailPrice: item.retail_price || '',
          alertQuantity: item.alert_quantity || '',
          expiryDuration: item.expiry_duration || ''
        }));
        this.addRow();
        // If no items, keep at least one empty row
        if (this.items.length === 0) {
          this.items.push({
            itemCode: '',
            itemName: '',
            itemCategory: '',
            size: '',
            buyPrice: '',
            quantity: '',
            wholesalePrice: '',
            retailPrice: '',
            alertQuantity: '',
            expiryDuration: ''
          });
        }
        // Start editing the first editable cell
        this.$nextTick(() => {
          this.startEdit(this.items.length - 1, 1);
        });
      })
      .catch(err => {
        // Handle error (optional)
        console.error('Failed to fetch items:', err);
      });
  },

  render(h) {
    return h('div', { class: 'row border', style: { height: '100%' } }, [
      h('div', { class: 'col', style: { height: '450px', overflowY: 'auto', minHeight: 0 } }, [
        h('div', { class: 'mx-auto mt-2' }, [
          h('h5', 'Inventory Management Page'),
          h('table', { class: 'table table-bordered mt-3' }, [
            h('thead', [
              h('tr', this.columns.map(col => h('th', col.label)))
            ]),
            h('tbody', this.filteredItems.map((item, rowIdx) =>
              h('tr', this.columns.map((col, colIdx) => {
                if (this.editing.row === rowIdx && this.editing.col === colIdx) {
                  return h('td', [
                    h('input', {
                      ref: `input-${rowIdx}-${colIdx}`,
                      domProps: { value: item[col.key] },
                      on: {
                        input: e => {
                          // Always update the original items array
                          const origIdx = this.getOriginalIndex(rowIdx);
                          this.items[origIdx][col.key] = e.target.value;
                        },
                        blur: () => { this.editing = {}; },
                        keydown: e => this.handleKeyDown(e, rowIdx, colIdx)
                      },
                      style: { width: '100%' }
                    })
                  ]);
                }
                return h('td', {
                  on: {
                    click: () => this.startEdit(rowIdx, colIdx)
                  },
                  style: { height: "40px", cursor: col.editable ? 'pointer' : 'default' }
                }, item[col.key]);
              }))
            ))
          ])
        ])
      ])
    ]);
  }
};