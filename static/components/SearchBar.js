export default {
    template: `
    <div class="row border-bottom align-items-center" style="min-height: 50px; height: auto;">
        <div class="col d-flex justify-content-between align-items-center flex-wrap">
            <!-- Left Side Buttons -->
            <div class="d-flex align-items-center flex-wrap">
                <button class="btn btn-outline-primary mx-1 d-flex align-items-center">
                    <router-link to="/" class="text-decoration-none text-reset d-flex align-items-center">
                    <span class="me-1">
                        <!-- Home SVG -->
                        <i class="bi bi-house"></i>
                    </span>
                    Home
                </router-link>
                </button>
                <button class="btn btn-outline-primary mx-1 d-flex align-items-center" @click="addBillTab">
                    <span class="me-1">
                        <!-- Receipt/Bill SVG -->
                        <i class="bi bi-receipt"></i>
                    </span>
                    New Bill
                </button>
                <button class="btn btn-outline-primary mx-1 d-flex align-items-center">
                    <router-link to="/inventoryManagement" class="text-decoration-none text-reset d-flex align-items-center">
                    <span class="me-1">
                        <!-- Box/Inventory SVG -->
                        <i class="bi bi-boxes"></i>
                    </span>
                    Inventory
                    </router-link>
                </button>
                <button class="btn btn-outline-primary mx-1 d-flex align-items-center">
                    <span class="me-1">
                        <!-- Stats SVG -->
                        <i class="bi bi-graph-up"></i>
                    </span>
                    Statistics
                </button>
            </div>
            <!-- Center Search Bar -->
            <div class="mx-3 flex-grow-1" style="max-width: 400px;">
                <input type="text" class="form-control" placeholder="Search..." @input="$emit('search', $event.target.value)"/>
            </div>
            <!-- Right Side Buttons -->
            <div class="d-flex align-items-center flex-wrap justify-content-end">
                <button class="btn btn-outline-primary mx-1 d-flex align-items-center">
                    <span class="me-1">
                        <!-- Cloud/Backup SVG -->
                        <i class="bi bi-cloud"></i>
                    </span>
                    Backup
                </button>
                <button class="btn btn-outline-primary mx-1 d-flex align-items-center">
                    <span class="me-1">
                        <!-- Person/Profile SVG -->
                        <i class="bi bi-person"></i>
                    </span>
                    Profile
                </button>
            </div>
        </div>
    </div>
    `,
    methods: {
        addBillTab() {
            this.$emit('add-bill-tab');
        }
    }
}