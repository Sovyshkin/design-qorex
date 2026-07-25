<script setup>
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import { ref, onMounted } from "vue";
import { useWalletStore } from "@/stores/walletStore";
import { getTransactionStatusMeta } from "@/utils/transactionStatus";
import {
  getCashbackTransactionLabel,
  isCashbackTransaction,
} from "@/utils/cashbackTransaction";
import BackButton from "@/components/ui/BackButton.vue";

const { t } = useI18n();
const router = useRouter();
const route = useRoute()
const showCopiedNotification = ref(false);
const walletStore = useWalletStore();
const showPaymentChoiceModal = ref(false);
const currentPaymentUrl = ref('');
const copyStatus = ref(''); // '' | 'copying' | 'copied' | 'error'

const goBack = () => {
  router.go(-1);
};

const copy = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    showCopiedNotification.value = true;
    setTimeout(() => {
      showCopiedNotification.value = false;
    }, 2000);
  });
};

const formatDateTime = (dateInput) => {
  if (!dateInput) {
    return "Некорректная дата";
  }

  let date;
  
  // Проверяем если формат "DD.MM.YYYY-HH:MM:SS"
  // Важно: используем конструктор Date с отдельными параметрами для корректной работы с часовым поясом
  if (typeof dateInput === 'string' && dateInput.includes('-') && dateInput.includes('.')) {
    try {
      // Разбираем формат "30.10.2025-14:04:34"
      const [datePart, timePart] = dateInput.split('-');
      const [day, month, year] = datePart.split('.');
      const [hours, minutes, seconds] = timePart.split(':');
      
      // Создаем дату напрямую в локальном часовом поясе
      // Используем конструктор Date(year, month, day, hours, minutes, seconds)
      // month-1 потому что месяцы в JavaScript начинаются с 0
      date = new Date(
        parseInt(year), 
        parseInt(month) - 1, 
        parseInt(day), 
        parseInt(hours), 
        parseInt(minutes), 
        seconds ? parseInt(seconds) : 0
      );
    } catch (error) {
      console.error('Error parsing date:', dateInput, error);
      date = new Date(dateInput);
    }
  } else if (typeof dateInput === 'string' && /^\d+$/.test(dateInput)) {
    // Если это timestamp в виде строки
    date = new Date(parseInt(dateInput));
  } else {
    // Пробуем создать дату напрямую
    date = new Date(dateInput);
  }
  
  if (isNaN(date.getTime())) {
    console.error('Invalid date:', dateInput);
    return "Некорректная дата";
  }
  
  // Форматируем дату в локальном часовом поясе пользователя
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}.${month}.${year} ${hours}:${minutes}`;
};

const getTransactionStatus = (boolSuccess) =>
  getTransactionStatusMeta(boolSuccess, t);

const transactionTitle = () => {
  const type = walletStore.transaction.type_trans;
  if (isCashbackTransaction(type)) return getCashbackTransactionLabel(type);
  return type === "transfer" ? t("transfer_transaction") : t(type);
};

const transactionSign = () => {
  const type = walletStore.transaction.type_trans;
  return ["buy", "output", "transfer"].includes(type) ? "-" : "+";
};

const transactionPrimaryAmount = () => {
  if (isCashbackTransaction(walletStore.transaction.type_trans)) {
    return `${transactionSign()}${walletStore.roundToHundredths(walletStore.transaction.amount)} ₽`;
  }

  return `${transactionSign()}${walletStore.roundToHundredths(walletStore.transaction.amount)} USDT`;
};

const transactionSecondaryAmount = () => {
  if (isCashbackTransaction(walletStore.transaction.type_trans)) {
    return "Возврат комиссии";
  }

  return `${transactionSign()}${walletStore.roundToHundredths(walletStore.transaction.amountRub)} ₽`;
};

// Проверяем, можно ли показать кнопку просмотра счета
const canViewInvoice = (transactionType, transactionId) => {
  // Показываем только для пополнений с страницы deposit (только input) и если ID не содержит символ _
  // receiving - это переводы между пользователями, input - пополнение с deposit
  return transactionType === 'input' && 
         transactionId && 
         !transactionId.toString().includes('_');
};

// Открываем модальное окно для выбора способа просмотра счета
const viewInvoice = (transactionId, event) => {
  console.log('viewInvoice called with:', transactionId);
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const url = `https://pay.cryptocloud.plus/${transactionId}`;
  currentPaymentUrl.value = url;
  showPaymentChoiceModal.value = true;
  console.log('Modal should be visible:', showPaymentChoiceModal.value);
};

