<script setup>
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useWalletStore } from '@/stores/walletStore.ts';
import { useRouter } from 'vue-router';
import AppLoader from '@/components/AppLoader.vue';

const { t } = useI18n();
const walletStore = useWalletStore();
const router = useRouter();

const step = ref(1); // 1 - показ QR, 2 - ввод кода
const qrImage = ref('');
const loading = ref(true);
// Корректный src для QR-кода
const qrSrc = computed(() => {
  if (!qrImage.value) return '';
  if (qrImage.value.startsWith('data:image')) return qrImage.value;
  return `data:image/png;base64,${qrImage.value}`;
});
const authKey = ref('');
const verificationCode = ref('');
const fromRoute = ref(router.currentRoute.value.query.from);
const keyCopied = ref(false);

const goBack = () => {
  router.push({ name: 'main' });
};

const initialize2FA = async () => {
  const result = await walletStore.enable2FA();
  if (result.success) {
    qrImage.value = result.qrImage;
    authKey.value = parseSecretFromUrl(result.key);
  } else {
    // Если не удалось получить QR код, возвращаемся назад
    goBack();
  }
};

const parseSecretFromUrl = (url) => {
  try {
    // Если это уже не URL, возвращаем как есть
    if (!url || !url.startsWith('otpauth://')) {
      return url;
    }
    
    // Парсим URL
    const urlObj = new URL(url);
    // Извлекаем параметр secret
    const secret = urlObj.searchParams.get('secret');
    return secret || url; // Если secret не найден, возвращаем оригинальную строку
  } catch (error) {
    console.error('Error parsing 2FA URL:', error);
    return url; // В случае ошибки возвращаем оригинальную строку
  }
};


const copyKey = () => {
  if (authKey.value) {
    navigator.clipboard.writeText(authKey.value);
    keyCopied.value = true;
    walletStore.showMessage(t('copied'), 'success', 1500);
    setTimeout(() => {
      keyCopied.value = false;
    }, 1500);
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
    // Успешно - перенаправляем на страницу перевода средств
    setTimeout(() => {
      router.push({ name: 'transfer' });
    }, 1500);
  } else {
    verificationCode.value = '';
  }
};

const pasteKeyToInput = () => {
  if (authKey.value) {
    verificationCode.value = authKey.value;
  }
};

