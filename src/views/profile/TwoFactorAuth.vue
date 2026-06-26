<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useWalletStore } from "@/stores/walletStore.ts";
import AppLoader from "@/components/AppLoader.vue";
import BackButton from "@/components/ui/BackButton.vue";
import copyIcon from "@/assets/copy.svg";
import checkIcon from "@/assets/check.svg";
import errorIcon from "@/assets/error.svg";

const { t } = useI18n();
const walletStore = useWalletStore();
const router = useRouter();

const step = ref(1);
const qrImage = ref("");
const loading = ref(true);
const error = ref("");
const authKey = ref("");
const otpauthUrl = ref("");
const verificationCode = ref("");
const keyCopied = ref(false);
const fromRoute = ref(router.currentRoute?.value?.query?.from || "");

const currentStep = computed(() => {
  if (step.value === 1) return "setup";
  if (step.value === 2) return "verify";
  return "success";
});

const qrSrc = computed(() => {
  if (!qrImage.value) return "";
  if (qrImage.value.startsWith("data:image")) return qrImage.value;
  return `data:image/png;base64,${qrImage.value}`;
});

const goBack = () => {
  if (fromRoute.value === "transfer") {
    router.push({ name: "transfer" });
    return;
  }
  if (fromRoute.value === "withdraw") {
    router.push({ name: "withdraw" });
    return;
  }
  router.push({ name: "safety" });
};

const parseSecretFromUrl = (url) => {
  try {
    if (!url || !url.startsWith("otpauth://")) {
      return url;
    }

    const urlObj = new URL(url);
    return urlObj.searchParams.get("secret") || url;
  } catch (parseError) {
    console.error("TwoFactorAuth parseSecretFromUrl error:", parseError);
    return url;
  }
};

const initialize2FA = async () => {
  try {
    console.log("TwoFactorAuth initialize2FA: start");
    const result = await walletStore.enable2FA();
    console.log("TwoFactorAuth initialize2FA: result", result);

    if (!result.success) {
      error.value = t("error_occurred");
      walletStore.showMessage(t("error_occurred"), "error");
      return;
    }

    qrImage.value = result.qrImage || "";
    otpauthUrl.value = result.key || "";
    authKey.value = parseSecretFromUrl(result.key || "");

    if (!qrImage.value) {
      console.error("TwoFactorAuth initialize2FA: qrImage is empty");
      error.value = t("error_occurred");
      walletStore.showMessage(t("error_occurred"), "error");
    }
  } catch (initError) {
    console.error("TwoFactorAuth initialize2FA error:", initError);
    error.value = t("error_occurred");
    walletStore.showMessage(t("error_occurred"), "error");
  }
};

const copyKey = async () => {
  if (!authKey.value) return;

  try {
    await navigator.clipboard.writeText(authKey.value);
    keyCopied.value = true;
    walletStore.showMessage(t("copied"), "success", 1500);
    setTimeout(() => {
      keyCopied.value = false;
    }, 1500);
  } catch (copyError) {
    console.error("TwoFactorAuth copyKey error:", copyError);
  }
};

const openAuthenticatorApp = () => {
  if (!otpauthUrl.value) return;
  window.open(otpauthUrl.value, "_blank");
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
  if (!success) {
    verificationCode.value = "";
    return;
  }

  await walletStore.check2FAStatus();
  step.value = 3;

  setTimeout(() => {
    verificationCode.value = "";
    if (fromRoute.value === "transfer") {
      router.push({ name: "transfer" });
      return;
    }
    if (fromRoute.value === "withdraw") {
      router.push({ name: "withdraw" });
      return;
    }
    router.push({ name: "safety" });
  }, 1500);
};

onMounted(async () => {
  console.log("TwoFactorAuth onMounted: START");
  try {
    step.value = 1;
    await initialize2FA();
  } catch (mountError) {
    console.error("TwoFactorAuth onMounted error:", mountError);
    error.value = t("error_occurred");
    walletStore.showMessage(t("error_occurred"), "error");
  } finally {
    loading.value = false;
    console.log("TwoFactorAuth onMounted: final", {
      step: step.value,
      currentStep: currentStep.value,
      loading: loading.value,
      qrImage: Boolean(qrImage.value),
      authKey: Boolean(authKey.value),
      error: error.value,
    });
  }
});

