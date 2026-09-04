<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useWalletStore } from "@/stores/walletStore.ts";
import {
  clearBrowserAuth,
  getSavedBrowserUser,
  isTelegramWebView,
  normalizeTelegramUser,
  saveBrowserEmailAuth,
} from "@/utils/auth";

const router = useRouter();
const walletStore = useWalletStore();

const email = ref("");
const code = ref("");
const step = ref("email");
const isLoading = ref(false);
const errorMessage = ref("");
const pendingUser = ref(null);
const sentToEmail = ref("");

const normalizedEmail = computed(() => email.value.trim().toLowerCase());
const cleanedCode = computed(() => code.value.replace(/\D/g, "").slice(0, 6));
const isEmailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail.value));
const canSubmit = computed(() => {
  if (isLoading.value) return false;
  return step.value === "email" ? isEmailValid.value : cleanedCode.value.length === 6;
});

const actionText = computed(() => {
  if (isLoading.value) {
    return step.value === "email" ? "Отправляем код" : "Проверяем код";
  }

  return step.value === "email" ? "Получить код" : "Войти";
});

const getReferralId = () => {
  const url = new URL(window.location.href);
  const values = [
    url.searchParams.get("referal"),
    url.searchParams.get("referral"),
    url.searchParams.get("startapp"),
    url.searchParams.get("start"),
    url.hash,
  ].filter(Boolean);

  for (const value of values) {
    const match = String(value).match(/(?:ref(?:er(?:al|ral)?)?_?)?(\d{4,})/i);
    if (match?.[1]) return match[1];
  }

  return "";
};

const getNameFromEmail = (emailValue) => {
  const localPart = emailValue.split("@")[0] || "";
  const readableName = localPart.replace(/[._-]+/g, " ").trim();

  if (!readableName) return "Пользователь";

  return readableName.charAt(0).toUpperCase() + readableName.slice(1);
};

const buildEmailUserPayload = (emailValue) => {
  const username =
    emailValue
      .split("@")[0]
      ?.replace(/[^a-zA-Z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 32) || "email_user";
  const referralId = getReferralId();

  const payload = {
    first_name: getNameFromEmail(emailValue),
    last_name: "",
    username,
    email: emailValue,
    wallet: "",
    balance: "0",
    pincode: "",
    boolpin: false,
    tg_id: "",
    referal: Boolean(referralId),
    whoreferal: referralId || "",
    visibility_balance: true,
  };

  return payload;
};

const getGeneratedUserId = (data) => {
  if (typeof data === "string" || typeof data === "number") {
    const directValue = String(data).trim();
    const match = directValue.match(/\d{4,}/);
    return match?.[0] || directValue;
  }

  const candidates = [
    data?.tg_id,
    data?.id,
    data?.user_id,
    data?.user?.tg_id,
    data?.user?.id,
    data?.data?.tg_id,
    data?.data?.id,
    data?.result?.tg_id,
    data?.result?.id,
  ];

  const id = candidates.find((value) => value !== undefined && value !== null && String(value) !== "");
  return id ? String(id).trim() : "";
};

const getBackendMessage = (error) => {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.response?.data ||
    error?.message ||
    ""
  );
};

const registerEmailUser = async (emailValue) => {
  const payload = buildEmailUserPayload(emailValue);
  const response = await axios.post("/new_user_e", payload, { timeout: 45000 });
  const id = getGeneratedUserId(response.data);

  if (!id) {
    throw new Error("Сервер не вернул id пользователя");
  }

  return normalizeTelegramUser({
    ...payload,
    id,
  });
};

const checkCodeTimer = async (emailValue) => {
  await axios.patch(`/check_timer_code?email=${encodeURIComponent(emailValue)}`, null, {
    timeout: 30000,
  });
};

