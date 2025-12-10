import { createApp } from 'vue'
import App from './App.vue'
import router from "./router/router";
import i18n from "./i18n";
import { PiniaCookiesPlugin } from './plugins/pinia-cookies';
import { createPinia } from 'pinia';
import axios from 'axios'
import { VueTelegramPlugin } from "vue-tg";

axios.defaults.baseURL = "https://back.gardawallet.com";
// axios.defaults.baseURL = "http://45.12.238.27:3030/";

// Кеш токена с коротким временем жизни для избежания множественных запросов
let tokenCache = null;
let tokenCacheTime = 0;
const TOKEN_CACHE_DURATION = 1000; // 1 секунда

// Функция для получения нового токена
const getGardaToken = async () => {
  // Используем короткий кеш чтобы не делать запрос при каждом одновременном axios запросе
  const now = Date.now();
  if (tokenCache && (now - tokenCacheTime) < TOKEN_CACHE_DURATION) {
    return tokenCache;
  }

  try {
    // Используем fetch без axios
    const response = await window.fetch('./key_garda_f.txt', {
      cache: 'no-cache'
    });
    
    if (!response.ok) {
      console.error('Failed to load garda token:', response.status);
      return null;
    }
    
    const token = await response.text();
    const trimmedToken = token.trim();
    
    // Обновляем кеш
    tokenCache = trimmedToken;
    tokenCacheTime = now;
    
    return trimmedToken;
  } catch (error) {
    console.error('Error loading garda token:', error);
    return null;
  }
};

// Interceptor для добавления g_key заголовка только к API запросам
axios.interceptors.request.use(async (config) => {
  // Проверяем что это запрос к API, а не к локальным файлам
  if (config.baseURL && config.baseURL.includes('gardawallet.com')) {
    try {
      const token = await getGardaToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers['g_key'] = token;
        console.log('Added g_key header to API request:', config.url);
      } else {
        console.warn('No garda token available for request:', config.url);
      }
    } catch (error) {
      console.error('Failed to get garda token for request:', error);
    }
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
