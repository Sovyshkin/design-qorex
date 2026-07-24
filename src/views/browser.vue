<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useWalletStore } from "@/stores/walletStore.ts";
import {
  getAccessToken,
  getSavedBrowserUser,
  isTelegramWebView,
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
let widgetObserver = null;

const logBrowserAuth = (label, payload = {}) => {
  console.log(`[PeekPay Browser Auth] ${label}`, {
    ...payload,
    botUsername,
    href: window.location.href,
    origin: window.location.origin,
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    pathname: window.location.pathname,
    userAgent: navigator.userAgent,
    hasTelegramObject: Boolean(window.Telegram),
    hasTelegramWebApp: Boolean(window.Telegram?.WebApp),
    telegramPlatform: window.Telegram?.WebApp?.platform,
    telegramInitDataLength: window.Telegram?.WebApp?.initData?.length || 0,
  });
};

const inspectWidgetDom = (reason = "inspect") => {
  if (!widgetRoot.value) return;

  const iframe = widgetRoot.value.querySelector("iframe");
  const script = widgetRoot.value.querySelector("script");
  logBrowserAuth(`widget DOM ${reason}`, {
    rootText: widgetRoot.value.innerText || "",
    rootHtmlLength: widgetRoot.value.innerHTML.length,
    hasScript: Boolean(script),
    scriptSrc: script?.src || "",
    hasIframe: Boolean(iframe),
    iframeSrc: iframe?.src || "",
    iframeTitle: iframe?.title || "",
  });
};

const handleWidgetMessage = (event) => {
  const origin = String(event.origin || "");
  if (!origin.includes("telegram.org") && !origin.includes("oauth.telegram.org")) return;

  logBrowserAuth("message from Telegram widget", {
    messageOrigin: event.origin,
    messageData: event.data,
  });
};

const loadUserSession = async (telegramUser) => {
  logBrowserAuth("load user session", {
    telegramUserId: telegramUser?.id,
    telegramUsername: telegramUser?.username,
  });
  walletStore.userTg = normalizeTelegramUser(telegramUser);
  await walletStore.getUser();
  await walletStore.getPrice();
  router.replace({ name: "main" });
};

const onTelegramAuth = async (user) => {
  try {
    isLoading.value = true;
    errorMessage.value = "";
    logBrowserAuth("Telegram widget auth callback", {
      user,
      hasHash: Boolean(user?.hash),
      authDate: user?.auth_date,
    });

    const response = await axios.post("/auth/telegram", user, {
      headers: { "Content-Type": "application/json" },
    });
    logBrowserAuth("backend /auth/telegram response", {
      status: response.status,
      hasToken: Boolean(response.data?.access_token),
      responseKeys: Object.keys(response.data || {}),
    });

    const token = response.data?.access_token;
    if (!token) {
      throw new Error("Сервер не вернул токен авторизации");
    }

    saveBrowserAuth(token, user);
    await loadUserSession(user);
  } catch (error) {
    console.error("Browser Telegram auth failed:", error);
    logBrowserAuth("backend /auth/telegram failed", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
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
  logBrowserAuth("mount widget requested", {
    hasWidgetRoot: Boolean(widgetRoot.value),
    envBotUsername: import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "",
  });

  if (!widgetRoot.value || !botUsername) {
    logBrowserAuth("mount widget skipped", {
      hasWidgetRoot: Boolean(widgetRoot.value),
      hasBotUsername: Boolean(botUsername),
    });
    return;
  }

  widgetRoot.value.innerHTML = "";
  window.onTelegramAuth = onTelegramAuth;
  window.addEventListener("message", handleWidgetMessage);

  if (widgetObserver) {
    widgetObserver.disconnect();
  }

  widgetObserver = new MutationObserver(() => inspectWidgetDom("changed"));
  widgetObserver.observe(widgetRoot.value, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://telegram.org/js/telegram-widget.js?22";
  script.setAttribute("data-telegram-login", botUsername);
  script.setAttribute("data-size", "large");
  script.setAttribute("data-radius", "12");
  script.setAttribute("data-onauth", "onTelegramAuth(user)");
  script.setAttribute("data-request-access", "write");
  script.onload = () => {
    logBrowserAuth("Telegram widget script loaded");
    setTimeout(() => inspectWidgetDom("after script load + 300ms"), 300);
    setTimeout(() => inspectWidgetDom("after script load + 1500ms"), 1500);
  };
  script.onerror = (event) => {
    logBrowserAuth("Telegram widget script failed", { event });
  };
  logBrowserAuth("Telegram widget script append", {
    dataTelegramLogin: script.getAttribute("data-telegram-login"),
    dataOnauth: script.getAttribute("data-onauth"),
    dataRequestAccess: script.getAttribute("data-request-access"),
    src: script.src,
  });
  widgetRoot.value.appendChild(script);
  inspectWidgetDom("after append");
};

const continueSession = async () => {
  const savedUser = getSavedBrowserUser();
  logBrowserAuth("continue saved session", {
    hasSavedUser: Boolean(savedUser?.id),
    savedUserId: savedUser?.id,
  });
  if (savedUser?.id) {
    await loadUserSession(savedUser);
  }
};

onMounted(async () => {
  logBrowserAuth("page mounted", {
    hasToken: hasToken.value,
    isTelegramWebView: isTelegramWebView(),
    expectedBotFatherDomain: window.location.hostname,
  });

  if (isTelegramWebView()) {
    logBrowserAuth("redirect Telegram WebView away from browser login");
    router.replace({ name: "main", query: { auth: "telegram_missing" } });
    return;
  }

  if (hasToken.value) {
    await continueSession();
  }
  await mountTelegramWidget();
});

onBeforeUnmount(() => {
  if (window.onTelegramAuth === onTelegramAuth) {
    delete window.onTelegramAuth;
  }
  window.removeEventListener("message", handleWidgetMessage);
  if (widgetObserver) {
    widgetObserver.disconnect();
    widgetObserver = null;
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
