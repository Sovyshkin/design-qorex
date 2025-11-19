<script setup>
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useWalletStore } from '@/stores/walletStore.ts';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const walletStore = useWalletStore();
const router = useRouter();

const step = ref(1); // 1 - показ QR, 2 - ввод кода
const qrImage = ref('');
// Корректный src для QR-кода
const qrSrc = computed(() => {
  if (!qrImage.value) return '';
  if (qrImage.value.startsWith('data:image')) return qrImage.value;
  return `data:image/png;base64,${qrImage.value}`;
});
const authKey = ref('');
const verificationCode = ref('');
const fromRoute = ref(router.currentRoute.value.query.from);

const goBack = () => {
  router.push({ name: 'safety' });
};

const initialize2FA = async () => {
  const result = await walletStore.enable2FA();
  if (result.success) {
    qrImage.value = result.qrImage;
    authKey.value = result.key;
  } else {
    // Если не удалось получить QR код, возвращаемся назад
    goBack();
  }
};


const copyKey = () => {
  if (authKey.value) {
    navigator.clipboard.writeText(authKey.value);
    walletStore.showMessage(t('copied'), 'success', 1500);
  }
};

const openAuthenticatorApp = () => {
  if (authKey.value) {
    window.open(authKey.value, '_blank');
  }
};

const goToVerification = () => {
  step.value = 2;
};

const verifyCode = async () => {
  if (verificationCode.value.length !== 6) {
    walletStore.showMessage(t('enter_6_digit_code'), 'error');
    return;
  }

  const success = await walletStore.verify2FACode(verificationCode.value);
  
  if (success) {
    // Успешно - возвращаемся на страницу, с которой пришли, или в профиль
    setTimeout(() => {
      if (fromRoute.value === 'transfer') {
        router.push({ name: 'transfer' });
      } else {
        router.push({ name: 'profile' });
      }
    }, 1500);
  } else {
    verificationCode.value = '';
  }
};

onMounted(async () => {
  // Проверяем статус 2FA первым делом
  await walletStore.check2FAStatus();
  if (!walletStore.has2FA) {
    step.value = 0; // Сначала требуем включить 2FA
  } else {
    step.value = 3; // Если уже включено, показываем статус
  }
});
</script>