// Функции для обработки выбора способа просмотра
const handleCopyLink = async (url) => {
  console.log('📋 Copy link handler called with URL:', url);
  copyStatus.value = 'copying';
  
  try {
    await navigator.clipboard.writeText(url);
    copyStatus.value = 'copied';
    walletStore.showMessage('Ссылка скопирована в буфер обмена', 'success');
    console.log('✅ Link copied successfully');
    
    // Сбрасываем статус через 2 секунды
    setTimeout(() => {
      copyStatus.value = '';
    }, 2000);
  } catch (error) {
    copyStatus.value = 'error';
    console.error('❌ Failed to copy link:', error);
    walletStore.showMessage('Не удалось скопировать ссылку', 'error');
    
    // Сбрасываем статус через 2 секунды
    setTimeout(() => {
      copyStatus.value = '';
    }, 2000);
  }
};

const handleOpenInApp = (url) => {
  console.log('📱 Open in app handler called with URL:', url);
  // Переходим на страницу оплаты с URL в параметрах
  router.push({ 
    name: 'payment', 
    query: { url: url }
  });
  showPaymentChoiceModal.value = false;
};

const closePaymentModal = () => {
  console.log('❌ Close payment modal called');
  copyStatus.value = ''; // Сбрасываем статус копирования
  showPaymentChoiceModal.value = false;
};

const copyPaymentLink = () => {
  handleCopyLink(currentPaymentUrl.value);
};

onMounted(() => {
  let { id, amount_usdt, amount_rub, datatime, type_trans, bool_suecess } = route.query
  if (id && amount_usdt && amount_rub && datatime && type_trans && bool_suecess) {
    walletStore.transaction.id = id
    walletStore.transaction.amount = walletStore.roundToHundredths(amount_usdt)
    walletStore.transaction.amountRub = walletStore.roundToHundredths(amount_rub)
    walletStore.transaction.datatime = datatime
    walletStore.transaction.type_trans = type_trans
    walletStore.transaction.bool_suecess = bool_suecess
  }
})
</script>

