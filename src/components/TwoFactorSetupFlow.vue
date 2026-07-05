<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useWalletStore } from "@/stores/walletStore.ts";
import AppLoader from "@/components/AppLoader.vue";
import BackButton from "@/components/ui/BackButton.vue";
import copyIcon from "@/assets/copy.svg";
import checkIcon from "@/assets/check.svg";
import errorIcon from "@/assets/error.svg";
import { getElementSnapshot, logThemeSnapshot } from "@/utils/pageDebug";

const props = defineProps({
  standalone: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["completed", "back"]);

const { t } = useI18n();
const walletStore = useWalletStore();

const step = ref(1);
const qrImage = ref("");
const loading = ref(true);
const error = ref("");
const authKey = ref("");
const otpauthUrl = ref("");
const verificationCode = ref("");
const keyCopied = ref(false);
const rootRef = ref(null);
const getInitialThemeState = () => {
  if (walletStore.isDarkTheme) {
    return true;
  }

  if (typeof document === "undefined") {
    return false;
  }

  return (
    document.body.classList.contains("dark-theme") ||
    document.documentElement.classList.contains("dark-theme")
  );
};

const isDarkTheme = ref(getInitialThemeState());
let themeObserver = null;

const currentStep = computed(() => {
  if (step.value === 1) return "setup";
  if (step.value === 2) return "verify";
  return "success";
});

const isSetupVisible = computed(
  () => !loading.value && !error.value && currentStep.value === "setup"
);
const isVerifyVisible = computed(
  () => !loading.value && !error.value && currentStep.value === "verify"
);
const isSuccessVisible = computed(
  () => !loading.value && !error.value && currentStep.value === "success"
);
const isErrorVisible = computed(() => !loading.value && !!error.value);

const qrSrc = computed(() => {
  if (!qrImage.value) return "";
  if (qrImage.value.startsWith("data:image")) return qrImage.value;
  return `data:image/png;base64,${qrImage.value}`;
});

const rootStyle = computed(() =>
  isDarkTheme.value
    ? {
        width: "100%",
        display: "block",
        flex: "1 1 auto",
        minHeight: "100dvh",
        position: "relative",
        zIndex: "2",
        background:
          "radial-gradient(760px 340px at 50% -16%, rgba(37, 98, 235, 0.16), transparent 62%), linear-gradient(180deg, #07111f 0%, #0d1b2a 100%)",
        color: "#ffffff",
      }
    : {
        width: "100%",
        display: "block",
        flex: "1 1 auto",
        minHeight: "100dvh",
        position: "relative",
        zIndex: "2",
      }
);

const titleStyle = computed(() =>
  isDarkTheme.value
    ? {
        color: "#ffffff",
      }
    : {}
);

const headerStyle = computed(() => ({
  width: "100%",
  padding: "20px 16px 10px",
  display: "grid",
  gridTemplateColumns: "44px 1fr 44px",
  alignItems: "center",
  gap: "12px",
}));

const surfaceStyle = computed(() => ({
  position: "relative",
  zIndex: "2",
  display: "grid",
  gap: "14px",
  width: "100%",
  padding: "8px 16px 40px",
  minHeight: props.standalone ? "calc(100dvh - 80px)" : "auto",
  background: "transparent",
}));

const stackStyle = computed(() => ({
  width: "100%",
  maxWidth: "420px",
  margin: "0 auto",
  display: "grid",
  gap: "14px",
  position: "relative",
  zIndex: "2",
}));

const hiddenBlockStyle = Object.freeze({
  display: "none",
});

const cardStyle = computed(() =>
  isDarkTheme.value
    ? {
        width: "100%",
        maxWidth: "420px",
        margin: "0 auto",
        display: "block",
        padding: "18px",
        borderRadius: "24px",
        borderStyle: "solid",
        borderWidth: "1px",
        background: "rgba(30, 39, 59, 0.96)",
        borderColor: "rgba(255, 255, 255, 0.08)",
        boxShadow: "0 18px 34px rgba(0, 0, 0, 0.28)",
        position: "relative",
        zIndex: "2",
      }
    : {
        width: "100%",
        maxWidth: "420px",
        margin: "0 auto",
        display: "block",
        padding: "18px",
        borderRadius: "24px",
        border: "1px solid #e2e8f0",
        background: "rgba(255, 255, 255, 0.96)",
        boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
        position: "relative",
        zIndex: "2",
      }
);

const successCardStyle = computed(() =>
  isDarkTheme.value
    ? {
        width: "100%",
        maxWidth: "420px",
        margin: "0 auto",
        padding: "18px",
        borderRadius: "24px",
        borderStyle: "solid",
        borderWidth: "1px",
        background: "rgba(22, 101, 52, 0.2)",
        borderColor: "rgba(34, 197, 94, 0.28)",
      }
    : {
        width: "100%",
        maxWidth: "420px",
        margin: "0 auto",
        padding: "18px",
        borderRadius: "24px",
        border: "1px solid #bbf7d0",
        background: "linear-gradient(135deg, #ecfdf5, #ffffff)",
      }
);

const bodyTextStyle = computed(() =>
  isDarkTheme.value
    ? {
        color: "#94a3b8",
      }
    : {}
);

const keyValueStyle = computed(() =>
  isDarkTheme.value
    ? {
        color: "#ffffff",
      }
    : {}
);

const stateCardStyle = computed(() =>
  isDarkTheme.value
    ? {
        ...cardStyle.value,
        padding: "24px",
        display: "grid",
        justifyItems: "center",
        gap: "12px",
      }
    : {
        ...cardStyle.value,
        padding: "24px",
        display: "grid",
        justifyItems: "center",
        gap: "12px",
      }
);

const centerCardStyle = computed(() => ({
  ...cardStyle.value,
  display: "grid",
  justifyItems: "center",
  gap: "14px",
}));

const qrShellStyle = computed(() =>
  isDarkTheme.value
    ? {
        width: "214px",
        height: "214px",
        padding: "14px",
        display: "grid",
        placeItems: "center",
        borderRadius: "24px",
        background: "rgba(30, 39, 59, 0.96)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 18px 34px rgba(0, 0, 0, 0.28)",
      }
    : {
        width: "214px",
        height: "214px",
        padding: "14px",
        display: "grid",
        placeItems: "center",
        borderRadius: "24px",
        background: "#ffffff",
        border: "1px solid #e2e8f0",
      }
);

const keyBoxStyle = computed(() =>
  isDarkTheme.value
    ? {
        width: "100%",
        minHeight: "52px",
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        background: "rgba(30, 39, 59, 0.96)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "18px",
        cursor: "pointer",
      }
    : {
        width: "100%",
        minHeight: "52px",
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "18px",
        cursor: "pointer",
      }
);

const inputStyle = computed(() =>
  isDarkTheme.value
    ? {
        width: "100%",
        minHeight: "58px",
        padding: "0 16px",
        borderStyle: "solid",
        borderWidth: "1px",
        borderRadius: "18px",
        background: "rgba(30, 39, 59, 0.96)",
        borderColor: "rgba(255, 255, 255, 0.08)",
        boxShadow: "0 18px 34px rgba(0, 0, 0, 0.28)",
        color: "#ffffff",
        textAlign: "center",
        fontSize: "24px",
        lineHeight: "1",
        fontWeight: "750",
        letterSpacing: "8px",
      }
    : {
        width: "100%",
        minHeight: "58px",
        padding: "0 16px",
        border: "1px solid #e2e8f0",
        borderRadius: "18px",
        background: "#ffffff",
        color: "#0f172a",
        textAlign: "center",
        fontSize: "24px",
        lineHeight: "1",
        fontWeight: "750",
        letterSpacing: "8px",
      }
);

const secondaryButtonStyle = computed(() =>
  isDarkTheme.value
    ? {
        width: "100%",
        minHeight: "52px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "18px",
        fontSize: "15px",
        fontWeight: "750",
        background: "rgba(13, 27, 42, 0.58)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        color: "#ffffff",
      }
    : {
        width: "100%",
        minHeight: "52px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "18px",
        fontSize: "15px",
        fontWeight: "750",
        background: "#ffffff",
        border: "1px solid #dbeafe",
        color: "#1e40af",
      }
);

const primaryButtonStyle = computed(() =>
  isDarkTheme.value
    ? {
        width: "100%",
        minHeight: "52px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "18px",
        fontSize: "15px",
        fontWeight: "750",
        background: "linear-gradient(135deg, #2562eb, #3882fa)",
        color: "#ffffff",
      }
    : {
        width: "100%",
        minHeight: "52px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "18px",
        fontSize: "15px",
        fontWeight: "750",
        background: "linear-gradient(135deg, #2563eb, #1e40af)",
        color: "#ffffff",
      }
);

const syncThemeState = () => {
  isDarkTheme.value = getInitialThemeState();
};

const goBack = () => emit("back");

const parseSecretFromUrl = (url) => {
  try {
    if (!url || !url.startsWith("otpauth://")) {
      return url;
    }

    const secretMatch = url.match(/[?&]secret=([^&]+)/i);
    if (!secretMatch?.[1]) {
      return url;
    }

    return decodeURIComponent(secretMatch[1]);
  } catch (parseError) {
    console.error("TwoFactorSetupFlow parseSecretFromUrl error:", parseError);
    return url;
  }
};

const initialize2FA = async () => {
  try {
    const result = await walletStore.enable2FA();
    console.log("TwoFactorSetupFlow initialize2FA:", result);

    if (!result.success) {
      error.value = t("error_occurred");
      walletStore.showMessage(t("error_occurred"), "error");
      return;
    }

    qrImage.value = result.qrImage || "";
    otpauthUrl.value = result.key || "";
    authKey.value = parseSecretFromUrl(result.key || "");

    if (!qrImage.value) {
      error.value = t("error_occurred");
      walletStore.showMessage(t("error_occurred"), "error");
    }
  } catch (initError) {
    console.error("TwoFactorSetupFlow initialize2FA error:", initError);
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
    console.error("TwoFactorSetupFlow copyKey error:", copyError);
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
    emit("completed");
  }, 900);
};

