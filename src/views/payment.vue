<template>
  <div class="payment-page">
    <header class="payment-header">
      <img class="arrow" src="../assets/arrow-left.svg" alt="Назад" @click="goBack" />
      <h1>{{ t('deposit_payment') }}</h1>
      <div class="emp"></div>
    </header>

    <main class="payment-shell">
      <div class="payment-icon">
        <img src="/assets/peekpay-logo-150.png" alt="PeekPay" />
      </div>
      <h2>Откройте страницу оплаты</h2>
      <p>
        Платежная страница откроется во внешнем окне Telegram. Если окно не открылось,
        используйте кнопку ниже или скопируйте ссылку.
      </p>

      <button class="cta" type="button" :disabled="!paymentUrl" @click="openPayment">
        Открыть оплату
      </button>
      <button class="secondary" type="button" :disabled="!paymentUrl || copyStatus === 'copying'" @click="copyPaymentLink">
        <span v-if="copyStatus === 'copied'">Ссылка скопирована</span>
        <span v-else-if="copyStatus === 'copying'">Копирование...</span>
        <span v-else>Скопировать ссылку</span>
      </button>
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

const paymentUrl = ref(route.query.url || '');
const copyStatus = ref('');

const goBack = () => router.back();

const openPayment = () => {
  if (!paymentUrl.value) return;
  try {
    if (window.Telegram?.WebApp?.openLink) {
      window.Telegram.WebApp.openLink(paymentUrl.value, { try_instant_view: false });
      return;
    }
    window.open(paymentUrl.value, '_blank', 'noopener,noreferrer');
  } catch (_error) {
    window.location.href = paymentUrl.value;
  }
};

const copyPaymentLink = async () => {
  if (!paymentUrl.value) return;
  copyStatus.value = 'copying';
  try {
    await navigator.clipboard.writeText(paymentUrl.value);
    copyStatus.value = 'copied';
    walletStore.showMessage('Ссылка скопирована в буфер обмена', 'success');
  } catch (_error) {
    copyStatus.value = '';
    walletStore.showMessage('Не удалось скопировать ссылку', 'error');
  } finally {
    setTimeout(() => (copyStatus.value = ''), 2000);
  }
};

onMounted(() => {
  if (!paymentUrl.value) {
    walletStore.showMessage('Ошибка: не получена ссылка для оплаты', 'error');
    setTimeout(() => router.back(), 2000);
  }
});
</script>

<style scoped>
.payment-page { min-height: 100vh; min-height: 100dvh; background: radial-gradient(820px 360px at 50% -18%, #dbeafe 0%, #f1f5f9 58%); padding-bottom: calc(124px + env(safe-area-inset-bottom)); }
.payment-header { min-height: 64px; padding: 16px; display: grid; grid-template-columns: 44px minmax(0, 1fr) 44px; align-items: center; gap: 8px; }
.arrow { width: 44px; height: 44px; padding: 13px; border-radius: 16px; background: rgba(255,255,255,.94); border: 1px solid #e2e8f0; box-shadow: 0 10px 24px rgba(15,23,42,.08); object-fit: contain; }
.emp { width: 44px; height: 44px; }
h1 { margin: 0; color: #0f172a; font-size: 22px; line-height: 26px; font-weight: 750; text-align: center; letter-spacing: -0.03em; }
.payment-shell { margin: 0 16px; border-radius: 24px; border: 1px solid #e2e8f0; background: rgba(255,255,255,.96); box-shadow: 0 12px 28px rgba(15,23,42,.08); padding: 24px 18px; display: grid; justify-items: center; gap: 14px; text-align: center; }
.payment-icon { width: 64px; height: 64px; border-radius: 22px; display: grid; place-items: center; background: linear-gradient(135deg, #2563eb, #3b82f6); color: #fff; font-size: 30px; font-weight: 800; box-shadow: 0 14px 28px rgba(37,99,235,.28); }
.payment-icon img { width: 42px; height: 42px; object-fit: contain; }
h2 { margin: 2px 0 0; color: #0f172a; font-size: 22px; line-height: 27px; font-weight: 800; letter-spacing: -0.03em; }
p { max-width: 320px; margin: 0; color: #64748b; font-size: 14px; line-height: 21px; font-weight: 500; }
.cta, .secondary { width: 100%; min-height: 52px; border-radius: 16px; font-size: 15px; font-weight: 750; }
.cta { margin-top: 6px; color: #fff; background: linear-gradient(135deg, #2563eb, #1e40af); box-shadow: 0 14px 28px rgba(37,99,235,.24); }
.secondary { color: #1e40af; background: #eff6ff; border: 1px solid #dbeafe; }
.cta:disabled, .secondary:disabled { opacity: .55; }

:global(.dark-theme) .payment-page { background: #0d1b2a !important; }
:global(.dark-theme) .payment-header h1,
:global(.dark-theme) .payment-shell h2 { color: #ffffff !important; }
:global(.dark-theme) .payment-header .arrow { filter: brightness(0) invert(1); background: rgba(30,39,59,.96) !important; border-color: rgba(255,255,255,.08) !important; box-shadow: 0 16px 30px rgba(0,0,0,.28) !important; }
:global(.dark-theme) .payment-shell { background: rgba(30,39,59,.96) !important; border-color: rgba(255,255,255,.08) !important; box-shadow: 0 18px 34px rgba(0,0,0,.34) !important; }
:global(.dark-theme) .payment-shell p { color: #94a3b8 !important; }
:global(.dark-theme) .payment-shell .secondary { background: rgba(13,27,42,.58) !important; border-color: rgba(255,255,255,.08) !important; color: #ffffff !important; }
</style>
