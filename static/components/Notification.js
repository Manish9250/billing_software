export default {
  data() {
    return {
      notifications: []
    };
  },
  methods: {
    show(message, type = 'success', timeout = 5000) {
      const id = Date.now() + Math.random();
      this.notifications.push({ id, message, type });
      // Play sound
      if (type === 'success') {
        this.$refs.successAudio.play();
      } else {
        this.$refs.errorAudio.play();
      }
      setTimeout(() => this.remove(id), timeout);
    },
    remove(id) {
      this.notifications = this.notifications.filter(n => n.id !== id);
    }
  },
  template: `
    <div style="position:fixed; left:20px; bottom:20px; z-index:9999;">
      <audio ref="successAudio" src="/static/sounds/success.wav"></audio>
      <audio ref="errorAudio" src="/static/sounds/error.wav"></audio>
      <transition-group name="slide-fade" tag="div">
        <div v-for="n in notifications" :key="n.id"
          :class="['alert', n.type === 'success' ? 'alert-success' : 'alert-danger', 'shadow', 'mb-2', 'd-flex', 'align-items-center']"
          style="min-width:250px; max-width:350px; animation:slideInLeft 0.4s;">
          <span class="flex-grow-1">{{ n.message }}</span>
          <button class="btn btn-close ms-2" @click="remove(n.id)"></button>
        </div>
      </transition-group>
    </div>
  `,
  mounted() {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes slideInLeft {
        from { transform: translateX(-120%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      .slide-fade-enter-active, .slide-fade-leave-active {
        transition: all 0.4s;
      }
      .slide-fade-enter, .slide-fade-leave-to {
        opacity: 0;
        transform: translateX(-120%);
      }
    `;
    document.head.appendChild(style);
  }
};