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
      v-if="walletStore.message_status"
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
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.12);
  font-size: 14px;
  font-weight: 600;
  background: #ffffff;
}

.alert p {
  margin: 0;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  flex: 0 0 auto;
}

.success {
  color: #065f46;
}

.success .dot {
  background: #10b981;
}

.info {
  color: #1e40af;
}

.info .dot {
  background: #3b82f6;
}

.warning {
  color: #92400e;
}

.warning .dot {
  background: #f59e0b;
}

.error {
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
