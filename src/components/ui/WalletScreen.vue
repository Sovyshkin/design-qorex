<script setup>
import BackButton from "@/components/ui/BackButton.vue";
import { useWalletStore } from "@/stores/walletStore.ts";

const walletStore = useWalletStore();

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },
  back: { type: Boolean, default: true },
});

defineEmits(["back"]);
</script>

<template>
  <div class="wallet-screen" :class="{ 'is-dark': walletStore.isDarkTheme }">
    <header class="wallet-screen__header">
      <BackButton v-if="back" @click="$emit('back')" />
      <span v-else class="wallet-screen__spacer" />
      <div class="wallet-screen__heading">
        <h1>{{ title }}</h1>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
      <span class="wallet-screen__spacer" />
    </header>
    <main class="wallet-screen__body">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.wallet-screen {
  --screen-bg: #f1f5f9;
  --screen-card: #fff;
  --screen-soft: #eff6ff;
  --screen-text: #0f172a;
  --screen-muted: #64748b;
  --screen-border: #e2e8f0;
  --screen-primary: #2563eb;
  --screen-primary-2: #3b82f6;
  --screen-success: #10b981;
  --screen-danger: #ef4444;
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  position: relative;
  z-index: 1;
  display: block !important;
  overflow-x: hidden;
  color: var(--screen-text);
  background: radial-gradient(640px 280px at 50% -12%, #dbeafe 0%, transparent 68%), var(--screen-bg);
}

.wallet-screen__header {
  min-height: 76px;
  padding: max(14px, env(safe-area-inset-top)) 16px 10px;
  display: grid !important;
  grid-template-columns: 48px minmax(0, 1fr) 48px;
  align-items: center;
  gap: 8px;
  background: transparent !important;
}

.wallet-screen__heading { min-width: 0; text-align: center; }
.wallet-screen__heading h1 { margin: 0; color: var(--screen-text) !important; font-size: clamp(20px, 6vw, 26px); line-height: 1.15; font-weight: 700; }
.wallet-screen__heading p { margin: 5px 0 0; color: var(--screen-muted) !important; font-size: 13px; line-height: 1.25; }
.wallet-screen__spacer { width: 48px; }
.wallet-screen__body { width: 100%; padding: 8px 16px calc(128px + env(safe-area-inset-bottom)); display: grid !important; gap: 16px; }

.wallet-screen.is-dark {
  --screen-bg: #0d1b2a;
  --screen-card: #1e273b;
  --screen-soft: #17243a;
  --screen-text: #fff;
  --screen-muted: #94a3b8;
  --screen-border: rgba(255, 255, 255, 0.08);
  background: radial-gradient(680px 300px at 50% -14%, rgba(37, 98, 235, .2), transparent 66%), linear-gradient(180deg, #07111f, #0d1b2a) !important;
}

.wallet-screen.is-dark .wallet-screen__header,
.wallet-screen.is-dark .wallet-screen__body { background: transparent !important; }

@media (max-width: 360px) {
  .wallet-screen__header { grid-template-columns: 44px minmax(0, 1fr) 44px; padding-inline: 12px; }
  .wallet-screen__body { padding-inline: 12px; }
}
</style>
