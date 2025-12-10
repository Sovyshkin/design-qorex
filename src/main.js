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

// Переменная для хранения токена
let GARDA_TOKEN = null;

// Функция для загрузки токена ОДИН РАЗ при инициализации
const loadGardaToken = async () => {
  try {
    const response = await fetch('./key_garda_f.txt', {
      cache: 'no-cache'
    });
    
    if (!response.ok) {
      console.error('Failed to load garda token:', response.status);
      return;
    }
    
    GARDA_TOKEN = await response.text().then(text => text.trim());
    console.log('Garda token loaded successfully');
    
    // Периодически обновляем токен (каждые 30 секунд)
    setInterval(async () => {
      try {
        const response = await fetch('./key_garda_f.txt', {
          cache: 'no-cache'
        });
        if (response.ok) {
          GARDA_TOKEN = await response.text().then(text => text.trim());
          console.log('Garda token refreshed');
        }
      } catch (error) {
        console.error('Error refreshing garda token:', error);
      }
    }, 30000); // 30 секунд
    
  } catch (error) {
    console.error('Error loading garda token:', error);
  }
};

// Загружаем токен при старте приложения
loadGardaToken();

// Простой interceptor для добавления g_key заголовка
axios.interceptors.request.use((config) => {
  if (GARDA_TOKEN) {
    config.headers = config.headers || {};
    config.headers['g_key'] = GARDA_TOKEN;
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
