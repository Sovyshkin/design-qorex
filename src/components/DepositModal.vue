<template>
  <div class="overlay" @click="closeModal">
    <div class="modal" @click.stop>
      <div class="head">
        <h3>{{ t('deposit_payment') }}</h3>
        <button class="close" @click="closeModal">✕</button>
      </div>
      <div class="content">
        <div v-if="loading" class="loading"><div class="spinner"></div><p>{{ t('loading_payment_page') }}</p></div>
        <iframe v-if="paymentUrl && !loading" ref="paymentFrame" :src="paymentUrl" class="frame" @load="onIframeLoad" title="Payment Page"></iframe>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const props = defineProps({ paymentUrl: { type: String, required: true }, show: { type: Boolean, default: false } });
const emit = defineEmits(['close', 'payment-success']);
const loading = ref(true);
const paymentFrame = ref(null);
const closeModal = () => emit('close');
const onIframeLoad = () => { loading.value = false; if (paymentFrame.value?.contentWindow) emit('payment-success'); };
const handleKeyDown = (event) => { if (event.key === 'Escape') closeModal(); };
onMounted(() => { document.addEventListener('keydown', handleKeyDown); if (props.show) document.body.style.overflow = 'hidden'; });
watch(() => props.show, (v) => { document.body.style.overflow = v ? 'hidden' : ''; });
onUnmounted(() => { document.removeEventListener('keydown', handleKeyDown); document.body.style.overflow = ''; });
</script>

<style scoped>
.overlay { position: fixed; inset: 0; background: rgba(15,23,42,.5); display: grid; place-items: center; padding: 16px; z-index: 1000; }
.modal { width: 100%; max-width: 860px; height: min(90vh, 680px); background: #fff; border-radius: 22px; border: 1px solid #e2e8f0; box-shadow: 0 24px 50px rgba(15,23,42,.25); overflow: hidden; display: flex; flex-direction: column; }
.head { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid #e2e8f0; }
.head h3 { margin: 0; color: #0f172a; font-size: 18px; }
.close { width: 34px; height: 34px; border-radius: 10px; background: #f8fafc; }
.content { flex: 1; }
.loading { height: 100%; display: grid; place-items: center; color: #64748b; }
.spinner { width: 36px; height: 36px; border-radius: 50%; border: 3px solid #bfdbfe; border-top-color: #2563eb; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.frame { width: 100%; height: 100%; border: 0; }
</style>
