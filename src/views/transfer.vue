<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import AppLoader from "@/components/AppLoader.vue";
import Require2FA from "@/components/Require2FA.vue";
import { useWalletStore } from "@/stores/walletStore.ts";
import backIcon from "@/assets/arrow-left.svg";
import copyIcon from "@/assets/copy.svg";
import safetyIcon from "@/assets/safety.svg";

const { t } = useI18n();
const router = useRouter();
const walletStore = useWalletStore();

const amount = ref("");
const recipientWallet = ref("");
const myWallet = ref("");
const twoFactorCode = ref("");
const isTwoFactorSetupComplete = ref(false);
const isLoading = ref(true);
const isTransferring = ref(false);
const showNotice = ref(false);
const walletCopied = ref(false);
const fallbackRootRef = ref(null);

const ACCESS_TIMEOUT_MS = 9000;
const WALLET_TIMEOUT_MS = 8000;

console.log("[PeekPay Transfer setup]", {
  route: router.currentRoute.value.fullPath,
  user: walletStore.user,
  userTg: walletStore.userTg,
  has2FA: walletStore.has2FA,
  storeLoading: walletStore.isLoading,
});

const withTimeout = (promise, ms, fallback) =>
  Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);

const balanceValue = computed(() => Number(walletStore.balance || 0));
const amountValue = computed(() => Number(amount.value || 0));

const isAmountAboveBalance = computed(() => amountValue.value > balanceValue.value);
const isAmountTooSmall = computed(() => amount.value !== "" && amountValue.value > 0 && amountValue.value < 1);

const isFormValid = computed(() => {
  const code = twoFactorCode.value.trim();
  return (
    Boolean(amount.value) &&
    Boolean(recipientWallet.value.trim()) &&
    amountValue.value >= 1 &&
    amountValue.value <= balanceValue.value &&
    code.length === 6 &&
    !isTransferring.value
  );
});

const transferState = computed(() => {
  if (isLoading.value) return "loading";
  if (!isTwoFactorSetupComplete.value) return "require-2fa";
  return "form";
});

const logFallbackDomState = async (source = "manual") => {
  await nextTick();

  const root = fallbackRootRef.value;
  const styles = root ? window.getComputedStyle(root) : null;

  console.log("[PeekPay Transfer fallback DOM]", {
    source,
    hasRoot: Boolean(root),
    rect: root?.getBoundingClientRect?.(),
    display: styles?.display,
    visibility: styles?.visibility,
    opacity: styles?.opacity,
    position: styles?.position,
    zIndex: styles?.zIndex,
    background: styles?.background,
    bodyClass: document.body.className,
  });
};

const clampAmount = (event) => {
  const value = Number(event.target.value);
  if (Number.isNaN(value) || value < 0) {
    amount.value = "";
    return;
  }

  if (value > balanceValue.value) {
    amount.value = String(balanceValue.value);
  }
};

const copyWallet = async () => {
  if (!myWallet.value) return;

  try {
    await navigator.clipboard.writeText(myWallet.value);
    walletCopied.value = true;
    walletStore.showMessage(t("wallet_copied") || t("copied"), "success", 1500);
    setTimeout(() => {
      walletCopied.value = false;
    }, 1500);
  } catch (error) {
    console.error("[PeekPay Transfer copy wallet error]", error);
  }
};

const goToTwoFactorSetup = () => {
  router.push({ name: "twoFactorAuth", query: { from: "transfer" } });
};

const closeNotice = () => {
  showNotice.value = false;
};

const handleTransfer = async () => {
  if (!isFormValid.value || isTransferring.value) return;

  if (recipientWallet.value.trim() === myWallet.value.trim()) {
    walletStore.showMessage(t("cannot_transfer_to_self"), "error");
    return;
  }

  isTransferring.value = true;

  try {
    await walletStore.transferFunds(
      recipientWallet.value.trim(),
      amount.value,
      twoFactorCode.value.trim()
    );
  } finally {
    isTransferring.value = false;
  }
};

