<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import NavBar from './components/NavBar.vue';
import AppLoader from './components/AppLoader.vue';
import AppMessage from './components/AppMessage.vue'
import { useWalletStore } from '@/stores/walletStore.ts'

const router = useRouter();
const walletStore = useWalletStore()
const accessDenied = ref(false);

// Функция для проверки необходимости ввода PIN
const requirePin = () => {
  const pinVerified = localStorage.getItem('pinVerified')
  
  // Сначала проверяем, есть ли пин-код в системе
  const hasPinCode = walletStore.hasPinCode()
  
  // Если пин-кода нет в системе, не требуем его ввод
  if (!hasPinCode) {
    // Очищаем все связанные настройки
    localStorage.removeItem('hasPinCode');
    localStorage.removeItem('pinVerified');
    return false
  }
  
  // Если PIN-код установлен и не был верифицирован в течение сессии
  if (hasPinCode && !pinVerified) {
    return true
  }
  
  // Проверяем, не истекло ли время сессии (5 минут)
  if (pinVerified) {
    const verificationTime = parseInt(pinVerified)
    const currentTime = Date.now()
    const sessionTimeout = 5 * 60 * 1000 // 5 минут
    
    if (currentTime - verificationTime > sessionTimeout) {
      localStorage.removeItem('pinVerified')
      return true
    }
  }
  
  return false
}

// Список маршрутов, которые не требуют PIN-кода
const publicRoutes = ['enterPin', 'createPin'];

// Маршруты, которые требуют проверки PIN перед доступом
const sensitiveRoutes = ['scanner', 'main', 'profile', 'history', 'deposit', 'withdraw', 'transfer'];

router.beforeEach(async (to, from, next) => {
  walletStore.isLoading = true;

  try {
    // Проверяем, загружены ли данные пользователя
    if (!walletStore.user.tg_id) {
      // Если данные не загружены, загружаем их
      await walletStore.getUserInfo();
      if (walletStore.userTg && walletStore.userTg.id) {
        await walletStore.getUser();
      }
    }

    // Проверяем, является ли маршрут публичным
    const isPublicRoute = publicRoutes.includes(to.name);
    const isSensitiveRoute = sensitiveRoutes.includes(to.name);

    // Проверка PIN для всех основных страниц приложения
    console.log('Router Guard PIN Check:', {
      to: to.name,
      from: from.name,
      isSensitiveRoute,
      hasPinCode: walletStore.hasPinCode(),
      codePasswordActive: walletStore.codePasswordActive,
      pinCode: walletStore.pinCode,
      requirePin: requirePin()
    });

    // Избегаем циклических перенаправлений
    if (to.name === 'enterPin' || to.name === 'createPin') {
      walletStore.isLoading = false;
      return next();
    }

    if (isSensitiveRoute && walletStore.hasPinCode() && requirePin()) {
      console.log('Router Guard: Перенаправляем на enterPin');
      walletStore.isLoading = false;
      return next({
        name: 'enterPin',
        query: { returnTo: to.fullPath }
      });
    }

    // Блокируем доступ к созданию PIN-кода если он уже установлен
    if (to.name === 'createPin' && walletStore.hasPinCode()) {
      walletStore.isLoading = false;
      return next({ name: 'main' });
    }

    next();
  } catch (error) {
    console.error('Router guard error:', error);
    next();
  } finally {
    setTimeout(() => {
      walletStore.isLoading = false;
    }, 500);
  }
});

// Функция проверки доступа по белому списку
const checkAccessByWhitelist = (userId) => {
  const allowedIds = import.meta.env.VITE_ALLOWED_TELEGRAM_IDS;
  
  // Если белый список не задан или пустой - разрешаем доступ всем
  if (!allowedIds || allowedIds.trim() === '') {
    return true;
  }
  
  // Парсим белый список и проверяем ID пользователя
  const allowedIdsArray = allowedIds.split(',').map(id => id.trim());
  return allowedIdsArray.includes(String(userId));
};

// Функция для инициализации приложения
const initializeApp = async () => {
  try {
    // Получаем информацию о пользователе из Telegram
    await walletStore.getUserInfo();

    // Если это Telegram Web App, создаем/получаем пользователя
    if (window.Telegram && window.Telegram.WebApp) {
      // Исправлено: правильное обращение к userTg
      if (walletStore.userTg && walletStore.userTg.id) {
        // Проверяем доступ по белому списку
        if (!checkAccessByWhitelist(walletStore.userTg.id)) {
          // Показываем экран блокировки доступа
          accessDenied.value = true;
          walletStore.isLoading = false;
          return;
        }

        // Загружаем данные пользователя (включая пин-код) из базы данных
        await walletStore.getUser();

        // Сбрасываем pinVerified после загрузки данных пользователя
        // Это важно для Telegram WebApp, т.к. каждое открытие бота - новая сессия
        localStorage.removeItem('pinVerified');

        // Проверяем, нужно ли запросить PIN-код сразу после загрузки данных
        const currentRoute = router.currentRoute.value;
        const isSensitiveRoute = sensitiveRoutes.includes(currentRoute.name);

        console.log('Инициализация: проверка PIN-кода', {
          currentRoute: currentRoute.name,
          isSensitiveRoute,
          hasPinCode: walletStore.hasPinCode(),
          codePasswordActive: walletStore.codePasswordActive,
          pinCode: walletStore.pinCode,
          requirePin: requirePin()
        });

        if (isSensitiveRoute && walletStore.hasPinCode() && requirePin()) {
          console.log('Инициализация: перенаправляем на enterPin');
          router.push({
            name: 'enterPin',
            query: { returnTo: currentRoute.fullPath }
          });
        }
      }
    }
  } catch (err) {
    console.error('Ошибка инициализации приложения:', err);
  }
}

