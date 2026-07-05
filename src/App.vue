<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import NavBar from "./components/NavBar.vue";
import AppLoader from "./components/AppLoader.vue";
import AppMessage from "./components/AppMessage.vue";
import { useWalletStore } from "@/stores/walletStore.ts";
import { logThemeSnapshot } from "@/utils/pageDebug";

const router = useRouter();
const walletStore = useWalletStore();
const accessDenied = ref(false);
let bodyClassObserver = null;

// Список публичных маршрутов, которые не требуют аутентификации
const publicRoutes = ["enterPin", "createPin"];

// Упрощенный router guard - только для базовой навигации
router.beforeEach(async (to, from, next) => {
  try {
    console.log("[PeekPay Router beforeEach]", {
      from: { name: from.name, path: from.fullPath },
      to: { name: to.name, path: to.fullPath },
      storeLoading: walletStore.isLoading,
    });

    // Разрешаем навигацию к PIN маршрутам
    if (to.name === "enterPin" || to.name === "createPin") {
      walletStore.isLoading = false;
      return next();
    }

    // Если пользователь пытается попасть на createPin, но PIN уже есть
    if (to.name === "createPin" && walletStore.hasPinCode()) {
      walletStore.isLoading = false;
      return next({ name: "main" });
    }

    next();
  } catch (error) {
    console.error("Router guard error:", error);
    next();
  } finally {
    walletStore.isLoading = false;
    console.log("[PeekPay Router beforeEach done]", {
      to: { name: to.name, path: to.fullPath },
      storeLoading: walletStore.isLoading,
    });
  }
});

// Функция проверки доступа по белому списку
const checkAccessByWhitelist = (userId) => {
  const allowedIds = import.meta.env.VITE_ALLOWED_TELEGRAM_IDS;

  if (!allowedIds || allowedIds.trim() === "") {
    return true;
  }

  const allowedIdsArray = allowedIds.split(",").map((id) => id.trim());
  return allowedIdsArray.includes(String(userId));
};

// Флаг для предотвращения повторной инициализации
const isAppInitialized = ref(false);

// Функция для инициализации приложения
const initializeApp = async () => {
  try {
    await walletStore.getUserInfo();

    if (window.Telegram && window.Telegram.WebApp) {
      if (walletStore.userTg && walletStore.userTg.id) {
        if (!checkAccessByWhitelist(walletStore.userTg.id)) {
          accessDenied.value = true;
          walletStore.isLoading = false;
          return;
        }
        await walletStore.getUser();
        await walletStore.getPrice();

        // Проверяем PIN только при запуске приложения
        if (walletStore.hasPinCode() && walletStore.isPinRequired()) {
          // Удаляем статус верификации только если требуется PIN
          localStorage.removeItem("pinVerified");
          const currentRoute = router.currentRoute.value;
          router.push({
            name: "enterPin",
            query: { returnTo: currentRoute.fullPath },
          });
          return; // Не сбрасываем isLoading если перенаправляем на PIN
        }
      }
    }

    // Завершаем загрузку если не требуется PIN
    walletStore.isLoading = false;
  } catch (err) {
    console.error("Ошибка инициализации приложения:", err);
    walletStore.isLoading = false; // Завершаем загрузку при ошибке
  } finally {
    isAppInitialized.value = true;
  }
};

onMounted(() => {
  initializeApp();
  nextTick(() => {
    logThemeSnapshot("App mounted", {
      route: router.currentRoute.value.fullPath,
      showMainShell: showMainShell.value,
      showContent: showContent.value,
    });
  });

  if (typeof document !== "undefined") {
    bodyClassObserver = new MutationObserver(() => {
      logThemeSnapshot("Body class mutated", {
        route: router.currentRoute.value.fullPath,
        showMainShell: showMainShell.value,
        showContent: showContent.value,
      });
    });

    bodyClassObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }
});

// Компьютед свойство для отображения контента
const showContent = computed(() => {
  const currentRoute = router.currentRoute.value;
  return !publicRoutes.includes(currentRoute.name);
});

const shelllessRoutes = ["enterPin", "createPin", "twoFactorAuth"];
const standaloneLoaderRoutes = ["enterPin", "createPin"];

const showMainShell = computed(() => {
  const currentRoute = router.currentRoute.value;
  return !shelllessRoutes.includes(currentRoute.name);
});

const shouldShowStandaloneLoader = computed(() => {
  const currentRoute = router.currentRoute.value;
  return (
    standaloneLoaderRoutes.includes(currentRoute.name) &&
    walletStore.isLoading
  );
});

