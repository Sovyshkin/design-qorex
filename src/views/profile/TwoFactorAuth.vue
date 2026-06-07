<script setup>
import { ref, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useWalletStore } from "@/stores/walletStore.ts";
import { useRouter } from "vue-router";
import AppLoader from "@/components/AppLoader.vue";

const { t } = useI18n();
const walletStore = useWalletStore();
const router = useRouter();

const step = ref(1); // 1 - показ QR, 2 - ввод кода
const qrImage = ref("");
const loading = ref(true);
const error = ref("");
// Корректный src для QR-кода
const qrSrc = computed(() => {
  if (!qrImage.value) return "";
  if (qrImage.value.startsWith("data:image")) return qrImage.value;
  return `data:image/png;base64,${qrImage.value}`;
});
const authKey = ref("");
const otpauthUrl = ref("");
const verificationCode = ref("");
const fromRoute = ref(router.currentRoute?.value?.query?.from || "");
const keyCopied = ref(false);

const goBack = () => {
  if (fromRoute.value === "transfer") {
    router.push({ name: "transfer" });
  } else {
    router.push({ name: "safety" });
  }
};

const initialize2FA = async () => {
  try {
    console.log("initialize2FA: calling walletStore.enable2FA()");
    const result = await walletStore.enable2FA();
    console.log("initialize2FA: result =", result);

    if (result.success) {
      qrImage.value = result.qrImage;
      otpauthUrl.value = result.key;
      authKey.value = parseSecretFromUrl(result.key);
      console.log(
        "initialize2FA: success, qrImage set, qrImage =",
        qrImage.value
      );

      if (!qrImage.value) {
        console.error("initialize2FA: qrImage is empty");
        error.value = t("error_occurred");
        walletStore.showMessage(t("error_occurred"), "error");
        return;
      }
    } else {
      console.log("initialize2FA: not success");
      error.value = t("error_occurred");
      walletStore.showMessage(t("error_occurred"), "error");
    }
  } catch (error) {
    console.error("initialize2FA error:", error);
    error.value = t("error_occurred");
    walletStore.showMessage(t("error_occurred"), "error");
  }
};

const parseSecretFromUrl = (url) => {
  try {
    // Если это уже не URL, возвращаем как есть
    if (!url || !url.startsWith("otpauth://")) {
      return url;
    }

    // Парсим URL
    const urlObj = new URL(url);
    // Извлекаем параметр secret
    const secret = urlObj.searchParams.get("secret");
    return secret || url; // Если secret не найден, возвращаем оригинальную строку
  } catch (error) {
    console.error("Error parsing 2FA URL:", error);
    return url; // В случае ошибки возвращаем оригинальную строку
  }
};

const copyKey = () => {
  if (authKey.value) {
    navigator.clipboard.writeText(authKey.value);
    keyCopied.value = true;
    walletStore.showMessage(t("copied"), "success", 1500);
    setTimeout(() => {
      keyCopied.value = false;
    }, 1500);
  }
};

const openAuthenticatorApp = () => {
  if (otpauthUrl.value) {
    window.open(otpauthUrl.value, "_blank");
  }
};

const goToVerification = () => {
  step.value = 2;
};

const verifyCode = async () => {
  if (verificationCode.value.length !== 6) {
    walletStore.showMessage(t("enter_6_digit_code"), "error");
    return;
  }

  const success = await walletStore.verify2FACode(verificationCode.value);

  if (success) {
    // Обновляем статус 2FA
    await walletStore.check2FAStatus();
    // Успешно - перенаправляем на страницу безопасности
    setTimeout(() => {
      verificationCode.value = "";
      router.push({ name: "transfer" });
    }, 1500);
  } else {
    verificationCode.value = "";
  }
};

const pasteKeyToInput = () => {
  if (authKey.value) {
    verificationCode.value = authKey.value;
  }
};

