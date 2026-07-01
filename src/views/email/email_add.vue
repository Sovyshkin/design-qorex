<script setup>
import { useI18n } from "vue-i18n";
import { useWalletStore } from '@/stores/walletStore.ts'
import { ref } from 'vue';

const { t } = useI18n();
const walletStore = useWalletStore();
const isSending = ref(false);

const sendCode = async () => {
  if (isSending.value || !walletStore.email?.trim()) return;
  
  isSending.value = true;
  try {
    await walletStore.sendCode();
  } finally {
    setTimeout(() => {
      isSending.value = false;
    }, 3000); // 3 секунды защиты
  }
};
</script>
<template>
  <div class="email-add-page">
    <header class="header">
      <img
        class="arrow"
        src="../../assets/arrow-left.svg"
        alt=""
        @click="walletStore.goBack()"
      />
      <h1>{{ t("email_add") }}</h1>
      <div class="emp"></div>
    </header>
    <main class="container">
      <div class="form-container">
        <div class="form-header">
          <h2 class="form-title">{{ t("email_add") }}</h2>
          <p class="form-description">{{ t('email_text') }}</p>
        </div>
        
        <div class="input-section">
          <input 
            type="email" 
            :placeholder="t('email_enter')" 
            id="email" 
            v-model="walletStore.email"
            class="form-input"
          />
        </div>
        
        <button class="btn" @click="sendCode()" :disabled="isSending || walletStore.isLoading">
          <div class="btn-content">
            <div v-if="isSending" class="loader"></div>
            <span v-if="isSending">Отправляем...</span>
            <span v-else>{{ t("email_send") }}</span>
          </div>
        </button>
      </div>
    </main>
  </div>
</template>
<style scoped>
.header {
  width: 100%;
  min-height: 64px;
  padding: 16px;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 44px;
  align-items: center;
  gap: 8px;
  background: #f1f5f9;
}

.emp {
  width: 44px;
  height: 44px;
}

.arrow {
  width: 44px;
  height: 44px;
  padding: 13px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  object-fit: contain;
}

h1 {
  margin: 0;
  color: #0f172a;
  font-size: 24px;
  line-height: 28px;
  font-weight: 750;
  letter-spacing: -0.03em;
  text-align: center;
}

.container {
  min-height: calc(100vh - 64px);
  min-height: calc(100dvh - 64px);
  display: block;
  overflow-y: auto;
  padding: 0 16px calc(176px + env(safe-area-inset-bottom));
  background:
    radial-gradient(820px 360px at 50% -18%, #dbeafe 0%, transparent 62%),
    #f1f5f9;
}

.form-container {
  width: 100%;
  margin: 0 auto;
  padding: 24px 18px 18px;
  display: grid;
  gap: 18px;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.btn {
  width: 100%;
  min-height: 56px;
  margin: 2px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 0 20px;
  border-radius: 18px;
  font-weight: 600;
  font-size: 17px;
  color: #ffffff;
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

.btn:hover:not(:disabled)::before {
  left: 100%;
}

.btn:hover:not(:disabled) {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 
    0 20px 40px rgba(222, 236, 81, 0.4),
    0 10px 20px rgba(222, 236, 81, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  color: #64748b;
  box-shadow: none;
}

input,
textarea,
select {
  width: 100%;
  min-height: 58px;
  border: 1px solid #dbeafe;
  border-radius: 18px;
  padding: 0 18px;
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
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.form-header {
  text-align: center;
  margin-bottom: 4px;
}

.form-title {
  margin: 0 0 10px;
  color: #0f172a;
  font-size: 26px;
  line-height: 31px;
  font-weight: 800;
  letter-spacing: -0.035em;
}

.form-description {
  max-width: 310px;
  margin: 0 auto;
  color: #64748b;
  font-size: 15px;
  line-height: 22px;
  font-weight: 500;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.loader {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.52);
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .container {
    padding-bottom: calc(176px + env(safe-area-inset-bottom));
  }
  
  .form-container {
    padding: 24px 18px 18px;
  }
}

@media (max-width: 375px) {
  .form-title {
    font-size: 24px;
    line-height: 29px;
  }
}

:global(.dark-theme) .email-add-page .header,
:global(.dark-theme) .email-add-page .container {
  background: #0d1b2a !important;
}

:global(.dark-theme) .email-add-page .header h1,
:global(.dark-theme) .email-add-page .form-title {
  color: #ffffff !important;
}

:global(.dark-theme) .email-add-page .form-description {
  color: #94a3b8 !important;
}

:global(.dark-theme) .email-add-page .header .arrow {
  background: rgba(30, 39, 59, 0.96) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  filter: brightness(0) invert(1);
  box-shadow: 0 16px 30px rgba(0, 0, 0, 0.28) !important;
}

:global(.dark-theme) .email-add-page .form-container {
  background: rgba(30, 39, 59, 0.96) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.34) !important;
}

:global(.dark-theme) .email-add-page input,
:global(.dark-theme) .email-add-page textarea,
:global(.dark-theme) .email-add-page select {
  background: rgba(13, 27, 42, 0.58) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  color: #ffffff !important;
  caret-color: #3882fa !important;
  box-shadow: none !important;
}

:global(.dark-theme) .email-add-page input::placeholder,
:global(.dark-theme) .email-add-page textarea::placeholder,
:global(.dark-theme) .email-add-page select::placeholder {
  color: rgba(255, 255, 255, 0.42) !important;
}
</style>
