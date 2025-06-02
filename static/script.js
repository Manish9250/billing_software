// Remove import statements if using CDN

import InventoryManagement from "./components/InventoryManagement.js"
import SearchBar from "./components/SearchBar.js"

const Home = { template: '<div>Home</div>' }
const Dashboard = { template: '<div>Dashboard</div>' }
const Foot = { template: '<div class="text-center">Welcome to Laxmi Store</div>' }

const routes = [
    { path: '/', component: Home, name: 'Home' },
    { path: '/dashboard', component: Dashboard, name: 'Dashboard' },
    { path: '/inventoryManagement', component: InventoryManagement, name: 'Inventory Management' }
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
        }
    },
    template: `
      <div>
        <nav>
          <div class="nav nav-tabs">
            <span v-for="tab in openTabs" :key="tab.path" class="nav-item">
              <router-link
                :to="tab.path"
                class="nav-link"
                :class="{ active: activeTab === tab.path }"
              >
                {{ tab.name }}
                <button
                  v-if="openTabs.length > 1"
                  class="btn btn-sm btn-close ms-2"
                  @click.prevent.stop="closeTab(tab.path)"
                  style="font-size:0.7rem;vertical-align:middle;"
                  title="Close tab"
                ></button>
              </router-link>
            </span>
          </div>
        </nav>
        <search-bar></search-bar>
        <router-view></router-view>
        <foot></foot>
      </div>
    `,
    components: {
        'foot': Foot,
        'search-bar': SearchBar
    }
});

