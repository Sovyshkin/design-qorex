<script setup>
import { useI18n } from "vue-i18n";
import { useWalletStore } from '@/stores/walletStore.ts'
import { ref, computed, onMounted } from "vue";
import AppLoader from '@/components/AppLoader.vue';
import Require2FA from '@/components/Require2FA.vue';
import WithdrawSuccess from '@/components/WithdrawSuccess.vue';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const walletStore = useWalletStore();
const router = useRouter();
const amount = ref("");
const walletAddress = ref("");
const memo = ref("");
const selectedNetwork = ref("USDT_TRC20");
const isWithdrawing = ref(false); // Состояние загрузки для кнопки вывода
const twoFactorCode = ref("");
const twoFactorKey = ref("");
const isTwoFactorSetupComplete = ref(false);
const isLoading = ref(true);
const showSuccessModal = ref(false);
const withdrawData = ref({
  amount: '',
  network: '',
  walletAddress: ''
});

const networks = [
  { id: "USDT_TRC20", name: "TRC20 (Tron)", icon: "usdt" },
  { id: "USDT_TON", name: "TON", icon: "ton" },
  { id: "USDT_ERC20", name: "ERC20 (Ethereum)", icon: "ethereum" }
];

const isFormValid = computed(() => {
  const code = twoFactorCode.value.trim();
  const amountNum = parseFloat(amount.value);
  return amount.value &&
         walletAddress.value &&
         selectedNetwork.value &&
         amountNum >= 5 &&
         amountNum <= walletStore.balance &&
         code.length === 6 &&
         !isWithdrawing.value;
});

const handleWithdraw = async () => {
  if (!isFormValid.value || isWithdrawing.value) return;
  
  // Конвертируем USDT_TRC20 -> TRC20 для API
  const networkId = selectedNetwork.value.replace('USDT_', '');
  
  isWithdrawing.value = true;
  try {
    console.log('Starting withdraw with params:', {
      amount: amount.value,
      networkId,
      walletAddress: walletAddress.value,
      memo: memo.value,
      twoFactorCode: twoFactorCode.value.length
    });
    
    const result = await walletStore.withdrawFunds(
      amount.value,
      networkId,
      walletAddress.value,
      memo.value,
      twoFactorCode.value.trim()
    );
    
    console.log('Withdraw result:', result);
    
    // Если вывод успешен, показываем модальное окно с подтверждением
    if (result) {
      // Сохраняем данные для модального окна
      const networkName = networks.find(n => n.id === selectedNetwork.value)?.name || selectedNetwork.value;
      withdrawData.value = {
        amount: amount.value,
        network: networkName,
        walletAddress: walletAddress.value
      };
      
      showSuccessModal.value = true;
      
      // Очищаем форму
      amount.value = '';
      walletAddress.value = '';
      memo.value = '';
      twoFactorCode.value = '';
      
      // Дополнительная защита: логируем что модальное окно должно быть открыто
      console.log('Success modal opened for withdrawal');
    }
  } catch (error) {
    console.error('Withdraw error in component:', error);
  } finally {
    isWithdrawing.value = false;
  }
};

const checkTwoFactorAccess = async () => {
  try {
    // Делаем только один запрос на /fa_take для проверки статуса
    const result = await walletStore.enable2FA();
    
    if (result.success && result.qrImage && result.key) {
      // В ответе есть QR и ключ - нужно настроить 2FA
      twoFactorKey.value = result.key;
      // Не показываем форму вывода, пока 2FA не настроен
    } else if (result.detail === "Уже подключено!") {
      // 2FA уже подключен - устанавливаем флаг и разрешаем доступ к форме
      walletStore.has2FA = true;
      isTwoFactorSetupComplete.value = true;
    } else {
      // Другой случай - разрешаем доступ к форме
      isTwoFactorSetupComplete.value = true;
    }
  } catch (error) {
    console.error('Error checking 2FA access:', error);
    // Если ошибка в fa_take, значит 2FA не настроен, показываем Require2FA
    isTwoFactorSetupComplete.value = false;
  } finally {
    // Всегда завершаем загрузку
    isLoading.value = false;
  }
};

const preventNegativeAmount = (event) => {
  let value = event.target.value;
  
  // Если значение пустое, не обрабатываем
  if (!value) return;
  
  const numValue = parseFloat(value);
  
  // Проверяем на отрицательные значения
  if (numValue < 0) {
    amount.value = '';
    return;
  }
  
  // Проверяем превышение баланса
  if (numValue > walletStore.balance) {
    amount.value = walletStore.balance.toString();
    return;
  }
  
  // Ограничиваем до 2 знаков после запятой только если пользователь ввел больше
  if (value.includes('.')) {
    const parts = value.split('.');
    if (parts[1] && parts[1].length > 2) {
      // Обрезаем только лишние символы, не форматируем
      amount.value = parts[0] + '.' + parts[1].substring(0, 2);
    }
  }
};

const closeSuccessModal = () => {
  console.log('Closing success modal and updating balance');
  showSuccessModal.value = false;
  // Обновляем баланс только после закрытия модального окна
  walletStore.getUser();
};

