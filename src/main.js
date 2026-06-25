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

axios.defaults.baseURL = "https://back.peekpay.ru";
axios.defaults.timeout = 12000;

window.addEventListener('error', (event) => {
  console.error('[PeekPay Global Error]', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
    stack: event.error?.stack,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[PeekPay Unhandled Promise]', {
    reason: event.reason,
    message: event.reason?.message,
    stack: event.reason?.stack,
    response: event.reason?.response?.data,
    status: event.reason?.response?.status,
  });
});

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
app.config.errorHandler = (error, instance, info) => {
  console.error('[PeekPay Vue Error]', {
    error,
    message: error?.message,
    stack: error?.stack,
    component: instance?.type?.name || instance?.type?.__name,
    info,
  });
};
app.use(pinia);
app.use(router)
app.use(i18n)
app.config.devtools = false
app.use(VueTelegramPlugin)
app.mount('#app')
