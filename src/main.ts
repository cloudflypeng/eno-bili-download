import { createApp } from 'vue'
import App from './App.vue'

import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice'
import Aura from '@primevue/themes/aura';

import './style.css'
import './demos/ipc'
// If you want use Node.js, the`nodeIntegration` needs to be enabled in the Main process.
// import './demos/node'

const app = createApp(App);
app.use(PrimeVue, {
  theme: {
    preset: Aura
  }
});
app.use(ToastService)
app
  .mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*')
  })