<template>
  <div class="transaction-page" :class="{ 'is-dark': walletStore.isDarkTheme }">
    <header class="header">
      <BackButton @click="goBack()" />
      <h1>{{ transactionTitle() }}</h1>
      <div class="emp"></div>
    </header>

    <div class="transaction-content">
      <div class="transaction-header">
        <div class="wrap-img">
          <img
            v-if="walletStore.transaction.type_trans === 'referal'"
            src="../assets/referal.svg"
            alt="transaction-type"
          />
          <img
            v-else-if="isCashbackTransaction(walletStore.transaction.type_trans)"
            src="../assets/referal.svg"
            alt="transaction-type"
          />
          <img
            v-else-if="walletStore.transaction.type_trans === 'receiving'"
            src="../assets/deposit.svg"
            alt="transaction-type"
          />
          <img
            v-else-if="walletStore.transaction.type_trans === 'transfer'"
            src="../assets/send.png"
            alt="transaction-type"
          />
          <img
            v-else
            :src="`../assets/type-${walletStore.transaction.type_trans}.svg`"
            alt="transaction-type"
          />
        </div>
        <div class="transaction-amounts">
          <span class="amount-usdt">{{ transactionPrimaryAmount() }}</span>
          <span class="amount-rub">{{ transactionSecondaryAmount() }}</span>
        </div>
      </div>

      <!-- <div class="status-badge" :class="walletStore.transaction.status">
        {{ t(walletStore.transaction.status) }}
      </div> -->
      <span 
        :class="`status-badge ${getTransactionStatus(walletStore.transaction.bool_suecess).class}`"
      >
        {{ getTransactionStatus(walletStore.transaction.bool_suecess).text }}
      </span>

      <div class="transaction-details">
        <div class="detail-item">
          <span class="detail-label">{{ t("date_time") }}:</span>
          <span class="detail-value">{{
            formatDateTime(walletStore.transaction.datatime)
          }}</span>
        </div>

        <div class="detail-item" v-if="walletStore.transaction.type_trans == 'input'">
          <span class="detail-label">{{ t("transaction_id") }}:</span>
          <div class="detail-value-container">
            <span
              @click="copy(walletStore.transaction.working_invoce)"
              class="detail-value clickable"
              >{{ walletStore.transaction.working_invoce }} <img
              src="@/assets/copy.svg" alt="copy"></span>
            <button 
              v-if="canViewInvoice(walletStore.transaction.type_trans, walletStore.transaction.working_invoce)"
              @click.prevent="viewInvoice(walletStore.transaction.working_invoce, $event)"
              class="view-invoice-btn"
            >
              {{ t('view_invoice') }}
            </button>
          </div>
        </div>
        <div class="detail-item" v-else>
          <span class="detail-label">{{ t("transaction_id") }}:</span>
          <div class="detail-value-container">
            <span
              @click="copy(walletStore.transaction.id)"
              class="detail-value clickable"
              >{{ walletStore.transaction.id }} <img
              src="@/assets/copy.svg" alt="copy"></span>
            <button 
              v-if="canViewInvoice(walletStore.transaction.type_trans, walletStore.transaction.id)"
              @click.prevent="viewInvoice(walletStore.transaction.id, $event)"
              class="view-invoice-btn"
            >
              {{ t('view_invoice') }}
            </button>
          </div>
        </div>

        <div class="detail-item">
          <span class="detail-label">{{ t("currency_pair") }}:</span>
          <span class="detail-value">
            {{ isCashbackTransaction(walletStore.transaction.type_trans) ? "RUB" : "USDT / RUB" }}
          </span>
        </div>

        <div class="detail-item">
          <span class="detail-label">{{ t("seller") }}:</span>
          <span class="detail-value">PeekPay</span>
        </div>

        <!-- <div class="detail-item">
          <span class="detail-label">{{ t("mcc_code") }}:</span>
          <span
            @click="copy(walletStore.transaction.mccCode)"
            class="detail-value"
            >{{ walletStore.transaction.mccCode }}
            <img src="@/assets/copy.svg" alt="copy"
          /></span>
        </div> -->
      </div>
      <transition name="fade">
        <div v-if="showCopiedNotification" class="copied-notification">
          {{ t("copied") }}
        </div>
      </transition>
    </div>
  </div>

  <!-- Модальное окно выбора способа просмотра счета -->
  <div 
    v-if="showPaymentChoiceModal" 
    class="payment-modal-overlay"
    @click.self="closePaymentModal"
  >
    <div class="payment-modal">
      <div class="modal-header">
        <h3 class="modal-title">Просмотр счёта</h3>
        <p class="modal-subtitle">Выберите способ просмотра счёта</p>
      </div>
      
      <div class="payment-methods">
        <button 
          class="payment-method-btn" 
          :class="{ 
            'copying': copyStatus === 'copying', 
            'copied': copyStatus === 'copied',
            'error': copyStatus === 'error'
          }"
          @click="copyPaymentLink"
          :disabled="copyStatus === 'copying'"
        >
          <div class="method-icon">
            <span v-if="copyStatus === 'copying'">⏳</span>
            <span v-else-if="copyStatus === 'copied'">✅</span>
            <span v-else-if="copyStatus === 'error'">❌</span>
            <span v-else>📋</span>
          </div>
          <div class="method-text">
            <div class="method-title">Скопировать ссылку</div>
            <div class="method-description">Откройте в любом браузере</div>
          </div>
        </button>
        
        <button 
          class="payment-method-btn" 
          @click="handleOpenInApp(currentPaymentUrl)"
        >
          <div class="method-icon">📱</div>
          <div class="method-text">
            <div class="method-title">Открыть в приложении</div>
            <div class="method-description">Встроенный браузер</div>
          </div>
        </button>
      </div>
      
      <div class="modal-actions">
        <button class="modal-close-btn" @click="closePaymentModal">
          Закрыть
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.transaction-page {
  width: 100%;
  height: 100vh;
  color: #0F172A;
  display: flex;
  flex-direction: column;
}