const checkTwoFactorAccess = async () => {
  console.log("[PeekPay Transfer check2FA start]", {
    userTgId: walletStore.userTg?.id,
    userTgServerId: walletStore.user?.tg_id,
    has2FABefore: walletStore.has2FA,
    isLoading: isLoading.value,
  });

  try {
    const tgId = walletStore.user?.tg_id || walletStore.userTg?.id;
    if (!tgId) {
      console.warn("[PeekPay Transfer check2FA no tgId]", {
        user: walletStore.user,
        userTg: walletStore.userTg,
      });
      isTwoFactorSetupComplete.value = false;
      return;
    }

    const result = await withTimeout(
      walletStore.check2FAStatus(),
      ACCESS_TIMEOUT_MS,
      { timeout: true }
    );

    if (result?.timeout) {
      console.warn("[PeekPay Transfer check2FA timeout]", {
        timeoutMs: ACCESS_TIMEOUT_MS,
      });
      walletStore.showMessage(t("network_error"), "error");
      isTwoFactorSetupComplete.value = false;
      return;
    }

    console.log("[PeekPay Transfer check2FA result]", {
      result,
      has2FAAfter: walletStore.has2FA,
    });

    if (walletStore.has2FA) {
      isTwoFactorSetupComplete.value = true;
      const wallet = await withTimeout(walletStore.getUserWallet(), WALLET_TIMEOUT_MS, null);
      myWallet.value = wallet || walletStore.userWallet || "";

      console.log("[PeekPay Transfer wallet result]", {
        wallet,
        storeWallet: walletStore.userWallet,
        myWallet: myWallet.value,
      });
      return;
    }

    isTwoFactorSetupComplete.value = false;
    console.warn("[PeekPay Transfer requires 2FA fallback]", {
      expectedBranch: "require-2fa",
      has2FA: walletStore.has2FA,
    });
  } catch (error) {
    console.error("[PeekPay Transfer check2FA error]", {
      error,
      message: error?.message,
      stack: error?.stack,
      response: error?.response?.data,
      status: error?.response?.status,
    });
    isTwoFactorSetupComplete.value = false;
  } finally {
    isLoading.value = false;
    console.log("[PeekPay Transfer check2FA final]", {
      isLoading: isLoading.value,
      isTwoFactorSetupComplete: isTwoFactorSetupComplete.value,
      has2FA: walletStore.has2FA,
      branch: transferState.value,
    });
  }
};

onMounted(async () => {
  console.log("[PeekPay Transfer mounted]", {
    route: router.currentRoute.value.fullPath,
    has2FA: walletStore.has2FA,
  });

  const loadingGuard = setTimeout(() => {
    if (!isLoading.value) return;

    console.warn("[PeekPay Transfer loading guard fired]", {
      accessTimeoutMs: ACCESS_TIMEOUT_MS,
      walletTimeoutMs: WALLET_TIMEOUT_MS,
    });
    isLoading.value = false;
    isTwoFactorSetupComplete.value = false;
    walletStore.showMessage(t("network_error"), "error");
  }, ACCESS_TIMEOUT_MS + WALLET_TIMEOUT_MS + 1000);

  await checkTwoFactorAccess();
  clearTimeout(loadingGuard);

  if (!isTwoFactorSetupComplete.value) {
    await logFallbackDomState("after-check2FA");
  } else {
    setTimeout(() => {
      showNotice.value = true;
    }, 400);
  }
});

