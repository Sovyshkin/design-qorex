<template>
  <div class="payment-page">
    <header class="header">
      <img
        class="arrow"
        src="../assets/arrow-left.svg"
        alt="Назад"
        @click="goBack"
      />
      <h1>{{ t('deposit_payment') }}</h1>
      <div class="emp"></div>
    </header>

    <main class="payment-container">
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>{{ t('loading_payment_page') }}</p>
      </div>
      
      <iframe
        v-if="paymentUrl && !loading"
        ref="paymentFrame"
        :src="paymentUrl || 'https://pay.cryptocloud.plus/3004J5FJ?lang=ru'"
        class="payment-iframe"
        @load="onIframeLoad"
        title="Payment Page"
      ></iframe>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import { useWalletStore } from '@/stores/walletStore';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const walletStore = useWalletStore();

const loading = ref(true);
const paymentFrame = ref(null);
const paymentUrl = ref(route.query.url || '');

const goBack = () => {
  router.back();
};

const onIframeLoad = () => {
  loading.value = false;
  
  // Пытаемся отслеживать изменения URL в iframe для определения успешной оплаты
  try {
    const iframe = paymentFrame.value;
    if (iframe && iframe.contentWindow) {
      // Проверяем URL на успешные паттерны
      const checkPaymentSuccess = () => {
        try {
          const iframeUrl = iframe.contentWindow.location.href;
          if (iframeUrl.includes('success') || iframeUrl.includes('completed') || iframeUrl.includes('paid')) {
            walletStore.showMessage(t('payment_successful') || 'Платеж успешно выполнен!', 'success');
            
            // Обновляем баланс пользователя
            setTimeout(() => {
              walletStore.getUser();
              router.push('/'); // Возвращаемся на главную
            }, 2000);
          }
        } catch (error) {
          // Кросс-доменные ограничения - это нормально
        }
      };
      
      // Проверяем каждые 2 секунды
      const checkInterval = setInterval(checkPaymentSuccess, 2000);
      
      // Останавливаем проверку через 10 минут
      setTimeout(() => {
        clearInterval(checkInterval);
      }, 600000);
    }
  } catch (error) {
    // Кросс-доменные ограничения
    console.log('Cannot access iframe content due to CORS policy');
  }
};

onMounted(() => {
  console.log('Payment URL:', paymentUrl.value);
});
</script>

<style scoped>
.payment-page {
  height: 100vh;
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
  flex-shrink: 0;
  border-bottom: 1px solid #e5e7eb;
}

.emp {
  width: 32px;
}

h1 {
  color: #141414;
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.payment-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #deec51;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-container p {
  margin: 0;
  color: #666;
  font-size: 16px;
}

.payment-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
}

/* Темная тема */
.dark-theme .header {
  border-bottom-color: #404040 !important;
}

.dark-theme h1 {
  color: #ffffff !important;
}

.dark-theme .loading-container p {
  color: #cccccc !important;
}

.dark-theme .loading-spinner {
  border-color: #404040 !important;
  border-top-color: #deec51 !important;
}

.dark-theme .payment-iframe {
  background: #2a2a2a;
}
</style>