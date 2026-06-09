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
  border: 1px solid var(--border, #e2e8f0);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.14);
  font-size: 14px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  color: var(--textPrimary, #0f172a);
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
  border-color: rgba(16, 185, 129, 0.22);
  background: linear-gradient(135deg, rgba(240, 253, 244, 0.98), rgba(220, 252, 231, 0.98));
  color: #14532d;
}

.success .dot {
  background: #10b981;
}

.info {
  border-color: rgba(37, 99, 235, 0.22);
  background: linear-gradient(135deg, rgba(239, 246, 255, 0.98), rgba(219, 234, 254, 0.98));
  color: #1e3a8a;
}

.info .dot {
  background: #3b82f6;
}

.warning {
  border-color: rgba(245, 158, 11, 0.2);
  background: linear-gradient(135deg, rgba(255, 251, 235, 0.98), rgba(254, 243, 199, 0.98));
  color: #92400e;
}

.warning .dot {
  background: #f59e0b;
}

.error {
  border-color: rgba(239, 68, 68, 0.22);
  background: linear-gradient(135deg, rgba(254, 242, 242, 0.98), rgba(254, 226, 226, 0.98));
  color: #991b1b;
}

:global(.dark-theme) .alert {
  background: rgba(30, 39, 59, 0.94);
  border-color: var(--border, rgba(255, 255, 255, 0.08));
  box-shadow: 0 18px 30px rgba(0, 0, 0, 0.34);
  color: var(--textPrimary, #ffffff);
}

:global(.dark-theme) .success {
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.28), rgba(16, 185, 129, 0.16));
  color: #ecfdf5;
}

:global(.dark-theme) .info {
  background: linear-gradient(135deg, rgba(30, 58, 138, 0.34), rgba(37, 99, 235, 0.18));
  color: #eff6ff;
}

:global(.dark-theme) .warning {
  background: linear-gradient(135deg, rgba(146, 64, 14, 0.28), rgba(245, 158, 11, 0.12));
  color: #fffbeb;
}

:global(.dark-theme) .error {
  background: linear-gradient(135deg, rgba(127, 29, 29, 0.28), rgba(239, 68, 68, 0.16));
  color: #fef2f2;
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
