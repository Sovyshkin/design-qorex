<template>
  <div class="overlay" @click="closeModal">
    <div class="modal" @click.stop>
      <div class="icon">✓</div>
      <h2>{{ t('withdraw_request_sent') }}</h2>
      <p>{{ t('withdraw_processing_message') }}</p>
      <div class="info">
        <div><span>{{ t('withdraw_amount') }}</span><strong>{{ amount }} USDT</strong></div>
        <div><span>{{ t('select_network') }}</span><strong>{{ network }}</strong></div>
        <div><span>{{ t('wallet_address') }}</span><strong>{{ truncateAddress(walletAddress) }}</strong></div>
      </div>
      <div class="actions">
        <button class="btn-secondary" @click="goToHistory">{{ t('view_history') }}</button>
        <button class="btn-primary" @click="closeModal">{{ t('continue') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { onMounted, onUnmounted } from 'vue';
const { t } = useI18n();
const router = useRouter();
defineProps({ amount: { type: String, required: true }, network: { type: String, required: true }, walletAddress: { type: String, required: true } });
const emit = defineEmits(['close']);
const closeModal = () => emit('close');
const goToHistory = () => { router.push({ name: 'history' }); closeModal(); };
const truncateAddress = (a) => (!a ? '' : a.length <= 12 ? a : `${a.slice(0, 6)}...${a.slice(-6)}`);
const handleKeyDown = (e) => { if (e.key === 'Escape') closeModal(); };
onMounted(() => document.addEventListener('keydown', handleKeyDown));
onUnmounted(() => document.removeEventListener('keydown', handleKeyDown));
</script>

<style scoped>
.overlay { position: fixed; inset: 0; background: rgba(15,23,42,.45); display: grid; place-items: center; padding: 16px; z-index: 1000; }
.modal { width: 100%; max-width: 420px; background: #fff; border: 1px solid #e2e8f0; border-radius: 24px; box-shadow: 0 20px 40px rgba(15,23,42,.2); padding: 20px; text-align: center; }
.icon { width: 72px; height: 72px; border-radius: 50%; margin: 0 auto 10px; background: linear-gradient(135deg, #3b82f6, #1e40af); color: #fff; display: grid; place-items: center; font-size: 30px; }
h2 { margin: 0; color: #0f172a; font-size: 22px; }
p { color: #64748b; margin: 8px 0 14px; }
.info { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 10px; display: grid; gap: 8px; text-align: left; }
.info div { display: flex; justify-content: space-between; gap: 8px; }
.info span { color: #64748b; font-size: 12px; }
.info strong { color: #0f172a; font-size: 13px; }
.actions { margin-top: 12px; display: grid; gap: 8px; }
.btn-primary, .btn-secondary { min-height: 48px; border-radius: 14px; font-weight: 600; }
.btn-primary { background: linear-gradient(135deg, #2563eb, #1e40af); color: #fff; }
.btn-secondary { background: #fff; border: 1px solid #e2e8f0; color: #1e40af; }
</style>