const isTwoFactorStandaloneRoute = computed(
  () => router.currentRoute.value.name === "twoFactorAuth"
);

const usesEmbeddedNav = computed(
  () => router.currentRoute.value.name === "deposit"
);

const standaloneShellStyle = computed(() =>
  walletStore.isDarkTheme
    ? {
        background:
          "radial-gradient(760px 340px at 50% -16%, rgba(37, 98, 235, 0.2), transparent 62%), linear-gradient(180deg, #07111f 0%, #0d1b2a 100%)",
      }
    : {
        background:
          "radial-gradient(820px 360px at 50% -18%, #dbeafe 0%, transparent 62%), #f1f5f9",
      }
);

const shouldShowGlobalLoader = computed(() => {
  const currentRoute = router.currentRoute.value;
  const nonBlockingRoutes = ["deposit", "transfer", "withdraw", "safety"];
  return (
    !isAppInitialized.value &&
    walletStore.isLoading &&
    !nonBlockingRoutes.includes(currentRoute.name)
  );
});

const currentRouteKey = computed(() => router.currentRoute.value.fullPath);

const resetAppScroll = () => {
  try {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  } catch (_error) {}

  try {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    document.scrollingElement && (document.scrollingElement.scrollTop = 0);
  } catch (_error) {}

  const selectors = [
    ".content-wrapper",
    ".standalone-shell",
    ".pin-page--standalone",
    ".wrapper",
    ".tfa-flow",
    ".tfa-flow__surface",
  ];

  selectors.forEach((selector) => {
    const element = document.querySelector(selector);
    if (element) {
      element.scrollTop = 0;
    }
  });
};

watch(
  () => ({
    routeName: router.currentRoute.value.name,
    routePath: router.currentRoute.value.fullPath,
    storeLoading: walletStore.isLoading,
    showContent: showContent.value,
    showMainShell: showMainShell.value,
    shouldShowGlobalLoader: shouldShowGlobalLoader.value,
  }),
  (state) => {
    console.log("[PeekPay App Render State]", state);
  },
  { immediate: true }
);

watch(
  () => router.currentRoute.value.fullPath,
  async (fullPath) => {
    await nextTick();
    resetAppScroll();
    logThemeSnapshot("Route changed", {
      route: fullPath,
      routeName: router.currentRoute.value.name,
      showMainShell: showMainShell.value,
      showContent: showContent.value,
      isLoading: walletStore.isLoading,
    });
    setTimeout(() => {
      resetAppScroll();
      logThemeSnapshot("Route changed + 300ms", {
        route: fullPath,
        routeName: router.currentRoute.value.name,
      });
    }, 300);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resetAppScroll();
      });
    });
  }
);

onBeforeUnmount(() => {
  if (bodyClassObserver) {
    bodyClassObserver.disconnect();
    bodyClassObserver = null;
  }
});
</script>

<template>
  <main class="wrapper">
    <AppMessage />

    <!-- Экран блокировки доступа -->
    <div class="access-denied" v-if="accessDenied">
      <div class="access-denied-content">
        <div class="lock-icon">🔒</div>
        <h1>Доступ ограничен</h1>
        <p>Приложение находится в режиме тестирования.</p>
        <p class="sub-text">
          Доступ разрешен только авторизованным пользователям.
        </p>
      </div>
    </div>

    <template v-else>
      <!-- Отображаем страницы PIN/2FA без общей оболочки и нижнего навбара -->
      <div
        v-if="!showMainShell"
        :key="`standalone-${currentRouteKey}-${walletStore.isDarkTheme ? 'dark' : 'light'}`"
        class="standalone-shell pin-page--standalone"
        :class="{ 'standalone-shell--two-factor': isTwoFactorStandaloneRoute }"
        :style="standaloneShellStyle"
      >
        <div class="wrap-load" v-if="shouldShowStandaloneLoader">
          <AppLoader />
        </div>
        <router-view v-else v-slot="{ Component }">
          <component :is="Component" :key="currentRouteKey" />
        </router-view>
      </div>

      <!-- Отображаем основной контент с навбаром -->
      <div v-else :key="`shell-branch-${currentRouteKey}`">
        <div class="content-wrapper" :key="`shell-${currentRouteKey}`">
          <div class="wrap-load" v-if="shouldShowGlobalLoader">
            <AppLoader />
          </div>
          <router-view v-else v-slot="{ Component }">
            <component :is="Component" :key="currentRouteKey" />
          </router-view>
        </div>
        <NavBar v-if="!usesEmbeddedNav" class="navbar-fixed" />
      </div>
    </template>
  </main>