onMounted(async () => {
  // Проверяем статус 2FA первым делом
  await walletStore.check2FAStatus();
  if (!walletStore.has2FA) {
    step.value = 1; // Начинаем настройку 2FA
    await initialize2FA();
  } else {
    step.value = 3; // Если уже включено, показываем статус
  }
  loading.value = false;
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
  <main v-if="!loading" class="container">
    <!-- Шаг 1: Показ QR кода и ключа -->
    <transition name="step-fade" appear>
      <div v-if="step === 1" class="step-container">
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
    </transition>

    <!-- Шаг 2: Ввод кода верификации -->
    <transition name="step-fade" appear>
      <div v-if="step === 2" class="step-container">
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
          <button 
            class="paste-btn"
            @click="pasteKeyToInput"
            v-if="authKey"
          >
            {{ t('paste_key') || 'Вставить ключ' }}
          </button>
        </div>
        <div class="key-section" v-if="authKey">
          <label class="key-label">{{ t('your_code') }}</label>
          <div class="key-container" :class="{ copied: keyCopied }" @click="copyKey">
            <span class="key-text">{{ authKey }}</span>
            <img src="../../assets/copy.svg" alt="copy" class="copy-icon" />
          </div>
          <p class="hint">{{ t('tap_to_copy_wallet') }}</p>
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
    </transition>

    <!-- Шаг 3: 2FA уже настроен -->
    <transition name="step-fade" appear>
      <div v-if="step === 3" class="step-container enabled-container">
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
    </transition>
  </main>

  <!-- Loading state -->
  <div v-else class="loading-container">
    <AppLoader />
    <p class="loading-text">{{ t('loading') }}...</p>
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

.arrow {
  height: 32px;
  width: 32px;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.arrow:hover {
  transform: translateX(-3px);
}

.step-container {
  max-width: 420px;
  margin: 0 auto;
  padding: 32px 24px 48px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.1),
    0 8px 32px rgba(222, 236, 81, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  position: relative;
  overflow: hidden;
  animation: slideInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.step-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #deec51, #b8d43c, #deec51);
  background-size: 200% 100%;
  animation: shimmer 3s ease-in-out infinite;
}

.icon-container {
  width: 120px;
  height: 120px;
  background: #deec51;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  box-shadow: 0 20px 40px rgba(222, 236, 81, 0.3), 0 0 0 8px rgba(222, 236, 81, 0.1);
  animation: lockPulse 2s ease-in-out infinite;
}

.security-icon {
  width: 60px;
  height: 60px;
  opacity: 0.8;
}

.instructions {
  width: 100%;
  text-align: left;
  background: rgba(248, 249, 250, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  animation: fadeInUp 0.6s ease-out 0.2s both;
}

.instructions h2 {
  font-size: 20px;
  font-weight: 600;
  color: #141414;
  margin: 0 0 12px 0;
  background: linear-gradient(135deg, #141414, #333);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.instructions p {
  font-size: 15px;
  color: #666;
  line-height: 1.6;
  margin: 0 0 16px 0;
}

.instructions ol {
  margin: 0;
  padding-left: 20px;
}

.instructions li {
  font-size: 14px;
  color: #555;
  line-height: 1.5;
  margin-bottom: 8px;
  position: relative;
}

.instructions li::marker {
  color: #deec51;
  font-weight: bold;
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
  padding: 16px 20px;
  border-radius: 16px;
  font-weight: 600;
  font-size: 16px;
  color: #141414;
  background: linear-gradient(135deg, #deec51, #b8d43c);
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(222, 236, 81, 0.3);
  animation: fadeInUp 0.6s ease-out 0.8s both;
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  transition: left 0.6s ease;
}

.btn-primary:hover::before {
  left: 100%;
}

.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 30px rgba(222, 236, 81, 0.4);
}

.btn-primary:active {
  transform: translateY(-1px);
}

.btn {
  width: 100%;
  max-width: 300px;
  padding: 14px 16px;
  border-radius: 12px;
  font-weight: 500;
  font-size: 16px;
  color: #141414;
  background-color: #deec51;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.btn:hover::before {
  left: 100%;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(222, 236, 81, 0.4);
}

.btn:active {
  transform: translateY(0);
  box-shadow: 0 4px 15px rgba(222, 236, 81, 0.3);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.secondary-btn {
  background-color: #f8f9fa;
  color: #666;
  border: 1px solid #e9ecef;
}

.secondary-btn:hover {
  background-color: #e9ecef;
}

.qr-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 20px;
  padding: 24px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 4px 16px rgba(222, 236, 81, 0.1);
  animation: fadeInUp 0.6s ease-out 0.4s both;
  position: relative;
}

.qr-block::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(135deg, rgba(222, 236, 81, 0.3), rgba(184, 212, 60, 0.3));
  border-radius: 22px;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.qr-block:hover::before {
  opacity: 1;
}

.qr-code {
  width: 180px;
  height: 180px;
  object-fit: contain;
  margin-bottom: 12px;
  animation: fadeInUp 0.8s ease-out, gentlePulse 4s infinite 1s;
  border-radius: 16px;
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.15),
    0 4px 16px rgba(222, 236, 81, 0.2);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.5);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.qr-code:hover {
  transform: scale(1.05) rotate(1deg);
  box-shadow:
    0 16px 50px rgba(0, 0, 0, 0.2),
    0 6px 20px rgba(222, 236, 81, 0.3);
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
  background: rgba(248, 249, 250, 0.9);
  backdrop-filter: blur(12px);
  border: 2px solid rgba(233, 236, 239, 0.8);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 8px;
  animation: fadeInUp 0.6s ease-out 0.6s both;
  position: relative;
  overflow: hidden;
}

.key-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(222, 236, 81, 0.1), transparent);
  transition: left 0.6s ease;
}

.key-container:hover::before {
  left: 100%;
}

.key-container:hover {
  border-color: rgba(222, 236, 81, 0.6);
  background: rgba(255, 255, 255, 0.95);
  transform: translateY(-3px);
  box-shadow:
    0 12px 40px rgba(222, 236, 81, 0.2),
    0 4px 16px rgba(0, 0, 0, 0.1);
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
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.paste-btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  cursor: pointer;
  transition: all 0.3s ease;
}

.paste-btn:hover {
  background-color: #e9ecef;
  border-color: #deec51;
}

.code-input {
  width: 100%;
  border: 2px solid #e9ecef !important;
  border-radius: 16px !important;
  padding: 16px !important;
  font-size: 24px !important;
  text-align: center;
  letter-spacing: 8px;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.9) !important;
  outline: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
}

.code-input:focus {
  border-color: #deec51 !important;
  box-shadow: 0 0 0 4px rgba(222, 236, 81, 0.2), 0 8px 25px rgba(0,0,0,0.1);
  transform: scale(1.02);
}

.code-input::placeholder {
  letter-spacing: normal !important;
  font-size: 14px !important;
  color: #a5a5a5 !important;
}

.container {
  padding-bottom: 40px;
  min-height: calc(100vh - 80px); /* Высота экрана минус высота навбара */
  -webkit-overflow-scrolling: touch; /* Плавная прокрутка на iOS */
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
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 2px solid #deec51;
  border-radius: 20px;
  padding: 24px;
  margin: 20px 0;
  animation: fadeInUp 0.8s ease-out;
  backdrop-filter: blur(10px);
}

.status-icon {
  width: 48px;
  height: 48px;
  background: #deec51;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  animation: pulse 2s infinite;
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
  background: linear-gradient(135deg, #fff3cd 0%, #fef3c7 100%);
  border: 1px solid #ffeaa7;
  border-radius: 16px;
  padding: 16px;
  margin: 20px 0;
  animation: fadeInUp 0.8s ease-out 0.3s both;
  backdrop-filter: blur(10px);
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

/* Анимации переходов между шагами */
.step-fade-enter-active,
.step-fade-leave-active {
  transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.step-fade-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
}

.step-fade-leave-to {
  opacity: 0;
  transform: translateY(-30px) scale(1.05);
}

/* Анимации для элементов */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes lockPulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 20px 40px rgba(222, 236, 81, 0.3), 0 0 0 8px rgba(222, 236, 81, 0.1);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 25px 50px rgba(222, 236, 81, 0.4), 0 0 0 12px rgba(222, 236, 81, 0.15);
  }
}

.qr-code {
  width: 180px;
  height: 180px;
  object-fit: contain;
  margin-bottom: 12px;
  animation: fadeInUp 0.8s ease-out;
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 8px;
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

.key-container:hover {
  border-color: #deec51;
  background-color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(222, 236, 81, 0.3);
}

.key-container.copied {
  border-color: #28a745;
  background-color: rgba(40, 167, 69, 0.1);
  animation: copiedPulse 0.6s ease-out;
}

/* Loading animation */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 24px;
}

.loading-spinner {
  position: relative;
  width: 80px;
  height: 80px;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 4px solid rgba(222, 236, 81, 0.1);
  border-top: 4px solid #deec51;
  border-radius: 50%;
  animation: spin 1.5s linear infinite;
}

.spinner-ring:nth-child(2) {
  animation-delay: 0.2s;
  border-color: rgba(222, 236, 81, 0.2);
  border-top-color: #deec51;
}

.spinner-ring:nth-child(3) {
  animation-delay: 0.4s;
  border-color: rgba(222, 236, 81, 0.3);
  border-top-color: #deec51;
}

.loading-text {
  font-size: 16px;
  color: #666;
  font-weight: 500;
  animation: fadeInOut 2s ease-in-out infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes fadeInOut {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes gentlePulse {
  0%, 100% {
    transform: scale(1);
    box-shadow:
      0 12px 40px rgba(0, 0, 0, 0.15),
      0 4px 16px rgba(222, 236, 81, 0.2);
  }
  50% {
    transform: scale(1.02);
    box-shadow:
      0 16px 50px rgba(0, 0, 0, 0.2),
      0 6px 20px rgba(222, 236, 81, 0.3);
  }
}

@keyframes copiedPulse {
  0% {
    transform: scale(1);
    border-color: #28a745;
    background-color: rgba(40, 167, 69, 0.1);
  }
  50% {
    transform: scale(1.05);
    border-color: #28a745;
    background-color: rgba(40, 167, 69, 0.2);
    box-shadow: 0 0 20px rgba(40, 167, 69, 0.3);
  }
  100% {
    transform: scale(1);
    border-color: #28a745;
    background-color: rgba(40, 167, 69, 0.1);
  }
}

/* Исправления для маленьких экранов */
@media (max-height: 600px) {
  .container {
    padding-bottom: 100px; /* Дополнительный отступ для навбара на маленьких экранах */
    min-height: calc(100vh - 100px);
  }
}
</style>
