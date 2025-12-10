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

// Функция для получения нового токена при каждом запросе
const getGardaToken = () => {
  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', './key_garda_f.txt', true); // асинхронный запрос
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            const token = xhr.responseText.trim();
            resolve(token);
          } else {
            console.error('Failed to load garda token:', xhr.status);
            resolve(null);
          }
        }
      };
      xhr.onerror = function() {
        console.error('Error loading garda token');
        resolve(null);
      };
      xhr.send();
    } catch (error) {
      console.error('Exception loading garda token:', error);
      resolve(null);
    }
  });
};

// Interceptor для добавления g_key заголовка ко всем запросам
axios.interceptors.request.use(async (config) => {
  try {
    const token = await getGardaToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers['g_key'] = token;
      console.log('Added fresh g_key header to request:', config.url);
    } else {
      console.warn('No garda token available for request:', config.url);
    }
  } catch (error) {
    console.error('Failed to get garda token for request:', error);
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
