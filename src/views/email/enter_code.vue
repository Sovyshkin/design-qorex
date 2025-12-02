<script setup>
import { useI18n } from "vue-i18n";
import { useWalletStore } from "@/stores/walletStore.ts";
import { ref } from 'vue';

const { t } = useI18n();
const walletStore = useWalletStore();
const isChecking = ref(false);

const checkCode = async () => {
  if (isChecking.value || walletStore.isLoading) {
    console.log('Кнопка заблокирована:', { isChecking: isChecking.value, isLoading: walletStore.isLoading });
    return;
  }
  
  if (!walletStore.code?.trim()) {
    console.log('Код не введен');
    return;
  }
  
  console.log('Отправляем код:', walletStore.code);
  isChecking.value = true;
  
  try {
    await walletStore.checkCode();
  } catch (error) {
    console.error('Ошибка при проверке кода:', error);
  } finally {
    isChecking.value = false;
  }
};
</script>
<template>
  <header class="header">
    <img
      class="arrow"
      src="../../assets/arrow-left.svg"
      alt=""
      @click="walletStore.goBack()"
    />
    <h1>{{ t("enter_code") }}</h1>
    <div class="emp"></div>
  </header>
  <main class="container">
    <div class="form-container">
      <div class="form-header">
        <h2 class="form-title">{{ t("enter_code") }}</h2>
        <p class="form-description">Введите код подтверждения, отправленный на ваш email</p>
      </div>
      
      <div class="input-section">
        <input
          type="number"
          :placeholder="t('your_code')"
          id="code"
          v-model="walletStore.code"
          class="code-input"
          maxlength="6"
        />
      </div>
      
      <button 
        class="btn" 
        @click="checkCode()" 
        :disabled="isChecking || walletStore.isLoading"
      >
        <div class="btn-content">
          <div v-if="isChecking || walletStore.isLoading" class="loader"></div>
          <span v-if="isChecking || walletStore.isLoading">Проверяем...</span>
          <span v-else>{{ t("confirm") }}</span>
        </div>
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

h1 {
  color: #141414;
  text-align: center;
}

.container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow-y: auto;
  padding: 0 0 150px 0;
}

.form-container {
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 32px 32px 0 0;
  box-shadow: 
    0 -8px 32px rgba(0, 0, 0, 0.12),
    0 -4px 16px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  min-height: calc(100vh - 120px);
  padding: 32px 20px 60px 20px;
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.btn {
  width: calc(100% - 40px);
  margin: 0 20px 20px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px 24px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 17px;
  color: #1a1a1a;
  background: linear-gradient(135deg, #deec51 0%, #d6e34a 100%);
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
  text-align: center;
  font-size: 24px;
  letter-spacing: 8px;
}

input:focus,
textarea:focus,
select:focus {
  border-color: #deec51;
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
  margin-bottom: 24px;
}

.form-title {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 12px 0;
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.form-description {
  font-size: 16px;
  font-weight: 400;
  color: #64748b;
  margin: 0;
  line-height: 1.6;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.code-input {
  text-align: center;
  font-size: 24px !important;
  letter-spacing: 8px !important;
  font-weight: 600;
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
  border: 2px solid #1a1a1a;
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
    padding-bottom: 160px;
  }
  
  .form-container {
    padding: 24px 16px;
  }
}

@media (max-width: 375px) {
  .container {
    padding-bottom: 180px;
  }
}
</style>