const logVisibleFlowState = (tag) => {
  const root = rootRef.value;
  if (!root || typeof document === "undefined") return;

  const visibleStack = root.querySelector(".tfa-flow__stack");
  const visibleCards = Array.from(root.querySelectorAll(".tfa-flow__stack .tfa-flow__card"))
    .filter((element) => getComputedStyle(element).display !== "none")
    .map((element, index) => ({
      index,
      className: element.className,
      rect: element.getBoundingClientRect(),
      display: getComputedStyle(element).display,
      visibility: getComputedStyle(element).visibility,
      opacity: getComputedStyle(element).opacity,
      background: getComputedStyle(element).background,
      text: element.innerText.slice(0, 140),
    }));

  console.log(`[PeekPay TwoFactor visible state] ${tag}`, {
    currentStep: currentStep.value,
    loading: loading.value,
    error: error.value,
    visibleStack: visibleStack
      ? {
          className: visibleStack.className,
          rect: visibleStack.getBoundingClientRect(),
          display: getComputedStyle(visibleStack).display,
          visibility: getComputedStyle(visibleStack).visibility,
          opacity: getComputedStyle(visibleStack).opacity,
        }
      : null,
    visibleCards,
    elementAtTop: document.elementFromPoint(32, 120)?.className || null,
    elementAtCenter:
      document.elementFromPoint(
        Math.max(1, Math.floor(window.innerWidth / 2)),
        Math.max(1, Math.floor(window.innerHeight / 2))
      )?.className || null,
  });
};

