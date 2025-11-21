<script setup>
import { useI18n } from "vue-i18n";
import { useWalletStore } from '@/stores/walletStore.ts'
import { ref, computed, onMounted, watch } from "vue";
import Require2FA from '@/components/Require2FA.vue';
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

const isFormValid = computed(() => {
  return amount.value && 
         recipientWallet.value && 
         parseFloat(amount.value) > 0 &&
         twoFactorCode.value.length === 6 &&
         walletStore.has2FA;
});

const handleTransfer = async () => {
  if (!isFormValid.value) return;
  
  // Проверка, что не переводим самому себе
  if (recipientWallet.value === myWallet.value) {
    walletStore.showMessage(t('cannot_transfer_to_self'), 'error');
    return;
  }
  
  await walletStore.transferFunds(recipientWallet.value, amount.value, twoFactorCode.value);
};

const copyKey = () => {
  if (twoFactorKey.value) {
    navigator.clipboard.writeText(twoFactorKey.value);
    walletStore.showMessage(t('key_copied'), 'success', 1500);
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
  try {
    // Делаем запрос на /fa_take для проверки статуса 2FA
    const result = await walletStore.enable2FA();
    
    if (result.success && result.qrImage && result.key) {
      // В ответе есть QR и ключ - нужно настроить 2FA
      twoFactorKey.value = result.key;
      // Не показываем форму перевода, пока 2FA не настроен
    } else {
      // 2FA уже подключен или другой случай - разрешаем доступ к форме
      isTwoFactorSetupComplete.value = true;
      // Загружаем кошелек пользователя
      await walletStore.getUserWallet();
      myWallet.value = walletStore.userWallet;
    }
  } catch (error) {
    // В случае ошибки пробуем проверить статус обычным способом
    await verifyTwoFactorSetup();
    if (isTwoFactorSetupComplete.value) {
      // Если 2FA настроен, загружаем кошелек
      await walletStore.getUserWallet();
      myWallet.value = walletStore.userWallet;
    }
  }
};

onMounted(async () => {
  // Проверяем доступ к странице перевода через 2FA
  await checkTwoFactorAccess();
});
</script>

<template>
  <!-- Показываем страницу подключения 2FA, если в ответе есть ключ -->
  <div v-if="twoFactorKey && !isTwoFactorSetupComplete" class="two-factor-setup">
    <div class="icon-container">
      <img src="/assets/safety.svg" alt="Security" class="security-icon" />
    </div>

    <h2>{{ t('setup_2fa') }}</h2>
    <p class="description">{{ t('setup_2fa_description') }}</p>

    <div class="key-section">
      <h4>{{ t('two_factor_key') }}</h4>
      <div class="key-container" @click="copyKey">
        <span class="key-text">{{ twoFactorKey }}</span>
        <img src="../assets/copy.svg" alt="copy" class="copy-icon" />
      </div>
      <p class="hint">{{ t('click_to_copy_key') }}</p>
    </div>

    <button class="btn-primary" @click="goToTwoFactorSetup">
      {{ t('setup_2fa_button') }}
    </button>
  </div>

  <!-- Показываем форму перевода, если 2FA успешно подключен -->
  <div v-else-if="isTwoFactorSetupComplete">
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
        <div class="wallet-card" @click="copyWallet">
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
          required
        />

        <div class="group">
          <input 
            type="number" 
            :placeholder="t('select_amount')" 
            v-model="amount"
          />
          <span class="group-item">USDT</span>
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
            maxlength="6"
            pattern="[0-9]*"
            inputmode="numeric"
            class="code-input"
          />
        </div>
      </div>

      <button 
        class="btn" 
        :class="{ disabled: !isFormValid }"
        :disabled="!isFormValid"
        @click="handleTransfer()"
      >
        {{ t("transfer_funds") }}
      </button>
    </main>
  </div>
</template>

<style scoped>
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
  color: #141414;
}

.container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 0 20px 120px 20px;
  overflow-y: auto;
}

.my-wallet-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-header h3 {
  font-size: 16px;
  font-weight: 500;
  color: #141414;
  margin: 0;
}

.wallet-card {
  background-color: #fff;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.wallet-card:hover {
  border-color: #deec51;
}

.wallet-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.wallet-label {
  font-size: 12px;
  color: #666;
}

.wallet-number {
  font-size: 18px;
  font-weight: 500;
  color: #141414;
  font-family: monospace;
}

.copy-icon {
  width: 24px;
  height: 24px;
  opacity: 0.6;
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
  gap: 16px;
}

.form-container h3 {
  font-size: 16px;
  font-weight: 500;
  color: #141414;
  margin: 0;
}

.btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 8px;
  font-weight: 300;
  font-size: 14px;
  color: #141414;
  background-color: #deec51;
  transition: opacity 0.2s ease;
}

.btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

input,
textarea,
select {
  width: 100%;
  border: 1px solid black;
  border-radius: 10px;
  padding: 16px;
  background: none;
  outline: none;
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
  right: 4%;
  top: 50%;
  transform: translateY(-50%);
  font-weight: 500;
}

.balance-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  font-size: 14px;
}

.balance-value {
  font-weight: 500;
  color: #141414;
}

.code-input-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.code-input-section h4 {
  font-size: 14px;
  font-weight: 500;
  color: #141414;
  margin: 0;
}

.code-input {
  width: 100%;
  border: 2px solid #141414 !important;
  border-radius: 12px !important;
  padding: 16px !important;
  font-size: 20px !important;
  text-align: center;
  letter-spacing: 6px;
  font-weight: 500;
  background: #fff !important;
  outline: none;
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
  color: #141414;
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
  color: #141414;
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
  border-color: #deec51;
  background-color: #fff;
}

.key-text {
  font-family: monospace;
  font-size: 14px;
  color: #141414;
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
  color: #141414;
  background-color: #deec51;
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
</style>
