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

// Функция для получения токена из файла
const getGardaToken = async () => {
  try {
    const response = await fetch('./key_garda_f.txt', {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      console.error('Failed to load garda token:', response.status);
      return null;
    }
    
    const token = await response.text();
    return token.trim();
  } catch (error) {
    console.error('Error loading garda token:', error);
    return null;
  }
};

// Interceptor для добавления g_key заголовка к каждому запросу
axios.interceptors.request.use(async (config) => {
  console.log('Interceptor called for URL:', config.url);
  
  try {
    const token = await getGardaToken();
    console.log(token)
    if (token) {
      config.headers = config.headers || {};
      config.headers['g_key'] = token;
      console.log('Added g_key header:', token.substring(0, 20) + '...');
    } else {
      console.warn('No token available for request');
    }
  } catch (error) {
    console.error('Error getting token for request:', error);
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