.header {
  padding: 20px 15px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

h1 {
  color: #0F172A;
}

.emp {
  width: 32px;
}

.arrow {
  cursor: pointer;
}

.transaction-content {
  flex: 1;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.transaction-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.transaction-header h2 {
  font-size: 18px;
  font-weight: 500;
  margin: 0;
}

.transaction-amounts {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.amount-usdt {
  font-size: 24px;
  font-weight: 400;
  text-align: center;
}

.amount-rub {
  font-size: 16px;
  opacity: 0.4;
  font-weight: 300;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 400;
}

.success {
  background-color: rgba(29%, 67%, 42%, 0.1);
  color: #4bab6b;
}

.error {
  background-color: rgba(84%, 16%, 16%, 0.1);
  color: #d62828;
}

.in_processing {
  background-color: rgba(213, 168, 16, 0.1);
  color: #d5a810;
}

.transaction-details {
  width: 100%;
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.detail-label {
  opacity: 0.4;
  font-size: 12px;
  font-weight: 300;
  min-width: 80px;
}

.detail-value-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex: 1;
}

.detail-value {
  font-size: 12px;
  font-weight: 400;
  text-align: right;
}

.detail-value.clickable {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.view-invoice-btn {
  background: linear-gradient(135deg, #2563EB 0%, #c4d639 100%);
  border: none;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 10px;
  font-weight: 500;
  color: #0F172A;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.view-invoice-btn:hover {
  background: linear-gradient(135deg, #c4d639 0%, #b0c230 100%);
  transform: translateY(-1px);
}

.view-invoice-btn:active {
  transform: translateY(0);
}

.wrap-img {
  background-color: #2563EB;
  padding: 8px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wrap-img img {
  height: 48px;
  width: 48px;
}

.copied-notification {
  position: fixed;
  bottom: 30px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 14px;
  z-index: 1000;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Модальное окно просмотра счета */
.payment-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(12px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
  animation: modalOverlayAppear 0.3s ease-out;
}

@keyframes modalOverlayAppear {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(12px);
  }
}

.payment-modal {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 24px;
  padding: 32px 28px;
  width: 90%;
  max-width: 400px;
  margin: 0 20px;
  box-shadow: 
    0 32px 64px -12px rgba(0, 0, 0, 0.25),
    0 20px 25px -5px rgba(0, 0, 0, 0.15),
    0 10px 10px -5px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.3);
  animation: modalAppear 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  backdrop-filter: blur(20px);
  position: relative;
  overflow: hidden;
}

@keyframes modalAppear {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(-50px);
    filter: blur(4px);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.02) translateY(-20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
    filter: blur(0px);
  }
}

.modal-header {
  text-align: center;
  margin-bottom: 28px;
  position: relative;
  z-index: 1;
}

.modal-title {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
  line-height: 1.3;
}

.modal-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

.payment-methods {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
}

.payment-method-btn {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  color: #374151;
  transition: all 0.3s ease;
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.payment-method-btn:hover {
  background: linear-gradient(135deg, #2563EB 0%, #60A5FA 100%);
  border-color: #2563EB;
  color: #000000;
  transform: translateY(-2px);
  box-shadow: 
    0 8px 20px rgba(222, 236, 81, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.method-icon {
  width: 24px;
  height: 24px;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.method-text {
  flex: 1;
  text-align: left;
}

.method-title {
  font-weight: 700;
  margin-bottom: 2px;
}

.method-description {
  font-size: 13px;
  color: #666666;
  font-weight: 400;
}

.payment-method-btn.copying {
  background: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%);
  border-color: #87ceeb;
  cursor: not-allowed;
}

.payment-method-btn.copied {
  background: linear-gradient(135deg, #2563EB 0%, #60A5FA 100%);
  border-color: #2563EB;
  animation: pulse-success 0.5s ease-out;
}

.payment-method-btn.error {
  background: linear-gradient(135deg, #ffe6e6 0%, #ffcccc 100%);
  border-color: #ff6b6b;
  animation: shake 0.5s ease-out;
}

@keyframes pulse-success {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes shake {
  0%, 20%, 40%, 60%, 80%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
}

.modal-actions {
  position: relative;
  z-index: 1;
}

.modal-close-btn {
  background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%);
  border: 2px solid #d0d0d0;
  border-radius: 16px;
  padding: 14px 24px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  color: #000000;
  width: 100%;
  transition: all 0.3s ease;
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.modal-close-btn:hover {
  background: linear-gradient(135deg, #e0e0e0 0%, #d0d0d0 100%);
  border-color: #999999;
  color: #000000;
  transform: translateY(-2px);
  box-shadow: 
    0 8px 20px rgba(0, 0, 0, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

/* Refined transaction receipt */
.transaction-page {
  min-height: 100vh;
  min-height: 100dvh;
  height: auto;
  padding-bottom: 124px;
  background: radial-gradient(620px 280px at 50% -10%, #dbeafe 0%, transparent 68%), #f1f5f9;
}

.transaction-page .header {
  min-height: 82px;
  padding: 16px !important;
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) 48px;
  background: transparent !important;
}

.transaction-page .header h1 {
  margin: 0;
  color: #0f172a !important;
  font-size: 24px !important;
  line-height: 1.15 !important;
  font-weight: 750 !important;
  text-align: center;
}

.transaction-page .transaction-content {
  flex: none;
  padding: 10px 16px 28px !important;
  gap: 18px;
}

.transaction-page .transaction-header {
  width: 100%;
  padding: 30px 18px 46px !important;
  gap: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 26px;
  background: #fff;
  box-shadow: 0 16px 36px rgba(15, 23, 42, .08);
}

.transaction-page .wrap-img {
  width: 68px;
  height: 68px;
  padding: 17px;
  border-radius: 22px;
  background: linear-gradient(145deg, #3b82f6, #1e40af) !important;
  box-shadow: 0 14px 28px rgba(37, 99, 235, .28);
}

.transaction-page .wrap-img img {
  width: 34px;
  height: 34px;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

.transaction-page .transaction-amounts { gap: 7px; }
.transaction-page .amount-usdt {
  color: #0f172a !important;
  font-size: 31px;
  line-height: 1.05;
  font-weight: 780;
  letter-spacing: -.025em;
}
.transaction-page .amount-rub {
  color: #64748b !important;
  opacity: 1;
  font-size: 15px;
  font-weight: 550;
}

.transaction-page .status-badge {
  margin-top: -62px;
  margin-bottom: 22px;
  padding: 8px 13px;
  border-radius: 999px;
  font-size: 12px;
  line-height: 1;
  font-weight: 750;
}

.transaction-page .transaction-details {
  padding: 8px 18px;
  gap: 0;
  border: 1px solid #e2e8f0 !important;
  border-radius: 24px !important;
  background: #fff !important;
  box-shadow: 0 14px 32px rgba(15, 23, 42, .08) !important;
}

.transaction-page .detail-item {
  min-height: 58px;
  padding: 14px 0;
  display: grid;
  grid-template-columns: minmax(105px, .8fr) minmax(0, 1.2fr);
  align-items: center;
  gap: 12px;
  border: 0 !important;
  border-bottom: 1px solid #e2e8f0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}
.transaction-page .detail-item:last-child { border-bottom: 0 !important; }
.transaction-page .detail-label {
  min-width: 0;
  color: #64748b !important;
  opacity: 1;
  font-size: 12px;
  line-height: 1.35;
  font-weight: 600;
}
.transaction-page .detail-value,
.transaction-page .detail-value-container {
  min-width: 0;
  color: #0f172a !important;
  font-size: 13px;
  line-height: 1.35;
  font-weight: 700;
}
.transaction-page .detail-value.clickable {
  justify-content: flex-end;
  overflow-wrap: anywhere;
}
.transaction-page .detail-value img { width: 17px; height: 17px; flex: 0 0 17px; }

.transaction-page.is-dark {
  background: #0d1b2a !important;
  color: #fff !important;
}
.transaction-page.is-dark .header,
.transaction-page.is-dark .transaction-content { background: transparent !important; }
.transaction-page.is-dark .header h1,
.transaction-page.is-dark .amount-usdt { color: #fff !important; }
.transaction-page.is-dark .amount-rub,
.transaction-page.is-dark .detail-label { color: #94a3b8 !important; }
.transaction-page.is-dark .transaction-header,
.transaction-page.is-dark .transaction-details {
  background: #1e273b !important;
  border-color: rgba(255, 255, 255, .08) !important;
  box-shadow: 0 18px 36px rgba(0, 0, 0, .28) !important;
}
.transaction-page.is-dark .detail-item {
  background: transparent !important;
  border-color: rgba(255, 255, 255, .07) !important;
}
.transaction-page.is-dark .detail-value,
.transaction-page.is-dark .detail-value-container { color: #fff !important; }
.transaction-page.is-dark .detail-value img { filter: brightness(0) invert(1); opacity: .86; }
.transaction-page.is-dark .success { background: rgba(16, 185, 129, .14) !important; color: #34d399 !important; }
.transaction-page.is-dark .error { background: rgba(239, 68, 68, .14) !important; color: #f87171 !important; }
.transaction-page.is-dark .in_processing { background: rgba(59, 130, 246, .15) !important; color: #60a5fa !important; }

/* Light receipt stays clean: no outlined fields inside the details card. */
:global(body:not(.dark-theme)) .transaction-page:not(.is-dark) .transaction-details {
  border: 0 !important;
  box-shadow: 0 16px 36px rgba(15, 23, 42, .09) !important;
}
:global(body:not(.dark-theme)) .transaction-page:not(.is-dark) .transaction-details > .detail-item {
  border: 0 !important;
  border-radius: 0 !important;
  outline: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}
:global(body:not(.dark-theme)) .transaction-page:not(.is-dark) .transaction-details > .detail-item + .detail-item {
  border-top: 1px solid rgba(226, 232, 240, .72) !important;
}

@media (max-width: 360px) {
  .transaction-page .transaction-content { padding-inline: 12px !important; }
  .transaction-page .amount-usdt { font-size: 27px; }
  .transaction-page .detail-item { grid-template-columns: minmax(88px, .75fr) minmax(0, 1.25fr); }
}
</style>
