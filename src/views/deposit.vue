<script setup>
import { useI18n } from "vue-i18n";
import { useWalletStore } from '@/stores/walletStore.ts'
import { ref } from "vue";

const { t } = useI18n();
const walletStore = useWalletStore();
const selectedNetwork = ref("USDT_TRC20");
const localAmount = ref("");

const networks = [
  { id: "USDT_TRC20", name: "TRC20 (Tron)", icon: "usdt" },
  { id: "USDT_TON", name: "TON", icon: "ton" },
  { id: "USDT_ERC20", name: "ERC20 (Ethereum)", icon: "ethereum" }
];

const isCreatingInvoice = ref(false);
const isDisabled = ref(false);

// Функция для обработки ошибок API
const handleApiError = (error) => {
  console.error('API Error:', error);
  
  // Если это ошибка валидации от FastAPI
  if (error.response?.data?.detail && Array.isArray(error.response.data.detail)) {
    const validationErrors = error.response.data.detail;
    
    for (const err of validationErrors) {
      if (err.type === 'int_parsing' && err.loc?.includes('amount')) {
        walletStore.showMessage('Сумма должна быть целым числом. Дробные суммы не поддерживаются.', 'error');
        return;
      }
      if (err.type === 'value_error' && err.loc?.includes('amount')) {
        walletStore.showMessage('Некорректная сумма. Проверьте введенное значение.', 'error');
        return;
      }
    }
    
    // Общая ошибка валидации
    walletStore.showMessage('Ошибка в данных. Проверьте введенную информацию.', 'error');
  } else if (error.response?.data?.detail && typeof error.response.data.detail === 'string') {
    // Если detail - строка
    walletStore.showMessage(error.response.data.detail, 'error');
  } else if (error.message) {
    walletStore.showMessage(error.message, 'error');
  } else {
    walletStore.showMessage('Произошла ошибка при создании платежа', 'error');
  }
};

// Функция для нормализации числа (заменяет запятую на точку и очищает от лишних символов)
const normalizeNumber = (value) => {
  if (!value) return "";
  
  // Заменяем запятую на точку
  let normalized = value.toString().replace(/,/g, '.');
  
  // Убираем все символы кроме цифр, точки и знака минус
  normalized = normalized.replace(/[^\d.-]/g, '');
  
  // Оставляем только одну точку
  const parts = normalized.split('.');
  if (parts.length > 2) {
    normalized = parts[0] + '.' + parts.slice(1).join('');
  }
  
  return normalized;
};

// Обработчик ввода суммы
const handleAmountInput = (event) => {
  const value = event.target.value;
  // Для целых чисел убираем дробную часть при нормализации
  let normalized = normalizeNumber(value);
  
  // Если есть дробная часть, убираем её
  if (normalized.includes('.')) {
    const parts = normalized.split('.');
    normalized = parts[0]; // Берем только целую часть
  }
  
  localAmount.value = normalized;
  
  // Обновляем значение в store только если это валидное целое число
  const numValue = parseInt(normalized);
  if (!isNaN(numValue) && numValue > 0) {
    walletStore.amount = normalized;
  } else if (normalized === "") {
    walletStore.amount = "";
  }
};

// Функция для быстрого выбора суммы
const selectQuickAmount = (amount) => {
  localAmount.value = amount.toString();
  walletStore.amount = amount.toString();
};

const createInvoice = async () => {
  if (isDisabled.value) return;

  // Валидация суммы
  const cleanAmount = localAmount.value.replace(/[^\d]/g, ''); // Только цифры
  const numAmount = parseInt(cleanAmount);
  
  if (!cleanAmount || isNaN(numAmount) || numAmount <= 0) {
    walletStore.showMessage('Введите корректную сумму в USDT', 'error');
    return;
  }

  // Минимальная сумма
  if (numAmount < 1) {
    walletStore.showMessage('Минимальная сумма для пополнения: 1 USDT', 'error');
    return;
  }

  // Максимальная сумма для безопасности
  if (numAmount > 10000) {
    walletStore.showMessage('Максимальная сумма для пополнения: 10,000 USDT', 'error');
    return;
  }

  isDisabled.value = true;
  isCreatingInvoice.value = true;

  try {
    // Устанавливаем целое число как строку
    walletStore.amount = Math.floor(numAmount).toString();
    await walletStore.createInvoice(selectedNetwork.value);
  } catch (error) {
    handleApiError(error);
  } finally {
    isCreatingInvoice.value = false;
    setTimeout(() => {
      isDisabled.value = false;
    }, 1000);
  }
};
</script>
<template>
  <transition name="fade-down" appear>
    <header class="header">
      <img
        class="arrow"
        src="../assets/arrow-left.svg"
        alt=""
        @click="walletStore.goBack()"
      />
      <h1>{{ t("deposit_page") }}</h1>
      <div class="emp"></div>
    </header>
  </transition>
  <transition name="fade-scale" appear>
    <main class="container">
    <div class="form-container">
      <div class="input-section">
        <div class="group">
          <input 
            type="text" 
            placeholder="Введите сумму" 
            id="amount" 
            v-model="localAmount"
            @input="handleAmountInput"
            inputmode="numeric"
          />
          <span class="group-item">USDT</span>
        </div>
        
        <div class="quick-amounts">
          <div class="amounts-grid">
            <button 
              v-for="amount in [5, 10, 25, 50, 100]" 
              :key="amount"
              class="amount-btn"
              :class="{ active: localAmount === amount.toString() }"
              @click="selectQuickAmount(amount)"
              type="button"
            >
              {{ amount }}
            </button>
          </div>
        </div>
      </div>
      
      <div class="network-selector">
        <h3>Выберите сеть</h3>
        <div class="networks-list">
          <div 
            v-for="network in networks" 
            :key="network.id" 
            class="network-item" 
            :class="{ active: selectedNetwork === network.id }"
            @click="selectedNetwork = network.id"
          >
            <div class="network-icon">
              <img :src="`/assets/${network.icon}.png`" alt="">
            </div>
            <div class="network-info">
              <span class="network-name">{{ network.name }}</span>
            </div>
            <div class="network-check" v-if="selectedNetwork === network.id">
              <div class="check-icon"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <button 
      class="btn" 
      :class="{ loading: isDisabled }"
      :disabled="isDisabled"
      @click="createInvoice()"
    >
      <div class="btn-content">
        <div class="loader" v-if="isDisabled"></div>
        <span v-if="!isDisabled">{{ t("continue") }}</span>
        <span v-else>{{ t("processing") }}</span>
      </div>
    </button>
    </main>
  </transition>
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
  gap: 20px;
  padding: 0 0 150px 0;
  overflow-y: auto;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  min-height: calc(100vh - 80px);
}

