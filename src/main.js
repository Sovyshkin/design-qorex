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

// Кеш токена для избежания множественных запросов
let tokenCache = null;
let tokenCacheTime = 0;
const TOKEN_CACHE_DURATION = 5000; // 5 секунд

// Функция для получения токена из key_garda.txt
const getGardaToken = async () => {
  // Используем кеш для избежания частых запросов
  const now = Date.now();
  if (tokenCache && (now - tokenCacheTime) < TOKEN_CACHE_DURATION) {
    return tokenCache;
  }

  try {
    const response = await fetch('/key_garda.txt', {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch garda token: ${response.status}`);
    }
    
    const token = await response.text();
    const trimmedToken = token.trim();
    
    // Обновляем кеш
    tokenCache = trimmedToken;
    tokenCacheTime = now;
    
    return trimmedToken;
  } catch (error) {
    console.error('Error fetching garda token:', error);
    return null;
  }
};

// Interceptor для добавления g_key заголовка ко всем запросам
axios.interceptors.request.use(async (config) => {
  // Проверяем что это не запрос к самому токену файлу
  if (!config.url.includes('key_garda.txt')) {
    try {
      const token = await getGardaToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers['g_key'] = token;
        console.log('Added g_key header to request:', config.url);
      }
    } catch (error) {
      console.error('Failed to add garda token to request:', error);
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