watch(
  () => ({
    state: transferState.value,
    isLoading: isLoading.value,
    isTwoFactorSetupComplete: isTwoFactorSetupComplete.value,
    has2FA: walletStore.has2FA,
    storeLoading: walletStore.isLoading,
    showNotice: showNotice.value,
  }),
  async (state) => {
    console.log("[PeekPay Transfer render state]", state);
    if (state.state === "require-2fa") {
      await logFallbackDomState("watch-require-2fa");
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="transfer-view">
    <section v-if="isLoading" class="transfer-view__state transfer-view__state--loading">
      <div class="transfer-view__state-card">
        <AppLoader />
        <h2>{{ t("loading") }}...</h2>
        <p>{{ t("transfer_2fa_required") }}</p>
      </div>
    </section>

    <div v-else-if="!isTwoFactorSetupComplete" ref="fallbackRootRef" class="transfer-view__require-shell">
      <Require2FA />
    </div>

    <div v-else class="transfer-view__shell">
      <header class="transfer-view__header">
        <button class="transfer-view__back" type="button" @click="walletStore.goBack()">
          <img :src="backIcon" alt="Back" />
        </button>
        <div class="transfer-view__header-copy">
          <p class="transfer-view__eyebrow">PeekPay</p>
          <h1>{{ t("transfer_page") }}</h1>
        </div>
        <div class="transfer-view__header-spacer"></div>
      </header>

      <main class="transfer-view__content">
        <section class="transfer-view__panel transfer-view__panel--wallet">
          <div class="transfer-view__panel-top">
            <div>
              <p class="transfer-view__label">{{ t("my_wallet") }}</p>
              <h2 class="transfer-view__title">{{ t("wallet_number") }}</h2>
            </div>
            <span class="transfer-view__pill">{{ t("tap_to_copy_wallet") || "Tap to copy" }}</span>
          </div>

          <button
            class="transfer-view__wallet-card"
            :class="{ 'is-copied': walletCopied }"
            type="button"
            @click="copyWallet"
          >
            <div class="transfer-view__wallet-meta">
              <span class="transfer-view__wallet-caption">{{ t("wallet_number") }}</span>
              <strong class="transfer-view__wallet-value">
                {{ myWallet || t("loading") }}
              </strong>
            </div>
            <img class="transfer-view__wallet-icon" :src="copyIcon" alt="Copy" />
          </button>
        </section>

        <section class="transfer-view__panel transfer-view__panel--form">
          <div class="transfer-view__section-heading">
            <p class="transfer-view__label">UID</p>
            <h2 class="transfer-view__title">{{ t("transfer_funds") }}</h2>
          </div>

          <label class="transfer-view__field">
            <span>{{ t("recipient_wallet_number") }}</span>
            <input
              v-model="recipientWallet"
              type="text"
              autocomplete="off"
              :disabled="isTransferring"
              :placeholder="t('recipient_wallet_number')"
            />
          </label>

          <label class="transfer-view__field">
            <span>{{ t("select_amount") }}</span>
            <div class="transfer-view__amount-wrap">
              <input
                v-model="amount"
                type="number"
                min="0"
                :max="walletStore.balance"
                :disabled="isTransferring"
                :placeholder="t('select_amount')"
                @input="clampAmount"
              />
              <strong>USDT</strong>
            </div>
          </label>

          <p v-if="isAmountAboveBalance" class="transfer-view__error">
            {{ t("insufficient_balance") || "Недостаточно средств на балансе" }}
          </p>
          <p v-else-if="isAmountTooSmall" class="transfer-view__error">
            {{ t("minimum_transfer_amount") }}
          </p>

          <div class="transfer-view__balance-row">
            <span>{{ t("available_balance") }}</span>
            <strong>{{ walletStore.roundToHundredths(balanceValue) }} USDT</strong>
          </div>

          <label class="transfer-view__field">
            <span>{{ t("enter_2fa_code") }}</span>
            <input
              v-model="twoFactorCode"
              type="text"
              inputmode="numeric"
              maxlength="6"
              autocomplete="one-time-code"
              :disabled="isTransferring"
              :placeholder="t('enter_6_digit_code')"
            />
          </label>
        </section>

        <button
          class="transfer-view__submit"
          :class="{ 'is-disabled': !isFormValid || isTransferring }"
          type="button"
          :disabled="!isFormValid || isTransferring"
          @click="handleTransfer"
        >
          <AppLoader v-if="isTransferring" class="transfer-view__button-loader" />
          <span v-else>{{ t("transfer_funds") }}</span>
        </button>
      </main>

      <div v-if="showNotice" class="transfer-view__notice-scrim" @click="closeNotice">
        <section class="transfer-view__notice" @click.stop>
          <div class="transfer-view__notice-head">
            <div>
              <p class="transfer-view__label">PeekPay</p>
              <h3>{{ t("transfer_modal_title") }}</h3>
            </div>
            <button class="transfer-view__notice-close" type="button" @click="closeNotice">
              &times;
            </button>
          </div>
          <p>{{ t("transfer_modal_text") }}</p>
          <button class="transfer-view__primary" type="button" @click="closeNotice">
            {{ t("transfer_modal_button") }}
          </button>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.transfer-view {
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
  background:
    radial-gradient(820px 360px at 50% -18%, #dbeafe 0%, transparent 62%),
    #f1f5f9;
  color: #0f172a;
}

.transfer-view__shell {
  min-height: 100vh;
  min-height: 100dvh;
  padding: 18px 16px calc(132px + env(safe-area-inset-bottom));
}

.transfer-view__require-shell {
  min-height: 100vh;
  min-height: 100dvh;
}

.transfer-view__header {
  display: grid;
  grid-template-columns: 48px 1fr 48px;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.transfer-view__header-copy {
  display: grid;
  justify-items: center;
  gap: 4px;
}

.transfer-view__eyebrow,
.transfer-view__label {
  margin: 0;
  font-size: 12px;
  line-height: 16px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #2563eb;
}

.transfer-view__header h1,
.transfer-view__state-card h2,
.transfer-view__title,
.transfer-view__notice h3 {
  margin: 0;
  color: #0f172a;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.transfer-view__header h1 {
  font-size: 30px;
  line-height: 34px;
  text-align: center;
}

.transfer-view__back {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  border: 1px solid #dbe3ef;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.transfer-view__back img {
  width: 22px;
  height: 22px;
}

.transfer-view__header-spacer {
  width: 48px;
  height: 48px;
}

.transfer-view__content {
  display: grid;
  gap: 16px;
}

.transfer-view__panel,
.transfer-view__state-card,
.transfer-view__notice {
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08);
}

.transfer-view__panel {
  padding: 20px;
}

.transfer-view__panel-top,
.transfer-view__section-heading,
.transfer-view__balance-row,
.transfer-view__notice-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.transfer-view__panel-top,
.transfer-view__section-heading {
  margin-bottom: 18px;
}

.transfer-view__title {
  font-size: 24px;
  line-height: 28px;
}

.transfer-view__pill {
  padding: 8px 12px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1e40af;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.transfer-view__wallet-card {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 18px;
  border-radius: 20px;
  background: linear-gradient(135deg, #2563eb, #1e40af);
  box-shadow: 0 16px 32px rgba(37, 99, 235, 0.22);
}

.transfer-view__wallet-card.is-copied {
  background: linear-gradient(135deg, #10b981, #0f9f6e);
}

.transfer-view__wallet-meta {
  display: grid;
  gap: 6px;
  min-width: 0;
  text-align: left;
}

.transfer-view__wallet-caption {
  font-size: 12px;
  line-height: 16px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.72);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.transfer-view__wallet-value {
  font-size: 18px;
  line-height: 24px;
  font-weight: 800;
  color: #ffffff;
  word-break: break-word;
}

.transfer-view__wallet-icon {
  width: 22px;
  height: 22px;
  filter: brightness(0) invert(1);
  opacity: 0.94;
}

.transfer-view__field {
  display: grid;
  gap: 10px;
  margin-bottom: 16px;
}

.transfer-view__field span {
  font-size: 13px;
  line-height: 18px;
  font-weight: 700;
  color: #64748b;
}

.transfer-view__field input,
.transfer-view__amount-wrap {
  width: 100%;
  min-height: 56px;
  border-radius: 18px;
  border: 1px solid #dbe3ef;
  background: #f8fafc;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.transfer-view__field input {
  padding: 0 16px;
  color: #0f172a;
  font-size: 16px;
  font-weight: 600;
}

.transfer-view__field input::placeholder {
  color: #94a3b8;
}

.transfer-view__amount-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
}

.transfer-view__amount-wrap input {
  min-height: 54px;
  border: 0;
  background: transparent;
  box-shadow: none;
  padding: 0;
}

.transfer-view__amount-wrap strong {
  font-size: 15px;
  line-height: 20px;
  font-weight: 800;
  color: #0f172a;
}

.transfer-view__balance-row {
  margin: 4px 0 16px;
  padding: 14px 16px;
  border-radius: 18px;
  background: #f8fafc;
  color: #64748b;
  font-size: 14px;
  line-height: 18px;
  font-weight: 600;
}

.transfer-view__balance-row strong {
  color: #0f172a;
  font-weight: 800;
}

.transfer-view__error {
  margin: -6px 0 12px;
  color: #ef4444;
  font-size: 13px;
  line-height: 18px;
  font-weight: 700;
}

.transfer-view__submit,
.transfer-view__primary,
.transfer-view__secondary {
  width: 100%;
  min-height: 56px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 18px;
  font-size: 16px;
  line-height: 20px;
  font-weight: 800;
}

.transfer-view__submit,
.transfer-view__primary {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #ffffff;
  box-shadow: 0 18px 32px rgba(37, 99, 235, 0.24);
}

.transfer-view__submit.is-disabled {
  opacity: 0.62;
}

.transfer-view__secondary {
  background: #ffffff;
  color: #1e40af;
  border: 1px solid #dbe3ef;
}

.transfer-view__button-loader {
  width: 22px !important;
  height: 22px !important;
}

.transfer-view__state {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px calc(132px + env(safe-area-inset-bottom));
}

.transfer-view__state-card {
  width: min(100%, 380px);
  display: grid;
  justify-items: center;
  gap: 14px;
  padding: 28px 22px;
  text-align: center;
}

.transfer-view__state-card p {
  margin: 0;
  color: #64748b;
  font-size: 15px;
  line-height: 22px;
  font-weight: 600;
}

.transfer-view__state-actions {
  width: 100%;
  display: grid;
  gap: 10px;
  margin-top: 6px;
}

.transfer-view__shield {
  width: 84px;
  height: 84px;
  display: grid;
  place-items: center;
  border-radius: 28px;
  background: linear-gradient(135deg, #dbeafe, #eff6ff);
}

.transfer-view__shield img {
  width: 42px;
  height: 42px;
  filter: invert(33%) sepia(83%) saturate(1750%) hue-rotate(211deg) brightness(96%) contrast(95%);
}

.transfer-view__notice-scrim {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  align-items: flex-end;
  padding: 16px 16px calc(110px + env(safe-area-inset-bottom));
  background: rgba(15, 23, 42, 0.38);
  backdrop-filter: blur(6px);
}

.transfer-view__notice {
  width: 100%;
  padding: 20px;
}

.transfer-view__notice-head {
  margin-bottom: 14px;
}

.transfer-view__notice-close {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: #eff6ff;
  color: #1e40af;
  font-size: 26px;
  line-height: 1;
}

.transfer-view__notice p {
  margin: 0 0 18px;
  color: #475569;
  font-size: 15px;
  line-height: 22px;
  font-weight: 600;
}

@media (max-width: 360px) {
  .transfer-view__header h1 {
    font-size: 26px;
    line-height: 30px;
  }

  .transfer-view__title {
    font-size: 22px;
    line-height: 26px;
  }

  .transfer-view__panel {
    padding: 18px;
  }
}

:global(.dark-theme) .transfer-view {
  background:
    radial-gradient(760px 340px at 50% -16%, rgba(37, 98, 235, 0.16), transparent 62%),
    linear-gradient(180deg, #07111f 0%, #0d1b2a 100%) !important;
  color: #ffffff;
}

:global(.dark-theme) .transfer-view__panel,
:global(.dark-theme) .transfer-view__state-card,
:global(.dark-theme) .transfer-view__notice,
:global(.dark-theme) .transfer-view__back,
:global(.dark-theme) .transfer-view__secondary,
:global(.dark-theme) .transfer-view__field input,
:global(.dark-theme) .transfer-view__amount-wrap,
:global(.dark-theme) .transfer-view__balance-row {
  background: rgba(30, 39, 59, 0.96) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.28) !important;
}

:global(.dark-theme) .transfer-view__header h1,
:global(.dark-theme) .transfer-view__title,
:global(.dark-theme) .transfer-view__state-card h2,
:global(.dark-theme) .transfer-view__notice h3,
:global(.dark-theme) .transfer-view__amount-wrap strong,
:global(.dark-theme) .transfer-view__balance-row strong,
:global(.dark-theme) .transfer-view__field input,
:global(.dark-theme) .transfer-view__secondary {
  color: #ffffff !important;
}

:global(.dark-theme) .transfer-view__field span,
:global(.dark-theme) .transfer-view__state-card p,
:global(.dark-theme) .transfer-view__balance-row,
:global(.dark-theme) .transfer-view__notice p {
  color: #94a3b8 !important;
}

:global(.dark-theme) .transfer-view__field input::placeholder {
  color: rgba(255, 255, 255, 0.42) !important;
}

:global(.dark-theme) .transfer-view__back img,
:global(.dark-theme) .transfer-view__shield img {
  filter: brightness(0) invert(1) !important;
}

:global(.dark-theme) .transfer-view__pill {
  background: rgba(37, 98, 235, 0.18) !important;
  color: #dbeafe !important;
}

:global(.dark-theme) .transfer-view__notice-scrim {
  background: rgba(2, 8, 23, 0.6) !important;
}

:global(.dark-theme) .transfer-view__notice-close {
  background: rgba(37, 98, 235, 0.18) !important;
  color: #ffffff !important;
}
</style>