const requestCode = async () => {
  if (!isEmailValid.value) {
    errorMessage.value = "Введите корректный email.";
    return;
  }

  isLoading.value = true;
  errorMessage.value = "";

  try {
    const user = await registerEmailUser(normalizedEmail.value);
    pendingUser.value = user;
    sentToEmail.value = normalizedEmail.value;
    await axios.patch(`/send_code?email=${encodeURIComponent(normalizedEmail.value)}`, null, {
      timeout: 30000,
    });
    step.value = "code";
    code.value = "";
  } catch (error) {
    const isTimeout = error.code === "ECONNABORTED" || /timeout/i.test(String(error.message || ""));
    errorMessage.value =
      getBackendMessage(error) ||
      (isTimeout
        ? "Сервер не ответил. Попробуйте ещё раз через несколько секунд."
        : "Не удалось отправить код. Попробуйте ещё раз.");
  } finally {
    isLoading.value = false;
  }
};

const confirmCode = async () => {
  const user = pendingUser.value;

  if (!user?.id) {
    step.value = "email";
    errorMessage.value = "Сначала запросите код на email.";
    return;
  }

  if (cleanedCode.value.length !== 6) {
    errorMessage.value = "Введите 6 цифр из письма.";
    return;
  }

  isLoading.value = true;
  errorMessage.value = "";

  try {
    await checkCodeTimer(sentToEmail.value);
    await axios.patch(
      `/check_code?email=${encodeURIComponent(sentToEmail.value)}&code=${encodeURIComponent(
        cleanedCode.value
      )}&tg_id=${encodeURIComponent(user.id)}`,
      null,
      { timeout: 30000 }
    );

    saveBrowserEmailAuth(user);
    walletStore.userTg = normalizeTelegramUser(user);
    walletStore.user = {};
    await walletStore.getUser();
    await walletStore.getPrice();
    router.replace({ name: "main" });
  } catch (error) {
    const isTimeout = error.code === "ECONNABORTED" || /timeout/i.test(String(error.message || ""));
    errorMessage.value =
      getBackendMessage(error) ||
      (isTimeout
        ? "Сервер проверки не ответил. Попробуйте ещё раз."
        : error?.config?.url?.includes("/check_timer_code")
          ? "Время действия кода истекло. Запросите новый код."
        : "Код не подошёл. Проверьте письмо и попробуйте снова.");
  } finally {
    isLoading.value = false;
  }
};

const submit = () => {
  if (step.value === "email") {
    requestCode();
    return;
  }

  confirmCode();
};

const editEmail = () => {
  step.value = "email";
  code.value = "";
  errorMessage.value = "";
};

onMounted(async () => {
  if (isTelegramWebView()) {
    router.replace({ name: "main", query: { auth: "telegram_missing" } });
    return;
  }

  const isReauth = new URLSearchParams(window.location.search).get("reauth") === "1";
  if (isReauth) {
    clearBrowserAuth();
    return;
  }

  const savedUser = getSavedBrowserUser();
  if (savedUser?.id) {
    walletStore.userTg = normalizeTelegramUser(savedUser);
    await walletStore.getUser();
    await walletStore.getPrice();
    router.replace({ name: "main" });
  }
});
</script>

<template>
  <main class="browser-auth">
    <section class="auth-panel">
      <img class="auth-logo" src="/assets/peekpay-logo-150.png" alt="PeekPay" />

      <div class="auth-copy">
        <h1>PeekPay</h1>
        <p>Войдите по email, чтобы открыть браузерную версию кошелька.</p>
      </div>

      <form class="email-auth-form" @submit.prevent="submit">
        <label v-if="step === 'email'" class="auth-field">
          <span>Email</span>
          <input
            v-model="email"
            type="email"
            inputmode="email"
            autocomplete="email"
            placeholder="name@example.com"
            :disabled="isLoading"
          />
        </label>

        <div v-else class="code-step">
          <button class="email-chip" type="button" :disabled="isLoading" @click="editEmail">
            {{ sentToEmail }}
          </button>
          <label class="auth-field">
            <span>Код из письма</span>
            <input
              :value="cleanedCode"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="6"
              placeholder="000000"
              :disabled="isLoading"
              @input="code = $event.target.value"
            />
          </label>
        </div>

        <button class="auth-button" type="submit" :disabled="!canSubmit">
          <span v-if="isLoading" class="auth-spinner"></span>
          <span>{{ actionText }}</span>
        </button>

        <p v-if="step === 'code'" class="auth-hint">
          Мы отправили одноразовый код на почту. Введите его, чтобы завершить вход.
        </p>
        <p v-if="errorMessage" class="auth-error">{{ errorMessage }}</p>
      </form>
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
  background: #1e273bf5 !important;
  background-color: #1e273bf5 !important;
}