onMounted(async () => {
  syncThemeState();

  if (typeof document !== "undefined") {
    themeObserver = new MutationObserver(() => {
      syncThemeState();
    });

    themeObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  syncThemeState();

  try {
    step.value = 1;
    if (rootRef.value) {
      rootRef.value.scrollTop = 0;
    }
    await initialize2FA();
  } finally {
    loading.value = false;
    await nextTick();
    console.log("TwoFactorSetupFlow mounted final:", {
      step: step.value,
      loading: loading.value,
      error: error.value,
      qrImage: Boolean(qrImage.value),
      authKey: Boolean(authKey.value),
      currentStep: currentStep.value,
      isDarkTheme: isDarkTheme.value,
    });
    logThemeSnapshot("TwoFactorSetupFlow mounted final", {
      page: getElementSnapshot(".tfa-flow"),
      header: getElementSnapshot(".tfa-flow__header"),
      surface: getElementSnapshot(".tfa-flow__surface"),
      stack: getElementSnapshot(".tfa-flow__stack"),
      card: getElementSnapshot(".tfa-flow__card"),
      qrShell: getElementSnapshot(".tfa-flow__qr-shell"),
      standalone: props.standalone,
    });
    logVisibleFlowState("mounted final");
  }
});

onBeforeUnmount(() => {
  if (themeObserver) {
    themeObserver.disconnect();
    themeObserver = null;
  }
});

watch(
  () => [loading.value, currentStep.value, qrImage.value, authKey.value, walletStore.isDarkTheme],
  () => {
    syncThemeState();
    if (!loading.value) {
      logVisibleFlowState("watch after loading");
    }
  }
);
</script>

<template>
  <div
    ref="rootRef"
    class="tfa-flow"
    :class="{
      'tfa-flow--standalone': standalone,
      'tfa-flow--dark': isDarkTheme,
    }"
    :style="rootStyle"
  >
    <header v-if="standalone" class="tfa-flow__header" :style="headerStyle">
      <BackButton @click="goBack()" />
      <h1 class="tfa-flow__title" :style="titleStyle">{{ t('two_factor_auth') }}</h1>
      <div class="tfa-flow__spacer"></div>
    </header>

    <section class="tfa-flow__surface" :style="surfaceStyle">
      <div
        v-if="loading"
        class="tfa-flow__state-card"
        :style="stateCardStyle"
      >
        <AppLoader />
        <p class="tfa-flow__state-text">{{ t("loading") }}...</p>
      </div>

      <div
        v-else-if="isErrorVisible"
        class="tfa-flow__card tfa-flow__card--error"
        :style="cardStyle"
      >
        <img :src="errorIcon" alt="Error" class="tfa-flow__error-icon" />
        <h2 class="tfa-flow__card-title" :style="titleStyle">{{ t("error") }}</h2>
        <p class="tfa-flow__card-text" :style="bodyTextStyle">{{ error }}</p>
        <button class="tfa-flow__button tfa-flow__button--primary" :style="primaryButtonStyle" @click="goBack()">
          {{ t("go_back") }}
        </button>
      </div>

      <div
        v-else-if="isSetupVisible"
        class="tfa-flow__stack"
        :style="stackStyle"
      >
        <section class="tfa-flow__card" :style="cardStyle">
          <h2 class="tfa-flow__card-title" :style="titleStyle">{{ t("setup_2fa") }}</h2>
          <p class="tfa-flow__card-text" :style="bodyTextStyle">{{ t("2fa_instruction_1") }}</p>
          <ol class="tfa-flow__list">
            <li :style="bodyTextStyle">{{ t("2fa_instruction_2") }}</li>
            <li :style="bodyTextStyle">{{ t("2fa_instruction_3") }}</li>
            <li :style="bodyTextStyle">{{ t("2fa_instruction_4") }}</li>
          </ol>
        </section>

        <section class="tfa-flow__card tfa-flow__card--center" :style="centerCardStyle">
          <div v-if="qrImage" class="tfa-flow__qr-shell" :style="qrShellStyle">
            <img :src="qrSrc" alt="QR Code" class="tfa-flow__qr-image" />
          </div>
          <div v-else class="tfa-flow__qr-placeholder" :style="bodyTextStyle">
            <p class="tfa-flow__card-text" :style="bodyTextStyle">{{ t("loading") }}...</p>
          </div>

          <button
            v-if="otpauthUrl"
            class="tfa-flow__button tfa-flow__button--secondary"
            :style="secondaryButtonStyle"
            @click="openAuthenticatorApp"
          >
            {{ t("open_authenticator") }}
          </button>
        </section>

        <section v-if="authKey" class="tfa-flow__card" :style="cardStyle">
          <label class="tfa-flow__label" :style="bodyTextStyle">{{ t("your_code") }}</label>
          <button class="tfa-flow__key-box" :style="keyBoxStyle" :class="{ 'is-copied': keyCopied }" @click="copyKey">
            <span class="tfa-flow__key-value" :style="keyValueStyle">{{ authKey }}</span>
            <img :src="copyIcon" alt="Copy" class="tfa-flow__copy-icon" />
          </button>
          <p class="tfa-flow__hint" :style="bodyTextStyle">{{ t("tap_to_copy_wallet") }}</p>
        </section>

        <button
          class="tfa-flow__button tfa-flow__button--primary"
          :style="primaryButtonStyle"
          :disabled="!qrImage"
          @click="goToVerification"
        >
          {{ t("continue") }}
        </button>
      </div>

      <div
        v-else-if="isVerifyVisible"
        class="tfa-flow__stack"
        :style="stackStyle"
      >
        <section class="tfa-flow__card" :style="cardStyle">
          <h2 class="tfa-flow__card-title" :style="titleStyle">{{ t("verify_2fa") }}</h2>
          <p class="tfa-flow__card-text" :style="bodyTextStyle">{{ t("enter_code_from_app") }}</p>
        </section>

        <section class="tfa-flow__card" :style="cardStyle">
          <div class="tfa-flow__input-wrap">
            <input
              v-model="verificationCode"
              type="text"
              maxlength="6"
              pattern="[0-9]*"
              inputmode="numeric"
              :placeholder="t('enter_6_digit_code')"
              class="tfa-flow__input"
              :style="inputStyle"
            />
          </div>
        </section>

        <button
          class="tfa-flow__button tfa-flow__button--primary"
          :style="primaryButtonStyle"
          :disabled="verificationCode.length !== 6"
          @click="verifyCode"
        >
          {{ t("verify_and_enable") }}
        </button>

        <button class="tfa-flow__button tfa-flow__button--secondary" :style="secondaryButtonStyle" @click="step = 1">
          {{ t("back_to_qr") }}
        </button>
      </div>

      <div
        v-else-if="isSuccessVisible"
        class="tfa-flow__stack"
        :style="stackStyle"
      >
        <section class="tfa-flow__card tfa-flow__card--success" :style="successCardStyle">
          <div class="tfa-flow__status-icon">
            <img :src="checkIcon" alt="Enabled" class="tfa-flow__status-image" />
          </div>
          <h2 class="tfa-flow__card-title" :style="titleStyle">{{ t("2fa_enabled") }}</h2>
          <p class="tfa-flow__card-text" :style="bodyTextStyle">{{ t("2fa_enabled_description") }}</p>
        </section>
      </div>
    </section>
  </div>