onMounted(async () => {
  // Проверяем доступ к странице вывода через 2FA
  await checkTwoFactorAccess();
});
</script>

<template>
  <!-- Показываем загрузку пока проверяем статус 2FA -->
  <div v-if="isLoading" class="loading-screen">
    <AppLoader />
  </div>

  <!-- Показываем компонент Require2FA, если нужно настроить 2FA -->
  <Require2FA v-else-if="!isTwoFactorSetupComplete" />

  <!-- Показываем форму вывода, если 2FA успешно подключен -->
  <div v-else-if="isTwoFactorSetupComplete">
    <transition name="fade-down" appear>
      <header class="header">
        <img
          class="arrow"
          src="../assets/arrow-left.svg"
          alt=""
          @click="walletStore.goBack()"
        />
        <h1>{{ t("withdraw_page") }}</h1>
        <div class="emp"></div>
      </header>
    </transition>
    <transition name="fade-scale" appear>
      <main class="container">
      <div class="form-container">
        <div class="group">
          <input 
            type="number" 
            placeholder="min 5 USDT" 
            id="amount" 
            v-model="amount" 
            :disabled="isWithdrawing"
            @input="preventNegativeAmount"
          />
          <span class="group-item">USDT</span>
        </div>
        
        <!-- Отображение доступного баланса -->
        <div class="balance-info">
          <span>{{ t('available_balance') }}</span>
          <span class="balance-value">{{ walletStore.roundToHundredths(walletStore.balance) }} USDT</span>
        </div>
      
      <div class="network-selector">
        <h3>Выберите сеть</h3>
        <div class="networks-list">
          <div 
            v-for="network in networks" 
            :key="network.id" 
            class="network-item" 
            :class="{ active: selectedNetwork === network.id, disabled: isWithdrawing }"
            :style="{ pointerEvents: isWithdrawing ? 'none' : 'auto' }"
            @click="!isWithdrawing && (selectedNetwork = network.id)"
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

      <input 
        type="text" 
        :placeholder="t('enter_wallet_address')" 
        id="wallet" 
        v-model="walletAddress"
        :disabled="isWithdrawing"
        required
      />

      <div class="memo-container">
        <input 
          type="text" 
          :placeholder="t('memo_optional')" 
          id="memo" 
          v-model="memo"
          :disabled="isWithdrawing"
        />
        <p class="memo-note">{{ t('memo_warning') }}</p>
      </div>
      
      <!-- Поле ввода кода 2FA -->
      <div class="code-input-section">
        <h4>{{ t('enter_2fa_code') }}</h4>
        <input 
          type="text" 
          :placeholder="t('enter_6_digit_code')" 
          v-model="twoFactorCode"
          :disabled="isWithdrawing"
          maxlength="6"
          class="code-input"
          inputmode="numeric"
          pattern="[0-9]*"
        />
      </div>

      <!-- Информация о комиссиях -->
      <div class="fees-info">
        <div class="fees-header">
          <img src="/assets/info.svg" alt="info" class="info-icon" />
          <h4>Информация о комиссиях</h4>
        </div>
        <div class="fees-content">
          <div class="fee-item">
            <span class="fee-label">Комиссия сервиса:</span>
            <span class="fee-value">1%</span>
          </div>
          <div class="fee-item">
            <span class="fee-label">Сетевая комиссия:</span>
            <span class="fee-value">Зависит от сети</span>
          </div>
        </div>
        <p class="fees-note">Сетевая комиссия списывается блокчейном автоматически</p>
      </div>
    </div>
    
    <button 
      class="btn" 
      :class="{ disabled: !isFormValid || isWithdrawing }"
      :disabled="!isFormValid || isWithdrawing"
      @click="handleWithdraw()"
    >
      <AppLoader v-if="isWithdrawing" class="btn-loader" />
      <span v-else>{{ t("withdraw_funds") }}</span>
    </button>
    </main>
    </transition>
  </div>
  
  <!-- Модальное окно с подтверждением успешного вывода -->
  <Transition name="modal" appear>
    <WithdrawSuccess
      v-if="showSuccessModal"
      :amount="withdrawData.amount"
      :network="withdrawData.network"
      :wallet-address="withdrawData.walletAddress"
      @close="closeSuccessModal"
    />
  </Transition>
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
  gap: 32px;
  padding: 0 0 120px 0;
  overflow-y: auto;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  min-height: calc(100vh - 80px);
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
  background: linear-gradient(90deg, #deec51, #d6e34a, #c9d93d);
}

.btn {
  width: calc(100% - 40px);
  margin: 0 20px;
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

.group {
  position: relative;
}

.group-item {
  position: absolute;
  right: 4%;
  top: 50%;
  transform: translateY(-50%);
}

.memo-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.memo-note {
  font-size: 12px;
  color: #ff6b6b;
  padding: 0 4px;
  margin: 0;
  line-height: 1.4;
}

.network-selector {
  margin-top: 8px;
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

/* Стили для заблокированных элементов */
input:disabled,
textarea:disabled,
select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #f8f9fa !important;
}

.network-item.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f5f5f5;
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
  background: linear-gradient(180deg, #deec51 0%, #d6e34a 100%);
}

.balance-value {
  font-weight: 700;
  color: #1e293b;
  font-size: 16px;
}

.code-input-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.code-input-section h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  text-align: center;
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
  caret-color: #deec51 !important;
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1) !important;
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.8) !important;
}

