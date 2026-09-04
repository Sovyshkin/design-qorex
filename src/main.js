import { createApp } from 'vue'
import App from './App.vue'
import router from "./router/router";
import i18n from "./i18n";
import { PiniaCookiesPlugin } from './plugins/pinia-cookies';
import { createPinia } from 'pinia';
import axios from 'axios'
import { VueTelegramPlugin } from "vue-tg";
import { clearBrowserAuth, getAccessToken, getTelegramInitData } from "@/utils/auth";
import './assets/theme.css'; // Подключаем стили темы
import './assets/global-theme.css'; // Подключаем глобальные стили компонентов

axios.defaults.baseURL = "https://back.peekpay.ru";
axios.defaults.timeout = 12000;

// Interceptor для добавления авторизации к каждому запросу
axios.interceptors.request.use(async (config) => {
  try {
    const initData = getTelegramInitData();
    const token = getAccessToken();
    const isTelegramAuthRequest = String(config.url || "").includes("/auth/telegram");

    config.headers = config.headers || {};

    if (initData) {
      config.headers['X-Init-Data'] = initData;
      config.headers['X-Timestamp'] = Math.floor(Date.now() / 1000);
    } else if (token && !isTelegramAuthRequest && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (_error) {}

  return config;
}, (error) => {
  return Promise.reject(error);
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail = String(error.response?.data?.detail || error.response?.data?.message || "");
    const hasMiniAppAuth = Boolean(getTelegramInitData());
    const hasBrowserAuth = Boolean(getAccessToken());
    const isTelegramAuthRequest = String(error.config?.url || "").includes("/auth/telegram");
    const isExpiredBrowserToken =
      error.response?.status === 401 &&
      !hasMiniAppAuth &&
      hasBrowserAuth &&
      !isTelegramAuthRequest &&
      (/token expired|expired|unauthorized/i.test(detail) || !detail);

    if (isExpiredBrowserToken) {
      clearBrowserAuth();
      if (window.location.pathname !== "/browser") {
        window.location.assign("/browser?reauth=1");
      }
    }

    return Promise.reject(error);
  }
);

const pinia = createPinia();
pinia.use(PiniaCookiesPlugin);

const app = createApp(App);
app.use(pinia);
app.use(router)
app.use(i18n)
app.config.devtools = false
app.use(VueTelegramPlugin)
app.mount('#app')