</template>

<style scoped>
.tfa-flow {
  width: 100%;
  display: block;
  flex: 1 1 auto;
  min-height: 100%;
  opacity: 1;
  visibility: visible;
  transform: none;
}

.tfa-flow--standalone {
  min-height: 100vh;
  min-height: 100dvh;
  background:
    radial-gradient(820px 360px at 50% -18%, #dbeafe 0%, #f1f5f9 58%);
}

.tfa-flow__header {
  width: 100%;
  padding: 20px 16px 10px;
  display: grid;
  grid-template-columns: 44px 1fr 44px;
  align-items: center;
  gap: 12px;
}

.tfa-flow__title {
  margin: 0;
  color: #0f172a;
  font-size: 22px;
  line-height: 28px;
  font-weight: 750;
  text-align: center;
}

.tfa-flow__spacer {
  width: 44px;
  height: 44px;
}

.tfa-flow__surface {
  padding: 8px 16px 24px;
  opacity: 1;
  visibility: visible;
  transform: none;
  display: grid;
  gap: 14px;
}

.tfa-flow--standalone .tfa-flow__surface {
  min-height: calc(100vh - 80px);
  min-height: calc(100dvh - 80px);
  padding-bottom: 40px;
}

.tfa-flow__state-card,
.tfa-flow__card {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.tfa-flow__state-card {
  padding: 24px;
  display: grid;
  justify-items: center;
  gap: 12px;
}

.tfa-flow__state-text,
.tfa-flow__card-text {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  line-height: 21px;
  font-weight: 500;
}

.tfa-flow__stack {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  display: grid;
  gap: 14px;
  opacity: 1;
  visibility: visible;
  transform: none;
}

.tfa-flow__block--hidden {
  display: none !important;
}

.tfa-flow__card {
  padding: 18px;
}

.tfa-flow__card--center {
  display: grid;
  justify-items: center;
  gap: 14px;
}

.tfa-flow__card--success {
  background: linear-gradient(135deg, #ecfdf5, #ffffff);
  border-color: #bbf7d0;
  text-align: center;
}

.tfa-flow__card-title {
  margin: 0 0 10px;
  color: #0f172a;
  font-size: 22px;
  line-height: 28px;
  font-weight: 750;
}

.tfa-flow__list {
  margin: 14px 0 0;
  padding-left: 22px;
  display: grid;
  gap: 10px;
}

.tfa-flow__list li {
  color: #475569;
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
}

.tfa-flow__list li::marker {
  color: #2563eb;
  font-weight: 800;
}

.tfa-flow__qr-shell {
  width: 214px;
  height: 214px;
  padding: 14px;
  display: grid;
  place-items: center;
  border-radius: 24px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
}

.tfa-flow__qr-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 16px;
}

.tfa-flow__qr-placeholder {
  min-height: 120px;
  display: grid;
  place-items: center;
}

.tfa-flow__label {
  display: block;
  margin-bottom: 8px;
  color: #64748b;
  font-size: 12px;
  line-height: 16px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tfa-flow__key-box {
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

.tfa-flow__key-box.is-copied {
  border-color: #10b981;
  background: #ecfdf5;
}

.tfa-flow__key-value {
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

.tfa-flow__copy-icon {
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
}

.tfa-flow__hint {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 16px;
  font-weight: 500;
}

.tfa-flow__input-wrap {
  display: grid;
  gap: 10px;
}

.tfa-flow__input {
  width: 100%;
  min-height: 58px;
  padding: 0 16px;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  background: #ffffff;
  color: #0f172a;
  text-align: center;
  font-size: 24px;
  line-height: 1;
  font-weight: 750;
  letter-spacing: 8px;
  outline: none;
  caret-color: #2563eb;
}

.tfa-flow__button {
  width: 100%;
  min-height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  font-size: 15px;
  font-weight: 750;
  cursor: pointer;
  transition: none;
  animation: none;
}

.tfa-flow__button:disabled {
  opacity: 0.48;
  cursor: not-allowed;
}

.tfa-flow__button--primary {
  color: #ffffff;
  background: linear-gradient(135deg, #2563eb, #1e40af);
}

.tfa-flow__button--secondary {
  color: #1e40af;
  background: #ffffff;
  border: 1px solid #dbeafe;
}

.tfa-flow__status-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 14px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: #10b981;
}

.tfa-flow__status-image {
  width: 22px;
  height: 22px;
  filter: brightness(0) invert(1);
}

.tfa-flow__error-icon {
  width: 58px;
  height: 58px;
  margin-bottom: 12px;
}

.tfa-flow--dark.tfa-flow--standalone {
  background:
    radial-gradient(760px 340px at 50% -16%, rgba(37, 98, 235, 0.16), transparent 62%),
    linear-gradient(180deg, #07111f 0%, #0d1b2a 100%) !important;
}

.tfa-flow--dark .tfa-flow__title,
.tfa-flow--dark .tfa-flow__card-title,
.tfa-flow--dark .tfa-flow__key-value {
  color: #ffffff !important;
}

.tfa-flow--dark .tfa-flow__card,
.tfa-flow--dark .tfa-flow__state-card,
.tfa-flow--dark .tfa-flow__qr-shell,
.tfa-flow--dark .tfa-flow__input,
.tfa-flow--dark .tfa-flow__key-box {
  background: rgba(30, 39, 59, 0.96) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.28) !important;
}

.tfa-flow--dark .tfa-flow__card--success {
  background: rgba(22, 101, 52, 0.2) !important;
  border-color: rgba(34, 197, 94, 0.28) !important;
}

.tfa-flow--dark .tfa-flow__card-text,
.tfa-flow--dark .tfa-flow__state-text,
.tfa-flow--dark .tfa-flow__list li,
.tfa-flow--dark .tfa-flow__hint,
.tfa-flow--dark .tfa-flow__label {
  color: #94a3b8 !important;
}

.tfa-flow--dark .tfa-flow__input {
  color: #ffffff !important;
}

.tfa-flow--dark .tfa-flow__button--primary {
  background: linear-gradient(135deg, #2562eb, #3882fa) !important;
  color: #ffffff !important;
}

.tfa-flow--dark .tfa-flow__button--secondary {
  background: rgba(13, 27, 42, 0.58) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  color: #ffffff !important;
}

.tfa-flow--dark .tfa-flow__surface {
  background: transparent !important;
}

.tfa-flow--dark .tfa-flow__qr-placeholder {
  color: #94a3b8 !important;
}

.tfa-flow--dark .tfa-flow__list li::marker {
  color: #60a5fa !important;
}
</style>
