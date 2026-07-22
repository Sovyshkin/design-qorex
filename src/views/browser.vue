<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useWalletStore } from "@/stores/walletStore.ts";
import {
  getAccessToken,
  getSavedBrowserUser,
  normalizeTelegramUser,
  saveBrowserAuth,
} from "@/utils/auth";

const router = useRouter();
const walletStore = useWalletStore();
const widgetRoot = ref(null);
const isLoading = ref(false);
const errorMessage = ref("");
const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "peekpay_bot";
const hasToken = computed(() => Boolean(getAccessToken()));

const loadUserSession = async (telegramUser) => {
  walletStore.userTg = normalizeTelegramUser(telegramUser);
  await walletStore.getUser();
  await walletStore.getPrice();
  router.replace({ name: "main" });
};

const onTelegramAuth = async (user) => {
  try {
    isLoading.value = true;
    errorMessage.value = "";

    const response = await axios.post("/auth/telegram", user, {
      headers: { "Content-Type": "application/json" },
    });

    const token = response.data?.access_token;
    if (!token) {
      throw new Error("Сервер не вернул токен авторизации");
    }

    saveBrowserAuth(token, user);
    await loadUserSession(user);
  } catch (error) {
    console.error("Browser Telegram auth failed:", error);
    errorMessage.value =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      "Не удалось войти через Telegram. Попробуйте ещё раз.";
  } finally {
    isLoading.value = false;
  }
};

const mountTelegramWidget = async () => {
  await nextTick();
  if (!widgetRoot.value || !botUsername) return;

  widgetRoot.value.innerHTML = "";
  window.onTelegramAuth = onTelegramAuth;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://telegram.org/js/telegram-widget.js?22";
  script.setAttribute("data-telegram-login", botUsername);
  script.setAttribute("data-size", "large");
  script.setAttribute("data-radius", "12");
  script.setAttribute("data-onauth", "onTelegramAuth(user)");
  script.setAttribute("data-request-access", "write");
  widgetRoot.value.appendChild(script);
};

const continueSession = async () => {
  const savedUser = getSavedBrowserUser();
  if (savedUser?.id) {
    await loadUserSession(savedUser);
  }
};

onMounted(async () => {
  if (hasToken.value) {
    await continueSession();
  }
  await mountTelegramWidget();
});

onBeforeUnmount(() => {
  if (window.onTelegramAuth === onTelegramAuth) {
    delete window.onTelegramAuth;
  }
});
</script>

<template>
  <main class="browser-auth">
    <section class="auth-panel">
      <img class="auth-logo" src="/assets/peekpay-logo-150.png" alt="PeekPay" />
      <div class="auth-copy">
        <h1>PeekPay</h1>
        <p>Войдите через Telegram, чтобы открыть браузерную версию кошелька.</p>
      </div>

      <div class="widget-box">
        <div ref="widgetRoot" class="telegram-widget"></div>
        <div v-if="isLoading" class="auth-status">Авторизация...</div>
        <div v-else-if="errorMessage" class="auth-error">{{ errorMessage }}</div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.browser-auth {
  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 24px 16px;
  background:
    radial-gradient(760px 320px at 50% -16%, rgba(37, 99, 235, 0.18), transparent 62%),
    #f1f5f9;
}

.auth-panel {
  width: min(100%, 390px);
  display: grid;
  justify-items: center;
  gap: 22px;
  padding: 34px 22px;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.12);
  text-align: center;
}

.auth-logo {
  width: 82px;
  height: 82px;
  border-radius: 24px;
  box-shadow: 0 14px 28px rgba(37, 99, 235, 0.18);
}

.auth-copy {
  display: grid;
  gap: 8px;
}

.auth-copy h1 {
  margin: 0;
  color: #0f172a;
  font-size: 32px;
  line-height: 1.1;
  font-weight: 800;
}

.auth-copy p {
  margin: 0;
  color: #64748b;
  font-size: 15px;
  line-height: 1.45;
}

.widget-box {
  min-height: 76px;
  display: grid;
  place-items: center;
  gap: 12px;
}

.telegram-widget {
  min-height: 44px;
  display: grid;
  place-items: center;
}

.auth-status,
.auth-error {
  max-width: 310px;
  font-size: 13px;
  line-height: 1.35;
  font-weight: 650;
}

.auth-status {
  color: #2563eb;
}

.auth-error {
  color: #dc2626;
}

:global(.dark-theme) .browser-auth {
  background:
    radial-gradient(760px 320px at 50% -16%, rgba(56, 130, 250, 0.2), transparent 62%),
    #0d1b2a;
}

:global(.dark-theme) .auth-panel {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(30, 39, 59, 0.94);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28);
}

:global(.dark-theme) .auth-copy h1 {
  color: #f8fafc;
}

:global(.dark-theme) .auth-copy p {
  color: #94a3b8;
}
</style>