onMounted(async () => {
  console.log("TwoFactorAuth onMounted: START");
  try {
    step.value = 1; // Начинаем настройку 2FA
    console.log("TwoFactorAuth onMounted: initializing 2FA");
    try {
      await initialize2FA();
    } catch (initError) {
      console.error("TwoFactorAuth onMounted: initialize2FA error:", initError);
      error.value = t("error_occurred");
      walletStore.showMessage(t("error_occurred"), "error");
    }
  } catch (error) {
    console.error("TwoFactorAuth onMounted error:", error);
    // В случае ошибки показываем сообщение и остаемся на странице
    walletStore.showMessage(t("error_occurred"), "error");
  }

  console.log("TwoFactorAuth onMounted: setting loading to false");
  loading.value = false;
  console.log(
    "TwoFactorAuth: final step =",
    step.value,
    "loading =",
    loading.value
  );
});
</script>

<template>
  <header class="header">
    <button class="arrow" type="button" @click="goBack()">‹</button>
    <h1>{{ t("two_factor_auth") }}</h1>
    <div class="emp"></div>
  </header>

  <!-- Error state -->
  <div v-if="error" class="error-container">
    <div class="error-card">
      <img src="../../assets/error.svg" alt="error" class="error-icon" />
      <h2>{{ t("error") }}</h2>
      <p>{{ error }}</p>
      <button class="btn" @click="goBack()">{{ t("go_back") }}</button>
    </div>
  </div>

  <main v-if="!loading && !error" class="container">
    <!-- Шаг 1: Показ QR кода и ключа -->
    <transition name="step-fade" appear>
      <div v-if="step === 1" class="step-container">
        <div class="instructions">
          <h2>{{ t("setup_2fa") }}</h2>
          <p>{{ t("2fa_instruction_1") }}</p>
          <ol>
            <li>{{ t("2fa_instruction_2") }}</li>
            <li>{{ t("2fa_instruction_3") }}</li>
            <li>{{ t("2fa_instruction_4") }}</li>
          </ol>
        </div>
        <div class="qr-block">
          <div class="qr-container" v-if="qrImage">
            <img :src="qrSrc" alt="QR Code" class="qr-code" />
          </div>
          <div class="loader" v-else>
            <p>{{ t("loading") }}...</p>
          </div>
          <button
            class="btn secondary-btn"
            @click="openAuthenticatorApp"
            v-if="otpauthUrl"
            style="margin-top: 16px"
          >
            {{ t("open_authenticator") }}
          </button>
        </div>
        <div class="key-section" v-if="authKey">
          <label class="key-label">{{ t("your_code") }}</label>
          <div
            class="key-container"
            :class="{ copied: keyCopied }"
            @click="copyKey"
          >
            <span class="key-text">{{ authKey }}</span>
            <img src="../../assets/copy.svg" alt="copy" class="copy-icon" />
          </div>
          <p class="hint">{{ t("tap_to_copy_wallet") }}</p>
        </div>
        <button
          class="btn btn-primary"
          @click="goToVerification"
          :disabled="!qrImage"
          style="margin-top: 24px"
        >
          {{ t("continue") }}
        </button>
      </div>
    </transition>

    <!-- Шаг 2: Ввод кода верификации -->
    <transition name="step-fade" appear>
      <div v-if="step === 2" class="step-container">
        <div class="instructions">
          <h2>{{ t("verify_2fa") }}</h2>
          <p>{{ t("enter_code_from_app") }}</p>
        </div>
        <div class="code-input-container">
          <input
            type="text"
            v-model="verificationCode"
            :placeholder="t('enter_6_digit_code')"
            maxlength="6"
            pattern="[0-9]*"
            inputmode="numeric"
            class="code-input"
          />
          <button class="paste-btn" @click="pasteKeyToInput" v-if="authKey">
            {{ t("paste_key") || "Вставить ключ" }}
          </button>
        </div>
        <div class="key-section" v-if="authKey">
          <label class="key-label">{{ t("your_code") }}</label>
          <div
            class="key-container"
            :class="{ copied: keyCopied }"
            @click="copyKey"
          >
            <span class="key-text">{{ authKey }}</span>
            <img src="../../assets/copy.svg" alt="copy" class="copy-icon" />
          </div>
          <p class="hint">{{ t("tap_to_copy_wallet") }}</p>
        </div>
        <button
          class="btn"
          @click="verifyCode"
          :disabled="verificationCode.length !== 6"
          :class="{ disabled: verificationCode.length !== 6 }"
        >
          {{ t("verify_and_enable") }}
        </button>
        <button
          class="btn secondary-btn"
          @click="step = 1"
          style="margin-top: 12px"
        >
          {{ t("back_to_qr") }}
        </button>
      </div>
    </transition>

    <!-- Шаг 3: 2FA уже настроен -->
    <transition name="step-fade" appear>
      <div v-if="step === 3" class="step-container enabled-container">
        <div class="status-card">
          <div class="status-icon">
            <img
              src="../../assets/check.svg"
              alt="enabled"
              class="check-icon"
            />
          </div>
          <div class="status-content">
            <h2>{{ t("2fa_enabled") }}</h2>
            <p>{{ t("2fa_enabled_description") }}</p>
          </div>
        </div>
        <div class="info-card">
          <div class="info-icon">
            <img src="/assets/info.svg" alt="info" />
          </div>
          <div class="info-content">
            <h3>{{ t("important") }}</h3>
            <p>{{ t("2fa_disable_warning") }}</p>
          </div>
        </div>
        <button class="btn" @click="goBack()">
          {{ t("back_to_profile") }}
        </button>
      </div>
    </transition>
  </main>

  <!-- Loading state -->
  <div v-else class="loading-container">
    <AppLoader />
    <p class="loading-text">{{ t("loading") }}...</p>
  </div>
