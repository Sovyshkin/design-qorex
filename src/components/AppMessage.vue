<script setup>
import { useWalletStore } from "../stores/walletStore.ts";

const walletStore = useWalletStore();

const clearMessage = () => {
  walletStore.message_status = "";
};
</script>

<template>
  <transition name="toast">
    <div
      v-if="walletStore.message_status && walletStore.errMessage"
      class="alert"
      :class="walletStore.message_status"
      role="alert"
      @click="clearMessage"
    >
      <span class="dot"></span>
      <p>{{ walletStore.errMessage }}</p>
    </div>
  </transition>
</template>

<style scoped>
.alert {
  position: fixed;
  top: 16px;
  left: 16px;
  right: 16px;
  z-index: 1200;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.14);
  font-size: 14px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  color: #0f172a;
}

.alert p {
  margin: 0;
  line-height: 1.35;
  color: inherit;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  flex: 0 0 auto;
}

.success {
  border-color: #bbf7d0;
  background: linear-gradient(135deg, rgba(240,253,244,.98), rgba(220,252,231,.98));
  color: #14532d;
}

.success .dot {
  background: #10b981;
}

.info {
  border-color: #bfdbfe;
  background: linear-gradient(135deg, rgba(239,246,255,.98), rgba(219,234,254,.98));
  color: #1e3a8a;
}

.info .dot {
  background: #3b82f6;
}

.warning {
  border-color: #fde68a;
  background: linear-gradient(135deg, rgba(255,251,235,.98), rgba(254,243,199,.98));
  color: #92400e;
}

.warning .dot {
  background: #f59e0b;
}

.error {
  border-color: #fecaca;
  background: linear-gradient(135deg, rgba(254,242,242,.98), rgba(254,226,226,.98));
  color: #991b1b;
}

.error .dot {
  background: #ef4444;
}

.toast-enter-active,
.toast-leave-active {
  transition: 0.22s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
