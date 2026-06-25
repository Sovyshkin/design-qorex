<script setup>
import { useI18n } from "vue-i18n";
import { useWalletStore } from '@/stores/walletStore.ts'
import { ref, computed, nextTick, onMounted, watch } from "vue";
import AppLoader from '@/components/AppLoader.vue';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const walletStore = useWalletStore();
const router = useRouter();
const amount = ref("");
const recipientWallet = ref("");
const myWallet = ref("");
const twoFactorCode = ref("");
const twoFactorKey = ref("");
const isTwoFactorSetupComplete = ref(false); // Новое состояние для подтверждения успешного подключения 2FA
const isLoading = ref(true); // Состояние загрузки для показа анимации
const isTransferring = ref(false); // Состояние загрузки для кнопки перевода
const walletCopied = ref(false);
const requireScreenRef = ref(null);
const requireCardRef = ref(null);
const ACCESS_TIMEOUT_MS = 9000;
const WALLET_TIMEOUT_MS = 8000;

console.log('[PeekPay Transfer setup]', {
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

const isFormValid = computed(() => {
  const code = twoFactorCode.value.trim();
  const amountNum = parseFloat(amount.value);
  const valid = amount.value &&
         recipientWallet.value &&
         amountNum >= 1 &&
         amountNum <= walletStore.balance &&
         code.length === 6 &&
         !isTransferring.value

  console.log('Form validation:', {
    amount: amount.value,
    amountNum,
    balance: walletStore.balance,
    recipientWallet: recipientWallet.value,
    twoFactorCode: code,
    twoFactorCodeLength: code.length,
    has2FA: walletStore.has2FA,
    isTransferring: isTransferring.value,
    valid
  });

  return valid;
});

const showModal = ref(false);const handleTransfer = async () => {
  if (!isFormValid.value || isTransferring.value) return;
  
  // Проверка, что не переводим самому себе
  if (recipientWallet.value === myWallet.value) {
    walletStore.showMessage(t('cannot_transfer_to_self'), 'error');
    return;
  }
  
  isTransferring.value = true;
  try {
    await walletStore.transferFunds(recipientWallet.value, amount.value, twoFactorCode.value.trim());
  } finally {
    isTransferring.value = false;
  }
};

const copyKey = () => {
  if (twoFactorKey.value) {
    navigator.clipboard.writeText(twoFactorKey.value);
    walletStore.showMessage(t('key_copied'), 'success', 1500);
  }
};

const copyWallet = () => {
  if (myWallet.value) {
    navigator.clipboard.writeText(myWallet.value);
    walletCopied.value = true;
    walletStore.showMessage(t('wallet_copied') || t('copied'), 'success', 1500);
    setTimeout(() => {
      walletCopied.value = false;
    }, 1500);
  }
};

const preventNegativeAmount = (event) => {
  const value = parseFloat(event.target.value);
  if (value < 0) {
    amount.value = '';
  } else if (value > walletStore.balance) {
    amount.value = walletStore.balance.toString();
  }
};

const goToTwoFactorSetup = () => {
  router.push({ name: 'twoFactorAuth', query: { from: 'transfer' } });
};

const verifyTwoFactorSetup = async () => {
  const success = await walletStore.check2FAStatus();
  if (success) {
    isTwoFactorSetupComplete.value = true;
  }
};

const checkTwoFactorAccess = async () => {
  console.log('[PeekPay Transfer check2FA start]', {
    userTgId: walletStore.userTg?.id,
    userTg: walletStore.userTg,
    userTgServerId: walletStore.user?.tg_id,
    has2FABefore: walletStore.has2FA,
    isLoading: isLoading.value,
    storeLoading: walletStore.isLoading,
  });

  try {
    const tgId = walletStore.user?.tg_id || walletStore.userTg?.id;
    if (!tgId) {
      console.warn('[PeekPay Transfer check2FA no tgId]', {
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
      console.warn('[PeekPay Transfer check2FA timeout]', {
        timeoutMs: ACCESS_TIMEOUT_MS,
        result,
      });
      walletStore.showMessage(t('network_error') || 'Проблема с подключением к серверу', 'error');
      isTwoFactorSetupComplete.value = false;
      return;
    }

    console.log('[PeekPay Transfer check2FA result]', {
      result,
      has2FAAfter: walletStore.has2FA,
    });

    if (walletStore.has2FA) {
      isTwoFactorSetupComplete.value = true;
      const wallet = await withTimeout(walletStore.getUserWallet(), WALLET_TIMEOUT_MS, null);
      myWallet.value = wallet || walletStore.userWallet || "";
      console.log('[PeekPay Transfer wallet result]', {
        wallet,
        storeWallet: walletStore.userWallet,
        myWallet: myWallet.value,
      });
    } else {
      isTwoFactorSetupComplete.value = false;
      console.warn('[PeekPay Transfer requires 2FA fallback]', {
        has2FA: walletStore.has2FA,
        expectedBranch: 'require-2fa-screen',
      });
    }
  } catch (error) {
    console.error('[PeekPay Transfer check2FA error]', {
      error,
      message: error?.message,
      stack: error?.stack,
      response: error?.response?.data,
      status: error?.response?.status,
    });
    // Если ошибка в fa_take, значит 2FA не настроен, показываем Require2FA
    isTwoFactorSetupComplete.value = false;
  } finally {
    // Всегда завершаем загрузку
    isLoading.value = false;
    console.log('[PeekPay Transfer check2FA final]', {
      isLoading: isLoading.value,
      isTwoFactorSetupComplete: isTwoFactorSetupComplete.value,
      has2FA: walletStore.has2FA,
      branch: isTwoFactorSetupComplete.value ? 'form' : 'require-2fa-screen',
    });
  }
};

const closeModal = () => {
  showModal.value = false;
};

const logRequire2FADomState = async (source = 'manual') => {
  await nextTick();

  const screen = requireScreenRef.value;
  const card = requireCardRef.value;
  const screenStyles = screen ? window.getComputedStyle(screen) : null;
  const cardStyles = card ? window.getComputedStyle(card) : null;

  console.log('[PeekPay Transfer require 2FA DOM]', {
    source,
    hasScreen: Boolean(screen),
    hasCard: Boolean(card),
    screenRect: screen?.getBoundingClientRect?.(),
    cardRect: card?.getBoundingClientRect?.(),
    screenDisplay: screenStyles?.display,
    screenVisibility: screenStyles?.visibility,
    screenOpacity: screenStyles?.opacity,
    screenBackground: screenStyles?.background,
    screenZIndex: screenStyles?.zIndex,
    cardDisplay: cardStyles?.display,
    cardVisibility: cardStyles?.visibility,
    cardOpacity: cardStyles?.opacity,
    cardBackground: cardStyles?.background,
    bodyClass: document.body.className,
    appHtml: document.querySelector('#app')?.innerHTML?.slice(0, 1200),
  });
};

onMounted(async () => {
  console.log('[PeekPay Transfer mounted]', {
    isLoading: isLoading.value,
    isTwoFactorSetupComplete: isTwoFactorSetupComplete.value,
    has2FA: walletStore.has2FA,
    route: router.currentRoute.value.fullPath,
  });

  const loadingGuard = setTimeout(() => {
    if (isLoading.value) {
      console.warn('[PeekPay Transfer loading guard fired]', {
        accessTimeoutMs: ACCESS_TIMEOUT_MS,
        walletTimeoutMs: WALLET_TIMEOUT_MS,
      });
      isLoading.value = false;
      isTwoFactorSetupComplete.value = false;
      walletStore.showMessage(t('network_error') || 'Проблема с подключением к серверу', 'error');
    }
  }, ACCESS_TIMEOUT_MS + WALLET_TIMEOUT_MS + 1000);

  // Проверяем доступ к странице перевода через 2FA
  await checkTwoFactorAccess();
  clearTimeout(loadingGuard);

  if (!isTwoFactorSetupComplete.value) {
    await logRequire2FADomState('after-check2FA');
  }
  
  if (isTwoFactorSetupComplete.value) {
    setTimeout(() => {
      showModal.value = true;
    }, 500);
  }
});

watch(
  () => ({
    isLoading: isLoading.value,
    isTwoFactorSetupComplete: isTwoFactorSetupComplete.value,
    has2FA: walletStore.has2FA,
    storeLoading: walletStore.isLoading,
    showModal: showModal.value,
    branch: isLoading.value ? 'loading' : isTwoFactorSetupComplete.value ? 'form' : 'require-2fa-screen',
  }),
  (state) => {
    console.log('[PeekPay Transfer render state]', state);
    if (!state.isLoading && !state.isTwoFactorSetupComplete) {
      logRequire2FADomState('watch-require-2fa');
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="transfer-page">
    <!-- Показываем загрузку пока проверяем статус 2FA -->
    <div v-if="isLoading" class="loading-screen">
      <div class="loading-card">
        <AppLoader />
        <h2>{{ t('loading') }}...</h2>
        <p>{{ t('transfer_2fa_required') || 'Проверяем доступ к переводам' }}</p>
      </div>
    </div>

    <section v-else-if="!isTwoFactorSetupComplete" ref="requireScreenRef" class="require-2fa-screen">
      <div ref="requireCardRef" class="require-2fa-card">
        <div class="require-2fa-icon">
          <img src="/assets/safety.svg" alt="Security" />
        </div>
        <h2>{{ t('require_2fa_title') || 'Требуется 2FA' }}</h2>
        <p>{{ t('require_2fa_description') || 'Для использования функции переводов необходимо включить двухфакторную аутентификацию.' }}</p>
        <div class="require-2fa-actions">
          <button class="require-primary" type="button" @click="goToTwoFactorSetup">
            {{ t('enable_2fa') || 'Включить 2FA' }}
          </button>
          <button class="require-secondary" type="button" @click="walletStore.goBack()">
            {{ t('go_back') || 'Назад' }}
          </button>
        </div>
      </div>
    </section>

    <!-- Показываем форму перевода, если 2FA успешно подключен -->
    <div v-else>
      <transition name="fade-down" appear>
        <header class="header">
          <img
            class="arrow"
            src="../assets/arrow-left.svg"
            alt=""
            @click="walletStore.goBack()"
          />
          <h1>{{ t("transfer_page") }}</h1>
          <div class="emp"></div>
        </header>
      </transition>
      <main class="container">
      <!-- Мой кошелек -->
      <div class="my-wallet-section">
        <div class="section-header">
          <h3>{{ t('my_wallet') }}</h3>
        </div>
        <div class="wallet-card" :class="{ copied: walletCopied }" @click="copyWallet">
          <div class="wallet-info">
            <span class="wallet-label">{{ t('wallet_number') }}</span>
            <span class="wallet-number">{{ myWallet || t('loading') }}</span>
          </div>
          <img src="../assets/copy.svg" alt="copy" class="copy-icon" />
        </div>
      </div>

      <!-- Форма перевода -->
      <div class="form-container">
        <h3>{{ t('transfer_to_user') }}</h3>

        <input 
          type="text" 
          :placeholder="t('recipient_wallet_number')" 
          v-model="recipientWallet"
          :disabled="isTransferring"
          required
        />

        <div class="group">
          <input 
            type="number" 
            :placeholder="t('select_amount')" 
            v-model="amount"
            min="0"
            :max="walletStore.balance"
            :disabled="isTransferring"
            :class="{ 'error': parseFloat(amount) > walletStore.balance }"
            @input="preventNegativeAmount"
          />
          <span class="group-item">USDT</span>
        </div>

        <div v-if="parseFloat(amount) > walletStore.balance" class="error-message">
          {{ t('insufficient_balance') || 'Недостаточно средств на балансе' }}
        </div>

        <div v-if="parseFloat(amount) > 0 && parseFloat(amount) < 1" class="error-message">
          {{ t('minimum_transfer_amount') }}
        </div>

        <div class="balance-info">
          <span>{{ t('available_balance') }}:</span>
          <span class="balance-value">{{ walletStore.roundToHundredths(walletStore.balance) }} USDT</span>
        </div>

        <div class="code-input-section">
          <h4>{{ t('enter_2fa_code') }}</h4>
          <input 
            type="text" 
            v-model="twoFactorCode"
            :placeholder="t('enter_6_digit_code')"
            :disabled="isTransferring"
            maxlength="6"
            pattern="[0-9]*"
            inputmode="numeric"
            class="code-input"
          />
        </div>
      </div>

      <button 
        class="btn" 
        :class="{ disabled: !isFormValid || isTransferring }"
        :disabled="!isFormValid || isTransferring"
        @click="handleTransfer()"
      >
        <AppLoader v-if="isTransferring" class="btn-loader" />
        <span v-else>{{ t("transfer_funds") }}</span>
      </button>
      </main>

      <!-- Модальное окно -->
      <div v-if="showModal" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>{{ t('transfer_modal_title') }}</h3>
            <button class="close-btn" @click="closeModal">&times;</button>
          </div>
          <div class="modal-body">
            <img src="../assets/error.svg" alt="warning" class="modal-icon" />
            <p>{{ t('transfer_modal_text') }}</p>
          </div>
          <div class="modal-footer">
            <button class="modal-btn" @click="closeModal">{{ t('transfer_modal_button') }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.transfer-page {
  position: relative;
  isolation: isolate;
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  background: #f1f5f9;
  overflow-x: hidden;
}

.require-2fa-screen {
  position: relative !important;
  z-index: 30 !important;
  width: 100% !important;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 20px 16px calc(132px + env(safe-area-inset-bottom)) !important;
  background:
    radial-gradient(820px 360px at 50% -18%, #dbeafe 0%, transparent 62%),
    #f1f5f9 !important;
  opacity: 1 !important;
  visibility: visible !important;
}

.require-2fa-card {
  position: relative !important;
  z-index: 31 !important;
  width: min(100%, 380px) !important;
  max-width: 380px !important;
  display: grid !important;
  justify-items: center !important;
  gap: 14px !important;
  padding: 26px 20px !important;
  border-radius: 24px !important;
  border: 1px solid #e2e8f0 !important;
  background: rgba(255, 255, 255, 0.96) !important;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08) !important;
  text-align: center !important;
  opacity: 1 !important;
  visibility: visible !important;
  transform: none !important;
}

.require-2fa-icon {
  width: 82px;
  height: 82px;
  border-radius: 28px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #dbeafe, #eff6ff);
}

.require-2fa-icon img {
  width: 42px;
  height: 42px;
  filter: invert(34%) sepia(98%) saturate(1817%) hue-rotate(211deg) brightness(95%) contrast(95%);
}

.require-2fa-card h2 {
  margin: 0;
  color: #0f172a;
  font-size: 24px;
  line-height: 29px;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.require-2fa-card p {
  max-width: 320px;
  margin: 0;
  color: #64748b;
  font-size: 15px;
  line-height: 22px;
  font-weight: 550;
}

.require-2fa-actions {
  width: 100%;
  display: grid;
  gap: 10px;
  margin-top: 4px;
}

.require-primary,
.require-secondary {
  min-height: 52px;
  border-radius: 16px;
  font-size: 15px;
  font-weight: 750;
}

.require-primary {
  background: linear-gradient(135deg, #2563eb, #1e40af);
  color: #ffffff;
  box-shadow: 0 14px 28px rgba(37, 99, 235, 0.24);
}

.require-secondary {
  background: #ffffff;
  border: 1px solid #dbeafe;
  color: #1e40af;
}

.header {
  padding: 20px 15px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.emp {
  width: 32px;
}

h1 {
  color: #0F172A;
}

.container {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 20px 0 120px 0;
  overflow-y: auto;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  min-height: calc(100vh - 80px);
}

.my-wallet-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 20px;
}

.section-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.wallet-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 2px solid transparent;
  background-clip: padding-box;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 4px 16px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  position: relative;
  overflow: hidden;
}

.wallet-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
  transition: left 0.6s ease;
}

.wallet-card:hover::before {
  left: 100%;
}

.wallet-card:hover {
  border-color: #2563EB;
  transform: translateY(-2px) scale(1.01);
  box-shadow: 
    0 16px 48px rgba(0, 0, 0, 0.12),
    0 8px 24px rgba(222, 236, 81, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.wallet-card.copied {
  border-color: #10b981;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  animation: walletCopiedPulse 0.8s cubic-bezier(0.4, 0.0, 0.2, 1);
  box-shadow: 0 0 32px rgba(16, 185, 129, 0.3);
}

.wallet-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  z-index: 1;
}

.wallet-label {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.wallet-number {
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
  font-size: 15px;
  color: #1e293b;
  font-weight: 600;
  letter-spacing: 1px;
  word-break: break-all;
  word-wrap: break-word;
  max-width: 100%;
  overflow-wrap: break-word;
}

.copy-icon {
  width: 24px;
  height: 24px;
  opacity: 0.7;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.wallet-card:hover .copy-icon {
  opacity: 1;
  transform: scale(1.1);
}

.hint {
  font-size: 12px;
  color: #666;
  margin: 0;
  padding-left: 4px;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px 20px;
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  border: 2px solid transparent;
  background-clip: padding-box;
  border-radius: 0;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.1),
    0 8px 24px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  position: relative;
  overflow: hidden;
  width: 100%;
  margin: 0;
}

.form-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #2563EB, #3B82F6, #1E40AF);
}

.form-container h3 {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  text-align: center;
  background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.btn {
  width: calc(100% - 40px);
  margin: 16px 20px 0 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px 24px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 17px;
  color: #1a1a1a;
  background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%);
  border: none;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
  box-shadow: 
    0 12px 32px rgba(222, 236, 81, 0.3),
    0 6px 16px rgba(222, 236, 81, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;
  margin-top: 16px;
}

.btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.6s ease;
}

.btn:hover:not(.disabled)::before {
  left: 100%;
}

.btn:hover:not(.disabled) {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 
    0 20px 40px rgba(222, 236, 81, 0.4),
    0 10px 20px rgba(222, 236, 81, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.btn:active:not(.disabled) {
  transform: translateY(-1px) scale(0.99);
}

.btn.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  color: #64748b;
  box-shadow: none;
}

.btn-loader {
  width: 20px !important;
  height: 20px !important;
}

input.error {
  border-color: #dc3545;
  background-color: rgba(220, 53, 69, 0.05);
}

.error-message {
  color: #dc3545;
  font-size: 12px;
  margin-top: -8px;
  margin-bottom: 8px;
}

input,
textarea,
select {
  width: 100%;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  outline: none;
  font-size: 16px;
  font-weight: 500;
  color: #1e293b;
  caret-color: #000000;
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

input:focus,
textarea:focus,
select:focus {
  border-color: #2563EB;
  background: #ffffff;
  box-shadow: 
    0 0 0 4px rgba(222, 236, 81, 0.1),
    0 8px 24px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  transform: translateY(-2px);
}

input::placeholder,
textarea::placeholder,
select::placeholder {
  color: #a5a5a5;
  font-weight: 400;
  font-size: 14px;
  line-height: 19.12px;
}

.group {
  position: relative;
}

.group-item {
  position: absolute;
  right: 12%;
  top: 50%;
  transform: translateY(-50%);
  font-weight: 500;
}

.balance-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border: 1px solid #cbd5e1;
  border-radius: 16px;
  font-size: 15px;
  position: relative;
  overflow: hidden;
}

.balance-info::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #2563EB 0%, #3B82F6 100%);
}

.balance-value {
  font-weight: 700;
  color: #1e293b;
  font-size: 16px;
}

.code-input-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.code-input-section h4 {
  font-size: 14px;
  font-weight: 500;
  color: #0F172A;
  margin: 0;
}

.code-input {
  width: 100%;
  border: 2px solid #e2e8f0 !important;
  border-radius: 16px !important;
  padding: 20px !important;
  font-size: 16px !important;
  text-align: center;
  letter-spacing: 4px;
  font-weight: 500;
  color: #1e293b;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%) !important;
  outline: none;
  caret-color: #2563EB !important;
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1) !important;
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.8) !important;
}

.code-input:focus {
  border-color: #2563EB !important;
  background: #ffffff !important;
  box-shadow: 
    0 0 0 4px rgba(222, 236, 81, 0.1),
    0 8px 24px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9) !important;
  transform: translateY(-2px) !important;
}

.code-input::placeholder {
  letter-spacing: normal !important;
  font-size: 14px !important;
  color: #a5a5a5 !important;
}

.info-block {
  display: flex;
  gap: 12px;
  padding: 16px;
  background-color: #fff3cd;
  border-radius: 12px;
  border: 1px solid #ffc107;
}

.info-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.info-block p {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: #856404;
}

.arrow {
  height: 32px;
  width: 32px;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.arrow:hover {
  transform: translateX(-3px);
}

/* Анимации */
.fade-scale-enter-active {
  transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-scale-enter-from {
  opacity: 0;
  transform: scale(0.7) translateY(50px);
}

.fade-down-enter-active {
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-down-enter-from {
  opacity: 0;
  transform: translateY(-40px);
}

.slide-up-enter-active {
  transition: all 1.2s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: 0.2s;
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(60px);
}

/* Стили для настройки 2FA */
.two-factor-setup {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 160px);
  padding: 32px 24px;
  text-align: center;
}

.two-factor-setup .icon-container {
  width: 120px;
  height: 120px;
  margin-bottom: 24px;
}

.two-factor-setup .security-icon {
  width: 100%;
  height: 100%;
  opacity: 0.8;
}

.two-factor-setup h2 {
  font-size: 24px;
  font-weight: 600;
  color: #0F172A;
  margin: 0 0 12px 0;
}

.two-factor-setup .description {
  font-size: 16px;
  color: #666;
  line-height: 1.5;
  margin: 0 0 24px 0;
}

.key-section {
  width: 100%;
  max-width: 400px;
  margin-bottom: 24px;
}

.key-section h4 {
  font-size: 16px;
  font-weight: 500;
  color: #0F172A;
  margin: 0 0 12px 0;
}

.key-container {
  background-color: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 8px;
}

.key-container:hover {
  border-color: #2563EB;
  background-color: #fff;
}

.key-text {
  font-family: monospace;
  font-size: 14px;
  color: #0F172A;
  word-break: break-all;
  flex: 1;
  margin-right: 12px;
}

.key-container .copy-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.hint {
  font-size: 12px;
  color: #666;
  margin: 0;
}

.two-factor-setup .btn-primary {
  width: 100%;
  max-width: 300px;
  padding: 14px 16px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 16px;
  color: #0F172A;
  background-color: #2563EB;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.two-factor-setup .btn-primary:hover {
  opacity: 0.9;
}

/* Дополнительные эффекты */
.container {
  animation: pageAppear 1s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: 0.1s;
}

@keyframes pageAppear {
  0% {
    opacity: 0;
    transform: translateY(40px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Улучшенные эффекты */
.wallet-card, .form-group, .submit-btn {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.wallet-card:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 12px 30px rgba(222, 236, 81, 0.4);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(-1px) scale(0.98);
}

@keyframes walletCopiedPulse {
  0% {
    transform: scale(1);
    border-color: #10b981;
    box-shadow: 0 8px 32px rgba(16, 185, 129, 0.2);
  }
  25% {
    transform: scale(1.03) rotateX(5deg);
    border-color: #10b981;
    box-shadow: 0 16px 48px rgba(16, 185, 129, 0.4);
  }
  50% {
    transform: scale(1.05) rotateX(0deg);
    border-color: #059669;
    box-shadow: 0 20px 60px rgba(16, 185, 129, 0.5);
  }
  75% {
    transform: scale(1.03) rotateX(-5deg);
    border-color: #10b981;
    box-shadow: 0 16px 48px rgba(16, 185, 129, 0.4);
  }
  100% {
    transform: scale(1);
    border-color: #10b981;
    box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3);
  }
}

/* Модальное окно */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: modalFadeIn 0.3s ease-out;
}

.modal-content {
  background-color: #fff;
  border-radius: 16px;
  padding: 0;
  max-width: 400px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  animation: modalSlideIn 0.3s ease-out;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #0F172A;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #666;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.close-btn:hover {
  background-color: #f8f9fa;
}

.modal-body {
  padding: 24px;
  text-align: center;
}

.modal-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
  opacity: 0.8;
}

.modal-body p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: #0F172A;
}

.modal-footer {
  padding: 16px 24px 24px;
  text-align: center;
}

.modal-btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  color: #0F172A;
  background-color: #2563EB;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.modal-btn:hover {
  opacity: 0.9;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Экран загрузки */
.loading-screen {
  display: grid;
  place-items: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 16px;
  background-color: #F1F5F9;
}

.loading-card {
  width: 100%;
  max-width: 360px;
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 26px 20px;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
  text-align: center;
}

.loading-card h2 {
  margin: 0;
  color: #0f172a;
  font-size: 20px;
  line-height: 24px;
  font-weight: 750;
}

.loading-card p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
}

/* Стили для заблокированных полей */
input:disabled,
textarea:disabled,
select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #f8f9fa !important;
}

:global(.dark-theme) .loading-screen {
  background:
    radial-gradient(720px 320px at 50% -18%, rgba(37, 98, 235, 0.18), transparent 62%),
    linear-gradient(180deg, #07111f 0%, #0d1b2a 100%) !important;
}

:global(.dark-theme) .loading-card {
  background: rgba(30, 39, 59, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.34);
}

:global(.dark-theme) .loading-card h2 {
  color: #ffffff !important;
}

:global(.dark-theme) .loading-card p {
  color: #94a3b8 !important;
}

:global(.dark-theme) .loading-screen :deep(.loader-wrap) {
  min-height: 80px;
}

:global(.dark-theme) .loading-screen :deep(.loader) {
  border-color: rgba(56, 130, 250, 0.18);
  border-top-color: #3882fa;
}

:global(.dark-theme) .container {
  background:
    radial-gradient(760px 340px at 50% -16%, rgba(37, 98, 235, 0.16), transparent 62%),
    linear-gradient(180deg, #07111f 0%, #0d1b2a 100%) !important;
}

:global(.dark-theme) .transfer-page,
:global(.dark-theme) .require-2fa-screen {
  background:
    radial-gradient(720px 320px at 50% -18%, rgba(37, 98, 235, 0.18), transparent 62%),
    linear-gradient(180deg, #07111f 0%, #0d1b2a 100%) !important;
}

:global(.dark-theme) .require-2fa-card {
  background: rgba(30, 39, 59, 0.96) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.34) !important;
}

:global(.dark-theme) .require-2fa-icon {
  background: rgba(37, 98, 235, 0.18) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
}

:global(.dark-theme) .require-2fa-icon img {
  filter: brightness(0) invert(1) opacity(0.92) !important;
}

:global(.dark-theme) .require-2fa-card h2 {
  color: #ffffff !important;
}

:global(.dark-theme) .require-2fa-card p {
  color: #cbd5e1 !important;
}

:global(.dark-theme) .require-primary {
  background: linear-gradient(135deg, #2562eb, #3882fa) !important;
  color: #ffffff !important;
  box-shadow: 0 14px 30px rgba(37, 98, 235, 0.28) !important;
}

:global(.dark-theme) .require-secondary {
  background: rgba(13, 27, 42, 0.58) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  color: #ffffff !important;
}

:global(.dark-theme) .header h1,
:global(.dark-theme) h1,
:global(.dark-theme) .section-header h3,
:global(.dark-theme) .form-container h3,
:global(.dark-theme) .code-input-section h4 {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  background: none !important;
}

:global(.dark-theme) .wallet-card,
:global(.dark-theme) .form-container,
:global(.dark-theme) .modal-content {
  background: rgba(30, 39, 59, 0.96) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.34) !important;
}

:global(.dark-theme) .wallet-card::before,
:global(.dark-theme) .form-container::before {
  display: none !important;
}

:global(.dark-theme) .wallet-label,
:global(.dark-theme) .hint,
:global(.dark-theme) .error-message,
:global(.dark-theme) .modal p {
  color: #94a3b8 !important;
}

:global(.dark-theme) .wallet-number,
:global(.dark-theme) .balance-value,
:global(.dark-theme) .left span,
:global(.dark-theme) .modal-header h3,
:global(.dark-theme) .form-container h3 {
  color: #ffffff !important;
}

:global(.dark-theme) .wallet-card.copied {
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.22), rgba(16, 185, 129, 0.12)) !important;
  border-color: rgba(16, 185, 129, 0.24) !important;
}

:global(.dark-theme) input,
:global(.dark-theme) textarea,
:global(.dark-theme) select {
  background: rgba(13, 27, 42, 0.58) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  color: #ffffff !important;
  caret-color: #3882fa !important;
  box-shadow: none !important;
}

:global(.dark-theme) input::placeholder,
:global(.dark-theme) textarea::placeholder,
:global(.dark-theme) select::placeholder {
  color: rgba(255, 255, 255, 0.42) !important;
}

:global(.dark-theme) input:focus,
:global(.dark-theme) textarea:focus,
:global(.dark-theme) select:focus {
  border-color: #3882fa !important;
  background: rgba(30, 39, 59, 0.94) !important;
  box-shadow: 0 0 0 3px rgba(56, 130, 250, 0.16) !important;
}

:global(.dark-theme) .amount-input-wrap input,
:global(.dark-theme) .code-input {
  background: rgba(13, 27, 42, 0.58) !important;
  color: #ffffff !important;
}

:global(.dark-theme) .quick {
  background: rgba(241, 245, 249, 0.94) !important;
  color: #1e40af !important;
}

:global(.dark-theme) .quick.active {
  background: linear-gradient(135deg, #2562eb, #3882fa) !important;
  color: #ffffff !important;
}

:global(.dark-theme) .network {
  background: rgba(13, 27, 42, 0.46) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
}

:global(.dark-theme) .network.active {
  background: rgba(37, 98, 235, 0.18) !important;
  border-color: rgba(56, 130, 250, 0.42) !important;
}

:global(.dark-theme) .dot,
:global(.dark-theme) .group-item {
  color: #ffffff !important;
}

:global(.dark-theme) .balance-info {
  background: rgba(13, 27, 42, 0.58) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
}

:global(.dark-theme) .balance-info::before {
  background: linear-gradient(180deg, #2562eb 0%, #3882fa 100%) !important;
}

:global(.dark-theme) .btn,
:global(.dark-theme) .cta,
:global(.dark-theme) .modal-btn {
  background: linear-gradient(135deg, #2562eb 0%, #3882fa 100%) !important;
  color: #ffffff !important;
  box-shadow: 0 14px 30px rgba(37, 98, 235, 0.28) !important;
}

:global(.dark-theme) .btn.disabled {
  background: rgba(255, 255, 255, 0.08) !important;
  color: rgba(255, 255, 255, 0.4) !important;
}

:global(.dark-theme) .modal-overlay {
  background: rgba(15, 23, 42, 0.68) !important;
  backdrop-filter: blur(12px);
}

:global(.dark-theme) .secondary,
:global(.dark-theme) .ghost {
  background: rgba(13, 27, 42, 0.56) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  color: #ffffff !important;
}
</style>