:global(.standalone-shell.pin-page--standalone:has(.browser-auth)),
:global(.pin-page--standalone:has(.browser-auth)),
:global(body main.browser-auth),
:global(body .browser-auth) {
  background: #1e273bf5 !important;
  background-color: #1e273bf5 !important;
}

.auth-panel {
  width: min(100%, 390px);
  display: grid;
  justify-items: center;
  gap: 22px;
  padding: 34px 22px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  background: #1c1c1c;
  box-shadow:
    0 26px 76px rgba(15, 23, 42, 0.38),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  text-align: center;
}

.auth-logo {
  width: 82px;
  height: 82px;
  border-radius: 24px;
  box-shadow: 0 16px 32px rgba(37, 99, 235, 0.26);
}

.auth-copy {
  display: grid;
  gap: 8px;
}

.auth-copy h1 {
  margin: 0;
  color: #f8fafc;
  font-size: 32px;
  line-height: 1.1;
  font-weight: 800;
}

.auth-copy p {
  max-width: 300px;
  margin: 0;
  color: #a8b3c7;
  font-size: 15px;
  line-height: 1.45;
}

.email-auth-form {
  width: 100%;
  display: grid;
  gap: 14px;
}

.auth-field {
  display: grid;
  gap: 8px;
  text-align: left;
}

.auth-field span {
  color: #60a5fa;
  font-size: 12px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.auth-field input {
  width: 100%;
  min-height: 54px;
  padding: 0 16px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.46);
  color: #f8fafc;
  font-size: 17px;
  line-height: 22px;
  font-weight: 700;
  caret-color: #60a5fa;
}

.auth-field input::placeholder {
  color: rgba(168, 179, 199, 0.55);
}

.auth-field input:focus {
  border-color: rgba(96, 165, 250, 0.68);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.16);
}

.code-step {
  display: grid;
  gap: 12px;
}

.email-chip {
  justify-self: center;
  max-width: 100%;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(96, 165, 250, 0.12);
  color: #bfdbfe;
  font-size: 13px;
  line-height: 18px;
  font-weight: 700;
}

.auth-button {
  min-height: 56px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 16px;
  background:
    linear-gradient(135deg, rgba(84, 169, 235, 0.96), rgba(59, 130, 246, 0.96)),
    linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  background-size: 100% 100%, 180% 100%;
  color: #ffffff;
  box-shadow:
    0 16px 34px rgba(37, 99, 235, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.22);
  transition:
    transform 0.18s ease,
    opacity 0.18s ease,
    box-shadow 0.18s ease;
}

.auth-button:disabled {
  cursor: default;
  opacity: 0.55;
  box-shadow: none;
}

.auth-button:not(:disabled):active {
  transform: translateY(1px) scale(0.99);
}

.auth-button span {
  color: #ffffff;
  font-size: 16px;
  line-height: 18px;
  font-weight: 800;
}

.auth-button:has(.auth-spinner) {
  animation: authButtonPulse 1.45s ease-in-out infinite;
}

.auth-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.32);
  border-top-color: #ffffff;
  border-radius: 999px;
  animation: authSpinner 0.75s linear infinite;
}

.auth-hint,
.auth-error {
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
  font-weight: 650;
}

.auth-hint {
  color: #93c5fd;
}

.auth-error {
  color: #fca5a5;
}

@keyframes authSpinner {
  to {
    transform: rotate(360deg);
  }
}

@keyframes authButtonPulse {
  0%,
  100% {
    box-shadow:
      0 16px 34px rgba(37, 99, 235, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.22);
  }

  50% {
    box-shadow:
      0 20px 44px rgba(59, 130, 246, 0.44),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
}

@media (max-width: 420px) {
  .auth-panel {
    padding: 30px 18px;
  }

  .auth-copy h1 {
    font-size: 30px;
  }
}
</style>