watch(
  () => ({
    step: step.value,
    currentStep: currentStep.value,
    loading: loading.value,
    error: error.value,
    qrImage: Boolean(qrImage.value),
    authKey: Boolean(authKey.value),
  }),
  (state) => {
    console.log("TwoFactorAuth render state:", state);
  },
  { immediate: true }
);
</script>

<template>
  <div class="tfa-page">
    <header class="tfa-page__header">
      <BackButton @click="goBack()" />
      <h1 class="tfa-page__title">{{ t("two_factor_auth") }}</h1>
      <div class="tfa-page__spacer"></div>
    </header>

    <section v-if="loading" class="tfa-page__surface">
      <div class="tfa-page__state-card">
        <AppLoader />
        <p class="tfa-page__state-text">{{ t("loading") }}...</p>
      </div>
    </section>

    <section v-else-if="error" class="tfa-page__surface">
      <div class="tfa-page__card tfa-page__card--error">
        <img :src="errorIcon" alt="Error" class="tfa-page__error-icon" />
        <h2 class="tfa-page__card-title">{{ t("error") }}</h2>
        <p class="tfa-page__card-text">{{ error }}</p>
        <button class="tfa-page__button tfa-page__button--primary" @click="goBack()">
          {{ t("go_back") }}
        </button>
      </div>
    </section>

    <section v-else-if="currentStep === 'setup'" class="tfa-page__surface">
      <div class="tfa-page__stack">
        <section class="tfa-page__card">
          <h2 class="tfa-page__card-title">{{ t("setup_2fa") }}</h2>
          <p class="tfa-page__card-text">{{ t("2fa_instruction_1") }}</p>
          <ol class="tfa-page__list">
            <li>{{ t("2fa_instruction_2") }}</li>
            <li>{{ t("2fa_instruction_3") }}</li>
            <li>{{ t("2fa_instruction_4") }}</li>
          </ol>
        </section>

        <section class="tfa-page__card tfa-page__card--center">
          <div v-if="qrImage" class="tfa-page__qr-shell">
            <img :src="qrSrc" alt="QR Code" class="tfa-page__qr-image" />
          </div>
          <div v-else class="tfa-page__qr-placeholder">
            <p class="tfa-page__card-text">{{ t("loading") }}...</p>
          </div>

          <button
            v-if="otpauthUrl"
            class="tfa-page__button tfa-page__button--secondary"
            @click="openAuthenticatorApp"
          >
            {{ t("open_authenticator") }}
          </button>
        </section>

        <section v-if="authKey" class="tfa-page__card">
          <label class="tfa-page__label">{{ t("your_code") }}</label>
          <button class="tfa-page__key-box" :class="{ 'is-copied': keyCopied }" @click="copyKey">
            <span class="tfa-page__key-value">{{ authKey }}</span>
            <img :src="copyIcon" alt="Copy" class="tfa-page__copy-icon" />
          </button>
          <p class="tfa-page__hint">{{ t("tap_to_copy_wallet") }}</p>
        </section>

        <button
          class="tfa-page__button tfa-page__button--primary"
          :disabled="!qrImage"
          @click="goToVerification"
        >
          {{ t("continue") }}
        </button>
      </div>
    </section>

    <section v-else-if="currentStep === 'verify'" class="tfa-page__surface">
      <div class="tfa-page__stack">
        <section class="tfa-page__card">
          <h2 class="tfa-page__card-title">{{ t("verify_2fa") }}</h2>
          <p class="tfa-page__card-text">{{ t("enter_code_from_app") }}</p>
        </section>

        <section class="tfa-page__card">
          <div class="tfa-page__input-wrap">
            <input
              v-model="verificationCode"
              type="text"
              maxlength="6"
              pattern="[0-9]*"
              inputmode="numeric"
              :placeholder="t('enter_6_digit_code')"
              class="tfa-page__input"
            />
          </div>
        </section>

        <section v-if="authKey" class="tfa-page__card">
          <label class="tfa-page__label">{{ t("your_code") }}</label>
          <button class="tfa-page__key-box" :class="{ 'is-copied': keyCopied }" @click="copyKey">
            <span class="tfa-page__key-value">{{ authKey }}</span>
            <img :src="copyIcon" alt="Copy" class="tfa-page__copy-icon" />
          </button>
          <p class="tfa-page__hint">{{ t("tap_to_copy_wallet") }}</p>
        </section>

        <button
          class="tfa-page__button tfa-page__button--primary"
          :disabled="verificationCode.length !== 6"
          @click="verifyCode"
        >
          {{ t("verify_and_enable") }}
        </button>

        <button class="tfa-page__button tfa-page__button--secondary" @click="step = 1">
          {{ t("back_to_qr") }}
        </button>
      </div>
    </section>

    <section v-else class="tfa-page__surface">
      <div class="tfa-page__stack">
        <section class="tfa-page__card tfa-page__card--success">
          <div class="tfa-page__status-icon">
            <img :src="checkIcon" alt="Enabled" class="tfa-page__status-image" />
          </div>
          <h2 class="tfa-page__card-title">{{ t("2fa_enabled") }}</h2>
          <p class="tfa-page__card-text">{{ t("2fa_enabled_description") }}</p>
        </section>

        <section class="tfa-page__card tfa-page__card--info">
          <div class="tfa-page__info-row">
            <div class="tfa-page__info-icon" aria-hidden="true">i</div>
            <div>
              <h3 class="tfa-page__info-title">{{ t("important") }}</h3>
              <p class="tfa-page__card-text">{{ t("2fa_disable_warning") }}</p>
            </div>
          </div>
        </section>

        <button class="tfa-page__button tfa-page__button--primary" @click="goBack()">
          {{ t("back_to_profile") }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.tfa-page {
  min-height: 100vh;
  min-height: 100dvh;
  background:
    radial-gradient(820px 360px at 50% -18%, #dbeafe 0%, #f1f5f9 58%);
}

.tfa-page__header {
  width: 100%;
  padding: 20px 16px 10px;
  display: grid;
  grid-template-columns: 44px 1fr 44px;
  align-items: center;
  gap: 12px;
}

.tfa-page__title {
  margin: 0;
  color: #0f172a;
  font-size: 22px;
  line-height: 28px;
  font-weight: 750;
  text-align: center;
}

.tfa-page__spacer {
  width: 44px;
  height: 44px;
}

.tfa-page__surface {
  min-height: calc(100vh - 80px);
  min-height: calc(100dvh - 80px);
  padding: 8px 16px 124px;
}

.tfa-page__state-card,
.tfa-page__card {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.tfa-page__state-card {
  padding: 24px;
  display: grid;
  justify-items: center;
  gap: 12px;
}

.tfa-page__state-text {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
}

.tfa-page__stack {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  display: grid;
  gap: 14px;
}

.tfa-page__card {
  padding: 18px;
}

.tfa-page__card--center {
  display: grid;
  justify-items: center;
  gap: 14px;
}

.tfa-page__card--success {
  background: linear-gradient(135deg, #ecfdf5, #ffffff);
  border-color: #bbf7d0;
  text-align: center;
}

.tfa-page__card--info {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.tfa-page__card--error {
  padding: 24px;
  text-align: center;
}

.tfa-page__card-title {
  margin: 0 0 10px;
  color: #0f172a;
  font-size: 22px;
  line-height: 28px;
  font-weight: 750;
}

.tfa-page__card-text {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  line-height: 21px;
  font-weight: 500;
}

.tfa-page__list {
  margin: 14px 0 0;
  padding-left: 22px;
  display: grid;
  gap: 10px;
}

.tfa-page__list li {
  color: #475569;
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
}

.tfa-page__list li::marker {
  color: #2563eb;
  font-weight: 800;
}

.tfa-page__qr-shell {
  width: 214px;
  height: 214px;
  padding: 14px;
  display: grid;
  place-items: center;
  border-radius: 24px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.1);
}

.tfa-page__qr-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 16px;
}

.tfa-page__qr-placeholder {
  min-height: 120px;
  display: grid;
  place-items: center;
}

.tfa-page__label {
  display: block;
  margin-bottom: 8px;
  color: #64748b;
  font-size: 12px;
  line-height: 16px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tfa-page__key-box {
  width: 100%;
  min-height: 52px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  cursor: pointer;
}

.tfa-page__key-box.is-copied {
  border-color: #10b981;
  background: #ecfdf5;
}

.tfa-page__key-value {
  min-width: 0;
  flex: 1;
  color: #0f172a;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 18px;
  font-weight: 700;
  word-break: break-all;
  text-align: left;
}

.tfa-page__copy-icon {
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
}

.tfa-page__hint {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 16px;
  font-weight: 500;
}

.tfa-page__input-wrap {
  display: grid;
  gap: 10px;
}

.tfa-page__input {
  width: 100%;
  min-height: 58px;
  padding: 0 16px;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
  text-align: center;
  font-size: 24px;
  line-height: 1;
  font-weight: 750;
  letter-spacing: 8px;
  outline: none;
  caret-color: #2563eb;
}

.tfa-page__input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.14), 0 10px 24px rgba(15, 23, 42, 0.06);
}

.tfa-page__input::placeholder {
  color: #94a3b8;
  font-size: 14px;
  letter-spacing: normal;
}

.tfa-page__button {
  width: 100%;
  min-height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  font-size: 15px;
  font-weight: 750;
  cursor: pointer;
}

.tfa-page__button:disabled {
  opacity: 0.48;
  cursor: not-allowed;
}

.tfa-page__button--primary {
  color: #ffffff;
  background: linear-gradient(135deg, #2563eb, #1e40af);
  box-shadow: 0 14px 28px rgba(37, 99, 235, 0.24);
}

.tfa-page__button--secondary {
  color: #1e40af;
  background: #ffffff;
  border: 1px solid #dbeafe;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.06);
}

.tfa-page__status-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 14px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: #10b981;
  box-shadow: 0 10px 22px rgba(16, 185, 129, 0.22);
}

.tfa-page__status-image {
  width: 22px;
  height: 22px;
  filter: brightness(0) invert(1);
}

.tfa-page__info-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.tfa-page__info-icon {
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: #dbeafe;
  color: #2563eb;
  font-size: 18px;
  line-height: 1;
  font-weight: 800;
}

.tfa-page__info-title {
  margin: 0 0 5px;
  color: #1e40af;
  font-size: 14px;
  line-height: 18px;
  font-weight: 800;
}

.tfa-page__error-icon {
  width: 58px;
  height: 58px;
  margin-bottom: 12px;
}

@media (max-width: 360px) {
  .tfa-page__title {
    font-size: 20px;
    line-height: 25px;
  }

  .tfa-page__qr-shell {
    width: 194px;
    height: 194px;
  }
}

:global(.dark-theme) .tfa-page {
  background:
    radial-gradient(760px 340px at 50% -16%, rgba(37, 98, 235, 0.16), transparent 62%),
    linear-gradient(180deg, #07111f 0%, #0d1b2a 100%) !important;
}

:global(.dark-theme) .tfa-page__title,
:global(.dark-theme) .tfa-page__card-title,
:global(.dark-theme) .tfa-page__key-value {
  color: #ffffff !important;
}

:global(.dark-theme) .tfa-page__card,
:global(.dark-theme) .tfa-page__state-card,
:global(.dark-theme) .tfa-page__qr-shell,
:global(.dark-theme) .tfa-page__input,
:global(.dark-theme) .tfa-page__key-box {
  background: rgba(30, 39, 59, 0.96) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.28) !important;
}

:global(.dark-theme) .tfa-page__card--success {
  background: rgba(22, 101, 52, 0.2) !important;
  border-color: rgba(34, 197, 94, 0.28) !important;
}

:global(.dark-theme) .tfa-page__card--info {
  background: rgba(37, 98, 235, 0.14) !important;
  border-color: rgba(59, 130, 246, 0.22) !important;
}

:global(.dark-theme) .tfa-page__card-text,
:global(.dark-theme) .tfa-page__state-text,
:global(.dark-theme) .tfa-page__list li,
:global(.dark-theme) .tfa-page__hint {
  color: #94a3b8 !important;
}

:global(.dark-theme) .tfa-page__label,
:global(.dark-theme) .tfa-page__info-title {
  color: #dbeafe !important;
}

:global(.dark-theme) .tfa-page__input {
  color: #ffffff !important;
}

:global(.dark-theme) .tfa-page__input::placeholder {
  color: rgba(255, 255, 255, 0.42) !important;
}

:global(.dark-theme) .tfa-page__button--primary {
  background: linear-gradient(135deg, #2562eb, #3882fa) !important;
  color: #ffffff !important;
}

:global(.dark-theme) .tfa-page__button--secondary {
  background: rgba(13, 27, 42, 0.58) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  color: #ffffff !important;
}

:global(.dark-theme) .tfa-page__info-icon {
  background: rgba(37, 98, 235, 0.18) !important;
  color: #dbeafe !important;
}
</style>