<template>
  <header class="header">
    <img
      class="arrow"
      src="../../assets/arrow-left.svg"
      alt=""
      @click="goBack()"
    />
    <h1>{{ t('two_factor_auth') }}</h1>
    <div class="emp"></div>
  </header>

  <main class="container">
    <!-- Шаг 0: Требование включить 2FA -->
    <div v-if="step === 0" class="step-container">
      <div class="icon-container">
        <img src="../../assets/safety.svg" alt="Security" class="security-icon" />
      </div>
      <h2>{{ t('setup_2fa') }}</h2>
      <p class="description">{{ t('setup_2fa_description') }}</p>
      <button class="btn btn-primary" @click="step = 1">
        {{ t('setup_2fa_button') }}
      </button>
    </div>

    <!-- Шаг 1: Показ QR кода и ключа -->
    <div v-else-if="step === 1" class="step-container">
      <div class="instructions">
        <h2>{{ t('setup_2fa') }}</h2>
        <p>{{ t('2fa_instruction_1') }}</p>
        <ol>
          <li>{{ t('2fa_instruction_2') }}</li>
          <li>{{ t('2fa_instruction_3') }}</li>
          <li>{{ t('2fa_instruction_4') }}</li>
        </ol>
      </div>
      <div class="qr-block">
        <div class="qr-container" v-if="qrImage">
          <img :src="qrSrc" alt="QR Code" class="qr-code" />
        </div>
        <div class="loader" v-else>
          <p>{{ t('loading') }}...</p>
        </div>
        <div class="key-section" v-if="authKey">
          <label class="key-label">{{ t('your_code') }}</label>
          <div class="key-container" @click="copyKey">
            <span class="key-text">{{ authKey }}</span>
            <img src="../../assets/copy.svg" alt="copy" class="copy-icon" />
          </div>
          <p class="hint">{{ t('tap_to_copy_wallet') }}</p>
        </div>
      </div>
      <button 
        class="btn btn-primary" 
        @click="goToVerification"
        :disabled="!qrImage"
        style="margin-top: 24px;"
      >
        {{ t('continue') }}
      </button>
    </div>

    <!-- Шаг 2: Ввод кода верификации -->
    <div v-else-if="step === 2" class="step-container">
      <div class="instructions">
        <h2>{{ t('verify_2fa') }}</h2>
        <p>{{ t('enter_code_from_app') }}</p>
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
      </div>
      <button 
        class="btn" 
        @click="verifyCode"
        :disabled="verificationCode.length !== 6"
        :class="{ disabled: verificationCode.length !== 6 }"
      >
        {{ t('verify_and_enable') }}
      </button>
      <button 
        class="btn secondary-btn" 
        @click="step = 1"
        style="margin-top: 12px;"
      >
        {{ t('back_to_qr') }}
      </button>
    </div>

    <!-- Шаг 3: 2FA уже настроен -->
    <div v-else-if="step === 3" class="step-container enabled-container">
      <div class="status-card">
        <div class="status-icon">
          <img src="../../assets/check.svg" alt="enabled" class="check-icon" />
        </div>
        <div class="status-content">
          <h2>{{ t('2fa_enabled') }}</h2>
          <p>{{ t('2fa_enabled_description') }}</p>
        </div>
      </div>
      <div class="info-card">
        <div class="info-icon">
          <img src="/assets/info.svg" alt="info" />
        </div>
        <div class="info-content">
          <h3>{{ t('important') }}</h3>
          <p>{{ t('2fa_disable_warning') }}</p>
        </div>
      </div>
      <button class="btn" @click="goBack()">
        {{ t('back_to_profile') }}
      </button>
    </div>
  </main>
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

.step-container {
  max-width: 420px;
  margin: 0 auto;
  padding: 32px 16px 48px 16px;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.07);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.icon-container {
  width: 120px;
  height: 120px;
  margin-bottom: 24px;
}

.security-icon {
  width: 100%;
  height: 100%;
  opacity: 0.8;
}

.instructions {
  width: 100%;
  text-align: left;
}

.description {
  font-size: 16px;
  color: #666;
  line-height: 1.5;
  margin: 0 0 24px 0;
  text-align: center;
}

.btn-primary {
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

.btn-primary:hover {
  opacity: 0.9;
}

.qr-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.qr-code {
  width: 180px;
  height: 180px;
  object-fit: contain;
  margin-bottom: 12px;
}

.key-section {
  width: 100%;
  max-width: 400px;
  margin-bottom: 24px;
}

.key-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
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

.copy-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.hint {
  font-size: 12px;
  color: #666;
  margin: 0;
}

.code-input-container {
  width: 100%;
  margin-bottom: 16px;
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

.container {
  overflow-y: auto;
  max-height: 100vh;
  padding-bottom: 20px;
  background: #f7f8fa;
}

/* Стили для статуса включенного 2FA */
.enabled-container {
  text-align: center;
}

.status-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background-color: #f0f9ff;
  border: 2px solid #deec51;
  border-radius: 16px;
  padding: 24px;
  margin: 20px 0;
}

.status-icon {
  width: 48px;
  height: 48px;
  background-color: #deec51;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.check-icon {
  width: 24px;
  height: 24px;
}

.status-content {
  text-align: left;
  flex: 1;
}

.status-content h2 {
  font-size: 18px;
  font-weight: 600;
  color: #141414;
  margin: 0 0 8px 0;
}

.status-content p {
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

.info-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 12px;
  padding: 16px;
  margin: 20px 0;
}

.info-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  margin-top: 2px;
}

.info-content h3 {
  font-size: 14px;
  font-weight: 600;
  color: #856404;
  margin: 0 0 8px 0;
}

.info-content p {
  font-size: 13px;
  color: #856404;
  margin: 0;
  line-height: 1.4;
}
</style>