.code-input:focus {
  border-color: #deec51 !important;
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

/* Стили для блока информации о комиссиях */
.fees-info {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 2px solid #f59e0b;
  border-radius: 20px;
  padding: 24px;
  margin-top: 8px;
  box-shadow: 
    0 8px 24px rgba(245, 158, 11, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  position: relative;
  overflow: hidden;
  animation: fadeInUp 0.6s ease-out;
}

.fees-info::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b);
  border-radius: 20px 20px 0 0;
}

.fees-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.info-icon {
  width: 20px;
  height: 20px;
  filter: brightness(0) saturate(100%) invert(44%) sepia(82%) saturate(2106%) hue-rotate(18deg) brightness(94%) contrast(98%);
}

.fees-header h4 {
  font-size: 16px;
  font-weight: 600;
  color: #92400e;
  margin: 0;
}

.fees-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}

.fee-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0;
}

.fee-label {
  font-size: 14px;
  font-weight: 500;
  color: #92400e;
}

.fee-value {
  font-size: 14px;
  font-weight: 600;
  color: #92400e;
  padding: 4px 12px;
  background: rgba(245, 158, 11, 0.2);
  border-radius: 12px;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.fees-note {
  font-size: 12px;
  color: #a16207;
  margin: 0;
  text-align: center;
  font-style: italic;
  line-height: 1.4;
}

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

/* Анимации для модального окна */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Темная тема */
@media (prefers-color-scheme: dark) {
  h1 {
    color: #ffffff;
  }

  .container {
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  }

  .form-container {
    background: linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(45, 45, 45, 0.9) 100%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }

  .network-selector h3 {
    color: #ffffff;
  }

  .network-item {
    background: linear-gradient(135deg, rgba(45, 45, 45, 0.9) 0%, rgba(55, 55, 55, 0.85) 100%);
    border: 2px solid rgba(255, 255, 255, 0.15);
    color: #ffffff;
  }

  .network-item:hover {
    background: linear-gradient(135deg, rgba(55, 55, 55, 0.95) 0%, rgba(65, 65, 65, 0.9) 100%);
    border-color: #deec51;
  }

  .network-item.active {
    background: linear-gradient(135deg, rgba(60, 50, 20, 0.9) 0%, rgba(70, 60, 30, 0.85) 100%);
    border: 2px solid #deec51;
  }

  .network-name {
    color: #ffffff;
  }

  input,
  textarea,
  select {
    background: linear-gradient(135deg, rgba(45, 45, 45, 0.9) 0%, rgba(55, 55, 55, 0.85) 100%);
    border: 2px solid rgba(255, 255, 255, 0.2);
    color: #ffffff;
  }

  input:focus,
  textarea:focus,
  select:focus {
    background: rgba(55, 55, 55, 0.95);
    border-color: #deec51;
  }

  input::placeholder,
  textarea::placeholder,
  select::placeholder {
    color: #888888;
  }

  .balance-info {
    background: linear-gradient(135deg, rgba(45, 45, 45, 0.9) 0%, rgba(55, 55, 55, 0.85) 100%);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #ffffff;
  }

  .balance-value {
    color: #ffffff;
  }

  .code-input-section h4 {
    color: #ffffff;
  }

  .code-input {
    background: linear-gradient(135deg, rgba(45, 45, 45, 0.9) 0%, rgba(55, 55, 55, 0.85) 100%) !important;
    border: 2px solid rgba(255, 255, 255, 0.2) !important;
    color: #ffffff !important;
  }

  .code-input:focus {
    background: rgba(55, 55, 55, 0.95) !important;
    border-color: #deec51 !important;
  }

  .code-input::placeholder {
    color: #888888 !important;
  }

  .memo-note {
    color: #ff8a8a;
  }

  /* Стили для блока комиссий в темной теме */
  .fees-info {
    background: linear-gradient(135deg, rgba(60, 45, 20, 0.9) 0%, rgba(70, 55, 30, 0.85) 100%);
    border: 2px solid rgba(245, 158, 11, 0.6);
  }

  .fees-info::before {
    background: linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b);
  }

  .info-icon {
    filter: brightness(0) saturate(100%) invert(68%) sepia(82%) saturate(1106%) hue-rotate(18deg) brightness(104%) contrast(98%);
  }

  .fees-header h4 {
    color: #fbbf24;
  }

  .fee-label {
    color: #fde68a;
  }

  .fee-value {
    color: #fbbf24;
    background: rgba(245, 158, 11, 0.3);
    border: 1px solid rgba(245, 158, 11, 0.5);
  }

  .fees-note {
    color: #fde68a;
  }
}
</style>
