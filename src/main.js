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

// Функция для получения токена из key_garda.txt
const getGardaToken = async () => {
  try {
    const response = await fetch('/key_garda.txt');
    if (!response.ok) {
      throw new Error(`Failed to fetch garda token: ${response.status}`);
    }
    const token = await response.text();
    return token.trim();
  } catch (error) {
    console.error('Error fetching garda token:', error);
    return null;
  }
};

// Interceptor для добавления g_key заголовка ко всем запросам
axios.interceptors.request.use(async (config) => {
  try {
    const token = await getGardaToken();
    if (token) {
      config.headers['g_key'] = token;
    }
  } catch (error) {
    console.error('Failed to add garda token to request:', error);
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
