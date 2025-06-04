export default {
  data() {
    return {
      items: [
        {
          itemCode: '',
          itemName: '',
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
        { label: 'S.no.', key: 'sno', editable: false },
        { label: 'Item code', key: 'itemCode', editable: true },
        { label: 'Item Name', key: 'itemName', editable: true },
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
    if (currentEditableColIdx < editableCols.length - 1) {
      moveAndEdit(rowIdx, editableCols[currentEditableColIdx + 1].idx);
    } else {
      let nextRow = rowIdx + 1;
      if (nextRow >= this.items.length) {
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
    if (nextRow < this.items.length) {
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
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.startEdit(0, 1);
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
            h('tbody', this.items.map((item, rowIdx) =>
              h('tr', this.columns.map((col, colIdx) => {
                if (col.key === 'sno') {
                  return h('td', rowIdx + 1);
                }
                if (this.editing.row === rowIdx && this.editing.col === colIdx) {
                  return h('td', [
                    h('input', {
                      ref: `input-${rowIdx}-${colIdx}`,
                      domProps: { value: item[col.key] },
                      on: {
                        input: e => this.items[rowIdx][col.key] = e.target.value,
                        blur: () => this.editing = {},
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
                  style: { cursor: col.editable ? 'pointer' : 'default' }
                }, item[col.key]);
              }))
            ))
          ])
        ])
      ])
    ]);
  }
};