/* Исправление для маленьких экранов iPhone 5/SE */
@media (max-height: 600px) and (max-width: 400px) {
  .container {
    padding: 0 20px 80px 20px; /* Уменьшаем нижний padding */
    min-height: calc(100vh - 60px);
  }
  
  .form-container {
    gap: 15px; /* Уменьшаем gap между элементами */
    margin-bottom: 15px;
  }
  
  .network-selector {
    margin-top: 15px;
  }
  
  .btn {
    padding: 12px 16px; /* Уменьшаем padding кнопки */
    font-size: 13px;
  }
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px 20px;
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  border: none;
  border-radius: 0;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.1),
    0 8px 24px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  position: relative;
  overflow: hidden;
  width: 100vw;
  margin: 0;
  margin-left: calc(-50vw + 50%);
}

.form-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #deec51, #d6e34a, #c9d93d);
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

.btn:active:not(:disabled) {
  transform: translateY(-1px) scale(0.99);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  color: #64748b;
  box-shadow: none;
}

.btn.loading {
  background: linear-gradient(135deg, #d4d926 0%, #c9d93d 100%);
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

/* Стили для мобильной клавиатуры с десятичными числами */
input[inputmode="decimal"] {
  -webkit-appearance: none;
  -moz-appearance: textfield;
  appearance: none;
}

input[inputmode="decimal"]::-webkit-outer-spin-button,
input[inputmode="decimal"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.group {
  position: relative;
}

.group-item {
  position: absolute;
  right: 4%;
  top: 50%;
  transform: translateY(-50%);
}

.hint {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 12px 16px;
  margin-top: 10px;
  border-left: 3px solid #deec51;
}

.hint span {
  font-size: 12px;
  color: #6c757d;
  line-height: 1.4;
}

.quick-amounts {
  margin-top: 12px;
}

.amounts-grid {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.amount-btn {
  background-color: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 11px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  min-width: 40px;
  flex: 1;
}

.amount-btn:hover {
  border-color: #deec51;
  background-color: #f2f8d1;
  color: #141414;
}

.amount-btn.active {
  background-color: #deec51;
  border-color: #deec51;
  color: #141414;
  font-weight: 500;
}

.network-selector {
  margin-top: 20px;
}

.network-selector h3 {
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  text-align: center;
}

.networks-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.network-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 2px solid #e2e8f0;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.network-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(222, 236, 81, 0.1), transparent);
  transition: left 0.6s ease;
}

.network-item:hover::before {
  left: 100%;
}

.network-item:hover {
  border-color: #deec51;
  transform: translateY(-2px);
  box-shadow: 
    0 12px 32px rgba(0, 0, 0, 0.1),
    0 6px 16px rgba(222, 236, 81, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.network-item.active {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 2px solid #deec51;
  box-shadow: 
    0 8px 24px rgba(222, 236, 81, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.network-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

.icon-placeholder {
  width: 32px;
  height: 32px;
  background-color: #deec51;
  border-radius: 50%;
}

.network-info {
  flex: 1;
  margin-left: 10px;
}

.network-name {
  font-size: 14px;
  font-weight: 400;
  color: #141414;
}

.network-check {
  width: 24px;
  height: 24px;
}

.check-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #deec51;
  position: relative;
}

.check-icon:after {
  content: "";
  position: absolute;
  width: 12px;
  height: 6px;
  border-left: 2px solid #141414;
  border-bottom: 2px solid #141414;
  transform: rotate(-45deg);
  top: 8px;
  left: 6px;
}

/* Дополнительные исправления для очень маленьких экранов */
@media (max-height: 600px) {
  .header {
    padding: 15px 15px; /* Уменьшаем padding header */
  }
  
  .network-item {
    padding: 12px 16px; /* Уменьшаем padding элементов сети */
  }
  
  .network-icon {
    width: 36px;
    height: 36px;
  }
  
  input {
    padding: 12px 16px; /* Уменьшаем padding input */
  }
}

/* Специфично для iPhone SE и подобных устройств */
@media (max-width: 375px) and (max-height: 667px) {
  .container {
    padding: 0 0 180px 0; /* Увеличиваем нижний отступ для маленьких экранов */
  }
  
  .btn {
    margin-bottom: 30px; /* Дополнительный отступ для кнопки */
  }
}

/* Дополнительные стили для корректного отображения на всю ширину */
@media (max-width: 768px) {
  .container {
    padding-bottom: 160px; /* Увеличиваем нижний отступ */
  }
  
  .form-container {
    padding: 24px 16px; /* Уменьшаем внутренние отступы на мобильных */
  }
}
</style>