</template>

<style scoped>
.header {
  width: 100%;
  padding: 16px 16px 8px;
  display: grid;
  grid-template-columns: 44px 1fr 44px;
  align-items: center;
  gap: 8px;
  background: radial-gradient(820px 360px at 50% -18%, #dbeafe 0%, #f1f5f9 58%);
}

.header h1 {
  margin: 0;
  color: #0f172a;
  font-size: 22px;
  line-height: 28px;
  font-weight: 750;
  text-align: center;
}

.arrow {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
  color: #0f172a;
  font-size: 34px;
  line-height: 1;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.arrow:active {
  transform: scale(0.96);
}

.emp {
  width: 44px;
  height: 44px;
}

.container {
  min-height: calc(100vh - 80px);
  padding: 8px 16px 124px;
  background: radial-gradient(820px 360px at 50% -18%, #dbeafe 0%, #f1f5f9 58%);
  -webkit-overflow-scrolling: touch;
}

.step-container {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  display: grid;
  gap: 14px;
  align-content: start;
}

.instructions,
.qr-block,
.key-section,
.status-card,
.info-card,
.error-card {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.instructions {
  padding: 18px;
  text-align: left;
}

.instructions h2 {
  margin: 0 0 10px;
  color: #0f172a;
  font-size: 22px;
  line-height: 28px;
  font-weight: 750;
}

.instructions p {
  margin: 0 0 14px;
  color: #64748b;
  font-size: 14px;
  line-height: 21px;
  font-weight: 500;
}

.instructions ol {
  margin: 0;
  padding-left: 22px;
  display: grid;
  gap: 10px;
}

.instructions li {
  color: #475569;
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
}

.instructions li::marker {
  color: #2563eb;
  font-weight: 800;
}

.qr-block {
  padding: 18px;
  display: grid;
  justify-items: center;
  gap: 14px;
  position: relative;
  overflow: hidden;
}

.qr-block::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(59, 130, 246, 0));
  pointer-events: none;
}

.qr-container {
  position: relative;
  z-index: 1;
  width: 214px;
  height: 214px;
  padding: 14px;
  border-radius: 24px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.1);
  display: grid;
  place-items: center;
}

.qr-code {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 16px;
}

.loader {
  min-height: 120px;
  display: grid;
  place-items: center;
  color: #64748b;
  font-weight: 600;
}

.key-section {
  padding: 14px;
  display: grid;
  gap: 8px;
}

.key-label {
  color: #64748b;
  font-size: 12px;
  line-height: 16px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.key-container {
  min-height: 52px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  cursor: pointer;
  transition: border-color 0.18s ease, background-color 0.18s ease, transform 0.18s ease;
}

.key-container:active {
  transform: scale(0.99);
}

.key-container.copied {
  border-color: #10b981;
  background: #ecfdf5;
}

.key-text {
  min-width: 0;
  flex: 1;
  color: #0f172a;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 18px;
  font-weight: 700;
  word-break: break-all;
}

.copy-icon {
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
}

.hint {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  line-height: 16px;
  font-weight: 500;
}

.code-input-container {
  display: grid;
  gap: 10px;
}

.code-input {
  width: 100%;
  min-height: 58px;
  padding: 0 16px !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 18px !important;
  background: #ffffff !important;
  color: #0f172a !important;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
  text-align: center;
  font-size: 24px !important;
  line-height: 1;
  font-weight: 750;
  letter-spacing: 8px;
  outline: none;
  caret-color: #2563eb;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.code-input:focus {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.14), 0 10px 24px rgba(15, 23, 42, 0.06);
}

.code-input::placeholder {
  color: #94a3b8 !important;
  font-size: 14px !important;
  letter-spacing: normal !important;
}

.btn,
.btn-primary,
.paste-btn {
  width: 100%;
  min-height: 52px;
  border: 0;
  border-radius: 18px;
  color: #ffffff;
  background: linear-gradient(135deg, #2563eb, #1e40af);
  box-shadow: 0 14px 28px rgba(37, 99, 235, 0.24);
  font-size: 15px;
  font-weight: 750;
  cursor: pointer;
  transition: transform 0.18s ease, opacity 0.18s ease, box-shadow 0.18s ease;
}

.btn:active,
.btn-primary:active,
.paste-btn:active {
  transform: scale(0.99);
}

.btn:disabled,
.btn.disabled,
.btn-primary:disabled {
  opacity: 0.48;
  cursor: not-allowed;
  box-shadow: none;
}

.secondary-btn,
.paste-btn {
  color: #1e40af;
  background: #ffffff;
  border: 1px solid #dbeafe;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.06);
}

.paste-btn {
  min-height: 44px;
  font-size: 14px;
}

.enabled-container {
  text-align: left;
}

.status-card {
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  background: linear-gradient(135deg, #ecfdf5, #ffffff);
  border-color: #bbf7d0;
}

.status-icon {
  width: 48px;
  height: 48px;
  flex: 0 0 auto;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: #10b981;
  box-shadow: 0 10px 22px rgba(16, 185, 129, 0.22);
}

.check-icon {
  width: 22px;
  height: 22px;
  filter: brightness(0) invert(1);
}

.status-content h2 {
  margin: 0 0 4px;
  color: #0f172a;
  font-size: 18px;
  line-height: 23px;
  font-weight: 750;
}

.status-content p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
}

.info-card {
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #eff6ff;
  border-color: #bfdbfe;
}

.info-icon {
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: #dbeafe;
}

.info-icon img {
  width: 18px;
  height: 18px;
}

.info-content h3 {
  margin: 0 0 5px;
  color: #1e40af;
  font-size: 14px;
  line-height: 18px;
  font-weight: 800;
}

.info-content p {
  margin: 0;
  color: #475569;
  font-size: 13px;
  line-height: 19px;
  font-weight: 500;
}

.loading-container,
.error-container {
  min-height: 100vh;
  padding: 16px;
  background: radial-gradient(820px 360px at 50% -18%, #dbeafe 0%, #f1f5f9 58%);
  display: grid;
  place-items: center;
  gap: 14px;
}

.loading-text {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
}

.error-card {
  width: 100%;
  max-width: 380px;
  padding: 22px;
  text-align: center;
}

.error-icon {
  width: 58px;
  height: 58px;
  margin-bottom: 12px;
}

.error-card h2 {
  margin: 0 0 8px;
  color: #ef4444;
  font-size: 22px;
  line-height: 28px;
  font-weight: 750;
}

.error-card p {
  margin: 0 0 16px;
  color: #64748b;
  font-size: 14px;
  line-height: 20px;
}

.step-fade-enter-active,
.step-fade-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.step-fade-enter-from,
.step-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (max-width: 360px) {
  .header h1 {
    font-size: 20px;
    line-height: 25px;
  }

  .qr-container {
    width: 194px;
    height: 194px;
  }
}
</style>
