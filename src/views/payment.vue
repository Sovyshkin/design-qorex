<template>
  <div class="payment-page">
    <header class="payment-header">
      <img class="arrow" src="../assets/arrow-left.svg" alt="Назад" @click="goBack" />
      <h1>{{ t('deposit_payment') }}</h1>
      <div class="emp"></div>
    </header>

    <main class="payment-shell">
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>{{ t('loading_payment_page') }}</p>
      </div>

      <iframe
        v-if="paymentUrl"
        v-show="!loading"
        ref="paymentFrame"
        :src="paymentUrl"
        class="payment-iframe"
        @load="onIframeLoad"
        @error="onIframeError"
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

const goBack = () => router.back();

const onIframeLoad = () => {
  loading.value = false;
  try {
    const iframe = paymentFrame.value;
    if (iframe && iframe.contentWindow) {
      const checkPaymentSuccess = () => {
        try {
          const iframeUrl = iframe.contentWindow.location.href;
          if (iframeUrl.includes('success') || iframeUrl.includes('completed') || iframeUrl.includes('paid')) {
            walletStore.showMessage(t('payment_successful') || 'Платеж успешно выполнен!', 'success');
            setTimeout(() => { walletStore.getUser(); router.push('/'); }, 2000);
          }
        } catch (_e) {}
      };
      const checkInterval = setInterval(checkPaymentSuccess, 2000);
      setTimeout(() => clearInterval(checkInterval), 600000);
    }
  } catch (_e) {}
};

const onIframeError = () => {
  loading.value = false;
  walletStore.showMessage('Ошибка загрузки страницы оплаты. Попробуйте еще раз.', 'error');
  setTimeout(() => router.back(), 3000);
};

onMounted(() => {
  if (!paymentUrl.value) {
    walletStore.showMessage('Ошибка: не получена ссылка для оплаты', 'error');
    setTimeout(() => router.back(), 2000);
    loading.value = false;
    return;
  }
  setTimeout(() => {
    if (loading.value) {
      loading.value = false;
      walletStore.showMessage('Превышено время ожидания загрузки. Проверьте соединение.', 'error');
    }
  }, 15000);
});
</script>

<style scoped>
.payment-page { min-height: 100vh; background: #f1f5f9; }
.payment-header { padding: 16px; display: flex; align-items: center; justify-content: space-between; }
.arrow, .emp { width: 24px; height: 24px; }
h1 { margin: 0; color: #0f172a; font-size: 20px; font-weight: 600; }
.payment-shell { margin: 0 16px 124px; min-height: 72vh; border-radius: 24px; border: 1px solid #e2e8f0; background: #fff; box-shadow: 0 10px 26px rgba(15,23,42,.08); overflow: hidden; }
.loading-container { min-height: 72vh; display: grid; place-items: center; gap: 10px; color: #64748b; }
.loading-spinner { width: 38px; height: 38px; border: 3px solid #bfdbfe; border-top-color: #2563eb; border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.payment-iframe { width: 100%; min-height: 72vh; border: 0; }

:global(.dark-theme) .payment-page {
  background:
    radial-gradient(720px 320px at 50% -18%, rgba(37, 98, 235, 0.18), transparent 62%),
    linear-gradient(180deg, #07111f 0%, #0d1b2a 100%) !important;
}

:global(.dark-theme) .payment-header h1 {
  color: #ffffff !important;
}

:global(.dark-theme) .arrow {
  filter: brightness(0) invert(1);
  opacity: 0.94;
}

:global(.dark-theme) .payment-shell {
  background: rgba(30, 39, 59, 0.96) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.34) !important;
}

:global(.dark-theme) .loading-container {
  color: #94a3b8 !important;
}

:global(.dark-theme) .loading-spinner {
  border-color: rgba(56, 130, 250, 0.18) !important;
  border-top-color: #3882fa !important;
}
</style>
