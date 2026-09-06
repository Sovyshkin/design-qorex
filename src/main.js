import { createApp } from 'vue'
import App from './App.vue'
import router from "./router/router";
import i18n from "./i18n";
import { PiniaCookiesPlugin } from './plugins/pinia-cookies';
import { createPinia } from 'pinia';
import axios from 'axios'
import {
  clearBrowserAuth,
  getAccessToken,
  getBrowserAuthProvider,
  getSavedBrowserUser,
  getTelegramInitData,
} from "@/utils/auth";
import './assets/theme.css'; // Подключаем стили темы
import './assets/global-theme.css'; // Подключаем глобальные стили компонентов

const shouldLoadTelegramSdk = () => {
  const userAgent = navigator.userAgent || "";
  const search = window.location.search || "";
  const hash = window.location.hash || "";

  return Boolean(
    window.Telegram ||
      window.TelegramWebviewProxy ||
      /Telegram/i.test(userAgent) ||
      /tgWebApp/i.test(search) ||
      /tgWebApp/i.test(hash)
  );
};

const loadTelegramSdk = () => {
  if (!shouldLoadTelegramSdk() || window.Telegram?.WebApp) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const existingScript = document.querySelector('script[src="https://telegram.org/js/telegram-web-app.js"]');

    if (existingScript) {
      existingScript.addEventListener("load", resolve, { once: true });
      existingScript.addEventListener("error", resolve, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.async = true;
    script.onload = resolve;
    script.onerror = resolve;
    document.head.appendChild(script);
    setTimeout(resolve, 3500);
  });
};

axios.defaults.baseURL = "https://back.peekpay.ru";
axios.defaults.timeout = 12000;

// Interceptor для добавления авторизации к каждому запросу
axios.interceptors.request.use(async (config) => {
  try {
    const initData = getTelegramInitData();
    const token = getAccessToken();
    const isEmailBrowserAuth = getBrowserAuthProvider() === "email";
    const isTelegramAuthRequest = String(config.url || "").includes("/auth/telegram");

    config.headers = config.headers || {};

    if (initData) {
      config.headers['X-Init-Data'] = initData;
      config.headers['X-Timestamp'] = Math.floor(Date.now() / 1000);
    } else if (isEmailBrowserAuth) {
      config.withCredentials = true;
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
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
    const hasMiniAppAuth = Boolean(getTelegramInitData());
    const hasBrowserAuth = Boolean(getAccessToken()) || Boolean(getSavedBrowserUser()?.id);
    const isTelegramAuthRequest = String(error.config?.url || "").includes("/auth/telegram");
    const isUnauthorizedBrowserSession =
      error.response?.status === 401 &&
      !hasMiniAppAuth &&
      hasBrowserAuth &&
      !isTelegramAuthRequest;

    if (isUnauthorizedBrowserSession) {
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

loadTelegramSdk().finally(async () => {
  const app = createApp(App);
  app.use(pinia);
  app.use(router)
  app.use(i18n)
  app.config.devtools = false
  if (window.Telegram?.WebApp) {
    try {
      const { VueTelegramPlugin } = await import("vue-tg");
      app.use(VueTelegramPlugin)
    } catch (_error) {}
  }
  app.mount('#app')
});