onMounted(() => {

  initializeApp();
});

// Компьютед свойство для отображения контента (исключая страницы PIN-кода)
const showContent = computed(() => {
  const currentRoute = router.currentRoute.value;
  const shouldShow = !publicRoutes.includes(currentRoute.name);

  console.log('showContent computed:', {
    currentRoute: currentRoute.name,
    publicRoutes,
    shouldShow,
    accessDenied: accessDenied.value
  });

  return shouldShow;
});

// Добавляем отладочную информацию
const debugInfo = computed(() => {
  return {
    currentRoute: router.currentRoute.value.name,
    hasPinCode: walletStore.hasPinCode(),
    codePasswordActive: walletStore.codePasswordActive,
    pinCode: walletStore.pinCode,
    pinVerified: localStorage.getItem('pinVerified'),
    requirePin: requirePin(),
    showContent: showContent.value,
    userTg: walletStore.userTg,
    user: walletStore.user,
    isLoading: walletStore.isLoading
  };
});
</script>

<template>
  <main class="wrapper">
    <AppMessage/>
    
    <!-- Экран блокировки доступа -->
    <div class="access-denied" v-if="accessDenied">
      <div class="access-denied-content">
        <div class="lock-icon">🔒</div>
        <h1>Доступ ограничен</h1>
        <p>Приложение находится в режиме тестирования.</p>
        <p class="sub-text">Доступ разрешен только авторизованным пользователям.</p>
      </div>
    </div>
    
    <template v-else>
      <!-- Отображаем страницы PIN-кода без навбара -->
      <div v-if="!showContent" class="pin-page">
        <div class="wrap-load" v-if="walletStore.isLoading">
          <AppLoader/>
        </div>
        <router-view v-else v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
      
      <!-- Отображаем основной контент с навбаром -->
      <div v-else>
        <transition name="app-appear" appear>
          <div class="content-wrapper">
            <div class="wrap-load" v-if="walletStore.isLoading">
              <AppLoader/>
            </div>
            <router-view v-else v-slot="{ Component }">
              <transition name="page-transition" mode="out-in">
                <component :is="Component" />
              </transition>
            </router-view>
          </div>
        </transition>
        <transition name="navbar-appear" appear>
          <NavBar class="navbar-fixed" />
        </transition>
      </div>
    </template>
  </main>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Geologica:wght@100..900&display=swap');

#app {
  font-family: "Geologica", sans-serif;
  width: 100%;
  background-color: #fff;
  height: 100vh;
}

* {
  padding: 0px;
  margin: 0px;
  border: none;
  font-family: "Geologica", sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 20px;
  letter-spacing: 0;
  color: #1C1C1C;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}

body,
#app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

/* Links */
a,
a:link,
a:visited {
  text-decoration: none;
}

a:hover {
  text-decoration: none;
}

/* Common */
aside,
nav,
footer,
header,
section,
main {
  display: block;
}

ul,
ul li {
  list-style: none;
}

img {
  vertical-align: top;
}

img,
svg {
  max-width: 100%;
  height: auto;
}

/* Form */
input,
textarea,
button,
select {
  font-family: inherit;
  font-size: inherit;
  color: inherit;
  background-color: transparent;
}

input::-ms-clear {
  display: none;
}

button,
input[type="submit"] {
  display: inline-block;
  box-shadow: none;
  background-color: transparent;
  background: none;
  cursor: pointer;
}

input:focus,
input:active,
button:focus,
button:active {
  outline: none;
  box-shadow: none;
}

button::-moz-focus-inner {
  padding: 0;
  border: 0;
}

.wrap-load {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  min-height: calc(100vh - 80px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 100vh;
}

.vue-devtools__panel {
  display: none !important;
}

h1 {
  text-align: center;
}

.access-denied {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.access-denied-content {
  text-align: center;
  background: white;
  padding: 40px 30px;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 100%;
}

.lock-icon {
  font-size: 64px;
  margin-bottom: 20px;
  animation: pulse 2s infinite;
}

.access-denied-content h1 {
  color: #141414;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 15px;
}

.access-denied-content p {
  color: #666;
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 10px;
}

.access-denied-content .sub-text {
  font-size: 14px;
  color: #999;
  margin-top: 20px;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* Стили для страниц PIN-кода */
.pin-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background-color: #f5f5f5;
}

/* Фиксированный навбар */
.navbar-fixed {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

/* Глобальные анимации приложения */
.app-appear-enter-active {
  transition: all 1.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.app-appear-enter-from {
  opacity: 0;
  transform: translateY(100px) scale(0.9);
}

.navbar-appear-enter-active {
  transition: all 1.2s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: 0.5s;
}
.navbar-appear-enter-from {
  opacity: 0;
  transform: translateY(100px);
}

.page-transition-enter-active {
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}
.page-transition-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 1, 1);
}
.page-transition-enter-from {
  opacity: 0;
  transform: translateX(50px) scale(0.95);
}
.page-transition-leave-to {
  opacity: 0;
  transform: translateX(-30px) scale(0.98);
}

/* Обертка для контента с отступом снизу для навбара */
.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
}
</style>