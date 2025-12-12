import { createApp } from 'vue'
import App from './App.vue'
import router from "./router/router";
import i18n from "./i18n";
import { PiniaCookiesPlugin } from './plugins/pinia-cookies';
import { createPinia } from 'pinia';
import axios from 'axios'
import { VueTelegramPlugin } from "vue-tg";
import './assets/theme.css'; // Подключаем стили темы
import './assets/global-theme.css'; // Подключаем глобальные стили компонентов

axios.defaults.baseURL = "https://back.gardawallet.com";
// axios.defaults.baseURL = "http://45.12.238.27:3030/";

// Функция для получения Telegram initData
const getTelegramInitData = () => {
  if (window.Telegram?.WebApp?.initData) {
    return window.Telegram.WebApp.initData;
  }
  console.warn('No Telegram initData available');
  return null;
};

// Interceptor для добавления Telegram данных к каждому запросу
axios.interceptors.request.use(async (config) => {
  console.log('Interceptor called for URL:', config.url);
  
  try {
    const initData = getTelegramInitData();
    if (initData) {
      config.headers = config.headers || {};
      config.headers['X-Init-Data'] = initData;
      config.headers['X-Timestamp'] = Math.floor(Date.now() / 1000);
      console.log('Added Telegram auth headers');
    } else {
      console.warn('No Telegram initData available for request');
    }
  } catch (error) {
    console.error('Error getting Telegram data for request:', error);
  }
  
  console.log('Final headers:', config.headers);
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