</template>

<style>
#app {
  font-family: "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  width: 100%;
  background-color: #fff;
  height: 100vh;
}

* {
  padding: 0px;
  margin: 0px;
  border: none;
  font-family: "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 20px;
  letter-spacing: 0;
  color: #1c1c1c;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
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
  background-color: var(--background, #f1f5f9);
}

body.dark-theme,
body.dark-theme #app {
  background-color: var(--background, #0d1b2a) !important;
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
  caret-color: #000000;
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

/* Глобальные стили для disabled кнопок - защита от спама */
button:disabled,
input[type="submit"]:disabled,
.btn:disabled {
  opacity: 0.5 !important;
  cursor: not-allowed !important;
  pointer-events: none !important;
  background-color: var(--border, #e2e8f0) !important;
}

button:disabled:hover,
input[type="submit"]:disabled:hover,
.btn:disabled:hover {
  background-color: var(--border, #e2e8f0) !important;
  color: var(--textSecondary, #64748b) !important;
  border-color: var(--border, #e2e8f0) !important;
  transform: none !important;
}

body.dark-theme button:disabled,
body.dark-theme input[type="submit"]:disabled,
body.dark-theme .btn:disabled {
  background-color: rgba(255, 255, 255, 0.08) !important;
  color: rgba(255, 255, 255, 0.4) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
}

body.dark-theme button:disabled:hover,
body.dark-theme input[type="submit"]:disabled:hover,
body.dark-theme .btn:disabled:hover {
  background-color: rgba(255, 255, 255, 0.08) !important;
  color: rgba(255, 255, 255, 0.4) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
}

.wrap-load {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  min-height: calc(100vh - 80px);
}

body.dark-theme .wrap-load {
  background-color: var(--background, #0d1b2a) !important;
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
  0%,
  100% {
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
  background-color: var(--background, #f1f5f9);
}

.standalone-shell,
.pin-page--standalone {
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  height: auto;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  overflow-x: hidden;
  overflow-y: auto;
  background:
    radial-gradient(820px 360px at 50% -18%, #dbeafe 0%, transparent 62%),
    #f1f5f9;
}

.standalone-shell,
.standalone-shell *,
.standalone-shell *::before,
.standalone-shell *::after,
.pin-page--standalone,
.pin-page--standalone *,
.pin-page--standalone *::before,
.pin-page--standalone *::after {
  animation: none !important;
  transition: none !important;
}

.standalone-shell .tfa-flow,
.standalone-shell .tfa-flow__surface,
.standalone-shell .tfa-flow__stack,
.standalone-shell .tfa-flow__card,
.standalone-shell .tfa-flow__state-card,
.standalone-shell .tfa-flow__header,
.standalone-shell .tfa-flow__qr-shell,
.standalone-shell .tfa-flow__button,
.standalone-shell .back-button,
.pin-page--standalone .tfa-flow,
.pin-page--standalone .tfa-flow__surface,
.pin-page--standalone .tfa-flow__stack,
.pin-page--standalone .tfa-flow__card,
.pin-page--standalone .tfa-flow__state-card,
.pin-page--standalone .tfa-flow__header,
.pin-page--standalone .tfa-flow__qr-shell,
.pin-page--standalone .tfa-flow__button,
.pin-page--standalone .back-button {
  opacity: 1 !important;
  visibility: visible !important;
  transform: none !important;
  filter: none !important;
}

body.dark-theme .standalone-shell,
body.dark-theme .pin-page--standalone {
  background:
    radial-gradient(760px 340px at 50% -16%, rgba(37, 98, 235, 0.2), transparent 62%),
    linear-gradient(180deg, #07111f 0%, #0d1b2a 100%) !important;
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
  overflow-y: auto; /* Добавляем прокрутку для маленьких экранов */
  -webkit-overflow-scrolling: touch; /* Плавная прокрутка на iOS */
}

/* Исправления для маленьких экранов */
@media (max-height: 600px) {
  .content-wrapper {
    padding-bottom: 80px; /* Дополнительный отступ для навбара на маленьких экранах */
  }
}

/* Fintech blue/white design system */
:root {
  --primary-blue: #2563eb;
  --deep-blue: #1e40af;
  --light-blue: #3b82f6;
  --app-bg: #f1f5f9;
  --card-bg: #ffffff;
  --text-dark: #0f172a;
  --text-muted: #64748b;
  --success: #10b981;
  --danger: #ef4444;
  --card-border: #e2e8f0;
  --wallet-radius-lg: 24px;
  --wallet-radius-md: 16px;
  --wallet-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
  --wallet-shadow-blue: 0 14px 30px rgba(37, 99, 235, 0.26);
  --wallet-gradient: linear-gradient(135deg, #3b82f6 0%, #2563eb 45%, #1e40af 100%);
}

body,
#app {
  background: var(--app-bg) !important;
  color: var(--text-dark);
}

.container,
.profile,
.page-container,
.payment-page,
.transaction-page {
  background: var(--app-bg);
}

.card,
.list-item,
.history-item,
.coin,
.form-container,
.deposit-container,
.withdraw-container,
.transfer-container,
.input-section,
.wallet-address {
  background: var(--card-bg) !important;
  border: 1px solid var(--card-border) !important;
  border-radius: 18px !important;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08) !important;
}

.btn,
button.btn,
.btn-primary {
  min-height: 50px;
  border-radius: 16px !important;
  background: linear-gradient(135deg, var(--primary-blue), var(--deep-blue)) !important;
  color: #fff !important;
  font-weight: 600 !important;
}

.btn-secondary {
  background: #eff6ff !important;
  border: 1px solid #dbeafe !important;
  color: var(--primary-blue) !important;
}

input:not([type="checkbox"]):not([type="radio"]),
textarea,
select {
  background: #f8fafc !important;
  border: 1px solid #dbe3ef !important;
  border-radius: 14px !important;
  color: var(--text-dark) !important;
}

input:focus,
textarea:focus,
select:focus {
  border-color: var(--light-blue) !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12) !important;
}

/* Reference-matched wallet UI layer */
.content-wrapper {
  background:
    radial-gradient(900px 420px at 50% -18%, rgba(219, 234, 254, 0.9), transparent 60%),
    var(--app-bg);
}

.header,
.payment-header,
.failed-header,
.history-header,
.home-header {
  min-height: 64px !important;
  padding: 16px !important;
  background: transparent !important;
}

.header h1,
.payment-header h1,
.failed-header h1,
.history-header h1 {
  color: var(--text-dark) !important;
  font-size: 20px !important;
  line-height: 24px !important;
  font-weight: 600 !important;
  letter-spacing: 0 !important;
}

.arrow {
  width: 24px !important;
  height: 24px !important;
  opacity: 0.92;
}

.container,
.transaction-content,
.history-content,
.content,
.profile-page,
.home-content {
  padding-inline: 16px !important;
  padding-bottom: 124px !important;
  background: transparent !important;
}

.form-container,
.wallet-card,
.transaction-details,
.payment-shell,
.profile-list,
.profile-user,
.sheet-card,
.failed-card,
.assets-block,
.card,
.modal,
.modal-content,
.payment-modal,
.withdraw-success-modal {
  background: rgba(255, 255, 255, 0.98) !important;
  border: 1px solid var(--card-border) !important;
  border-radius: var(--wallet-radius-lg) !important;
  box-shadow: var(--wallet-shadow) !important;
}

.form-container {
  width: 100% !important;
  margin: 0 !important;
  padding: 16px !important;
  gap: 14px !important;
  overflow: visible !important;
}

.form-container::before,
.payment-modal::before,
.amount-modal::before {
  display: none !important;
}

.form-container h3,
.network-selector h3,
.code-input-section h4,
.fees-header h4,
.section-header h3 {
  margin: 0 0 4px !important;
  color: var(--text-dark) !important;
  font-size: 15px !important;
  line-height: 20px !important;
  font-weight: 600 !important;
  text-align: left !important;
}

input:not([type="checkbox"]):not([type="radio"]),
textarea,
select,
.code-input,
.amount-input {
  min-height: 54px !important;
  padding: 0 14px !important;
  border-radius: var(--wallet-radius-md) !important;
  border: 1px solid #dbe3ef !important;
  background: #f8fafc !important;
  box-shadow: none !important;
  color: var(--text-dark) !important;
  font-size: 15px !important;
  font-weight: 500 !important;
}

input::placeholder,
textarea::placeholder {
  color: #94a3b8 !important;
}

.group {
  min-height: 54px !important;
  border: 1px solid #dbe3ef !important;
  border-radius: var(--wallet-radius-md) !important;
  background: #f8fafc !important;
  overflow: hidden !important;
}

.group input {
  border: 0 !important;
  background: transparent !important;
}

.group-item,
.currency-label {
  color: var(--text-dark) !important;
  font-size: 14px !important;
  font-weight: 600 !important;
}

.btn,
button.btn,
.btn-primary,
.cta,
.modal-btn,
.modal-close-btn,
.payment-method-btn.primary,
.submit-btn {
  min-height: 54px !important;
  border-radius: var(--wallet-radius-md) !important;
  background: var(--wallet-gradient) !important;
  color: #fff !important;
  box-shadow: var(--wallet-shadow-blue) !important;
  font-size: 15px !important;
  line-height: 20px !important;
  font-weight: 600 !important;
}

.btn *,
.btn-primary *,
.cta * {
  color: #fff !important;
}

.btn-secondary,
.secondary,
.ghost,
.cancel-btn,
.payment-cancel-btn,
.option,
.network,
.network-item,
.profile-row,
.detail-item {
  border-radius: 16px !important;
}

.network-item,
.network,
.payment-method-btn,
.option,
.profile-row,
.detail-item,
.wallet-address,
.fees-info,
.memo-container {
  background: #fff !important;
  border: 1px solid #e2e8f0 !important;
  box-shadow: none !important;
}

.network-item.active,
.network.active {
  background: #eff6ff !important;
  border-color: #3b82f6 !important;
}

.network-icon,
.wrap-img,
.icon-wrap,
.row-icon,
.method-icon,
.asset-icon {
  background: #eff6ff !important;
  color: var(--primary-blue) !important;
  border-radius: 50% !important;
}

.network-name,
.list-value,
.detail-value,
.wallet-number,
.balance-value,
.amount-number,
.method-title {
  color: var(--text-dark) !important;
  font-weight: 600 !important;
}

.memo-note,
.detail-label,
.wallet-label,
.fee-label,
.amount-label,
.method-description,
.modal-subtitle {
  color: var(--text-muted) !important;
  opacity: 1 !important;
}

.transaction-page {
  background: var(--app-bg) !important;
}

.transaction-header {
  gap: 14px !important;
  padding-top: 4px !important;
}

.transaction-header .wrap-img {
  width: 72px !important;
  height: 72px !important;
  display: grid !important;
  place-items: center !important;
  background: var(--wallet-gradient) !important;
  box-shadow: var(--wallet-shadow-blue) !important;
}

.transaction-header .wrap-img img {
  width: 32px !important;
  height: 32px !important;
  filter: brightness(0) invert(1) !important;
}

.amount-usdt {
  color: var(--text-dark) !important;
  font-size: 28px !important;
  line-height: 32px !important;
  font-weight: 600 !important;
}

.amount-rub {
  color: var(--text-muted) !important;
  opacity: 1 !important;
  font-size: 14px !important;
}

.status-badge,
.state,
.history-status {
  border-radius: 999px !important;
  padding: 4px 9px !important;
  font-size: 11px !important;
  font-weight: 600 !important;
}

.success {
  color: var(--success) !important;
}

.error {
  color: var(--danger) !important;
}

.in_processing {
  color: var(--primary-blue) !important;
}

.payment-modal-overlay,
.modal-overlay,
.withdraw-success-overlay {
  background: rgba(15, 23, 42, 0.42) !important;
  backdrop-filter: blur(10px) !important;
}

.payment-modal,
.amount-modal,
.paste-link-modal,
.withdraw-success-modal {
  max-width: 392px !important;
  padding: 18px !important;
  border-radius: 24px !important;
}

.success-animation,
.checkmark-container,
.icon {
  filter: none !important;
}

.checkmark-circle,
.checkmark-check {
  stroke: var(--primary-blue) !important;
}

.scanner-page .qr-scanner-fullscreen,
.scanner-page .app-scanner-container {
  background: transparent !important;
}

.scanner-page .scanner-frame,
.scanner-page .scan-container,
.scanner-page .camera-container,
.scanner-page .qr-video-container {
  border-radius: 24px !important;
  border: 1px solid var(--card-border) !important;
  box-shadow: var(--wallet-shadow) !important;
}

.toggle-container {
  background: #eff6ff !important;
  border: 1px solid #dbeafe !important;
  border-radius: 16px !important;
}

.theme-option {
  min-height: 42px !important;
  border-radius: 12px !important;
}

.slider {
  border-radius: 12px !important;
  box-shadow: 0 6px 14px rgba(37, 99, 235, 0.12) !important;
}

@media (max-width: 380px) {
  .container,
  .transaction-content,
  .history-content,
  .content,
  .profile-page,
  .home-content {
    padding-inline: 12px !important;
  }

  .hero-balance h2 {
    font-size: 36px !important;
  }
}
</style>
