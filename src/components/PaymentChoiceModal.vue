<template>
  <div class="overlay" @click="closeModal">
    <div class="modal" @click.stop>
      <div class="head"><h3>Способ оплаты</h3><button class="close" @click="closeModal">✕</button></div>
      <p class="desc">Выберите удобный способ оплаты:</p>
      <button class="option" @click="copyLink"><strong>Скопировать ссылку</strong><span>Открыть в браузере</span></button>
      <button class="option" @click="openInApp"><strong>Открыть в приложении</strong><span>Встроенный браузер</span></button>
      <div class="info"><span>{{ amount }} USDT</span><span>{{ networkName }}</span></div>
    </div>
  </div>
</template>

<script setup>
defineProps({ paymentUrl: { type: String, required: true }, amount: { type: String, required: true }, networkName: { type: String, required: true } });
const emit = defineEmits(['close', 'copy-link', 'open-in-app']);
const closeModal = () => emit('close');
const copyLink = () => emit('copy-link');
const openInApp = () => emit('open-in-app');
</script>

<style scoped>
.overlay { position: fixed; inset: 0; background: rgba(15,23,42,.45); display: grid; place-items: center; padding: 16px; z-index: 1000; }
.modal { width: 100%; max-width: 390px; background: #fff; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 20px 40px rgba(15,23,42,.2); padding: 16px; display: grid; gap: 10px; }
.head { display: flex; justify-content: space-between; align-items: center; }
.head h3 { margin: 0; color: #0f172a; }
.close { width: 32px; height: 32px; border-radius: 10px; background: #f8fafc; }
.desc { margin: 0; color: #64748b; font-size: 13px; }
.option { min-height: 56px; border-radius: 14px; background: #f8fafc; border: 1px solid #e2e8f0; display: grid; text-align: left; padding: 8px 12px; }
.option strong { color: #0f172a; font-weight: 600; }
.option span { color: #64748b; font-size: 12px; }
.info { margin-top: 2px; border-top: 1px solid #e2e8f0; padding-top: 10px; display: flex; justify-content: space-between; color: #1e40af; font-weight: 600; font-size: 13px; }
</style>
