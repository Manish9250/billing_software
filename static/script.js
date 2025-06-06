// Remove import statements if using CDN

import BillPage from "./components/BillPage.js"
import InventoryManagement from "./components/InventoryManagement.js"
import SearchBar from "./components/SearchBar.js"

const Home = { template: '<div>Home</div>' }
const Dashboard = { template: '<div>Dashboard</div>' }
const Foot = { template: '<div class="text-center">Welcome to Laxmi Store</div>' }

const routes = [
    { path: '/', component: Home, name: 'Home' },
    { path: '/dashboard', component: Dashboard, name: 'Dashboard' },
    { path: '/inventoryManagement', component: InventoryManagement, name: 'Inventory Management' },
    { path: '/bill/:billId', component: BillPage, name: 'Bill', props: true }
];

const router = new VueRouter({ routes });

const app = new Vue({
    el: '#app',
    router,
    data: {
        openTabs: [
            { path: '/', name: 'Home' },
            { path: '/dashboard', name: 'Dashboard' }
        ],
        activeTab: '/'
    },
    watch: {
        '$route'(to) {
            this.activeTab = to.path;
            // Add tab if not already open
            if (!this.openTabs.find(tab => tab.path === to.path)) {
                const route = routes.find(r => r.path === to.path);
                if (route) {
                    this.openTabs.push({ path: route.path, name: route.name });
                }
            }
        }
    },
    methods: {
        closeTab(tabPath) {
            const idx = this.openTabs.findIndex(tab => tab.path === tabPath);
            if (idx !== -1) {
                this.openTabs.splice(idx, 1);
                // If the closed tab was active, switch to the last tab
                if (this.activeTab === tabPath) {
                    const nextTab = this.openTabs[idx - 1] || this.openTabs[0];
                    if (nextTab) this.$router.push(nextTab.path);
                }
            }
        },
        addBillTab() {
          // Find the highest bill number in openTabs
          const billTabs = this.openTabs.filter(tab => tab.path.startsWith('/bill/'));
          let maxBillId = 0;
          billTabs.forEach(tab => {
              const match = tab.path.match(/\/bill\/(\d+)/);
              if (match) {
                  maxBillId = Math.max(maxBillId, parseInt(match[1]));
              }
          });
          const newBillId = maxBillId + 1;
          const newPath = `/bill/${newBillId}`;
          this.openTabs.push({ path: newPath, name: `Bill #${newBillId}` });
          this.activeTab = newPath;
          this.$router.push(newPath);
      }
    },
    template: `
      <div class="d-flex flex-column min-vh-100" >
        <nav class="d-flex align-items-center justify-content-between">
          <div class="nav nav-tabs flex-grow-1">
            <span v-for="tab in openTabs" :key="tab.path" class="nav-item">
              <router-link
                :to="tab.path"
                class="nav-link d-flex align-items-center justify-content-between"
                :class="{ active: activeTab === tab.path }"
                style="width: 150px;"
              >
                <span
                  style="flex:1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
                >
                  {{ tab.name }}
                </span>
                <button
                  v-if="openTabs.length > 1"
                  class="btn btn-sm btn-close align-self-center ms-2"
                  @click.prevent.stop="closeTab(tab.path)"
                  style="font-size:0.7rem;vertical-align:middle; flex-shrink:0;"
                  title="Close tab"
                ></button>
              </router-link>
            </span>
          </div>
          <div class="mx-3 align-self-center">
              <i class="bi bi-caret-down"></i>
            </div>
        </nav>
        <search-bar @add-bill-tab="addBillTab"></search-bar>
        <div class="flex-grow-1 d-flex flex-column">
      <router-view class="flex-grow-1 w-100"></router-view>
    </div>
        <foot class="mt-auto"></foot>
      </div>
    `,
    components: {
        'foot': Foot,
        'search-bar': SearchBar
    }
});

