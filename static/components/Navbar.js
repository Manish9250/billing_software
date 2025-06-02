export default {
    template: `
    <nav>
      <div class="nav nav-tabs">
        <router-link
          to="/"
          class="nav-link"
          exact
          active-class="active"
        >Home</router-link>
        <router-link
          to="/dashboard"
          class="nav-link"
          active-class="active"
        >Dashboard</router-link>
      </div>
    </nav>
    `
}

