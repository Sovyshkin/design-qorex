import { createApp } from 'vue'
import App from './App.vue'
import router from "./router/router";
import i18n from "./i18n";
import { PiniaCookiesPlugin } from './plugins/pinia-cookies';
import { createPinia } from 'pinia';
import axios from 'axios'
import { VueTelegramPlugin } from "vue-tg";
import gardaKeyRaw from '/key_garda.txt?raw';

axios.defaults.baseURL = "https://back.gardawallet.com";
// axios.defaults.baseURL = "http://45.12.238.27:3030/";

// Получаем ключ из импортированного файла
const GARDA_TOKEN = gardaKeyRaw.trim();
console.log('Loaded garda token:', GARDA_TOKEN ? 'Token loaded successfully' : 'Failed to load token');

// Interceptor для добавления g_key заголовка ко всем запросам
axios.interceptors.request.use((config) => {
  if (GARDA_TOKEN) {
    config.headers = config.headers || {};
    config.headers['g_key'] = GARDA_TOKEN;
    console.log('Added g_key header to request:', config.url);
  } else {
    console.warn('No garda token available for request:', config.url);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

const pinia = createPinia();
pinia.use(PiniaCookiesPlugin);

const app = createApp(App);
app.use(pinia);
app.use(router)
app.use(i18n)
app.config.devtools = false
app.use(VueTelegramPlugin)
app.mount('#app')
