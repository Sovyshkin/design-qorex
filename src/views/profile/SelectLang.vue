<script setup>
import { useI18n } from "vue-i18n";
import { useWalletStore } from "@/stores/walletStore.ts";
import WalletScreen from "@/components/ui/WalletScreen.vue";

const { t } = useI18n();
const walletStore = useWalletStore();
</script>

<template>
  <WalletScreen :title="t('select_language')" @back="walletStore.goBack()">
    <section class="language-card" aria-label="Language selection">
      <button
        v-for="lang in walletStore.langs"
        :key="lang.value"
        class="language-row"
        :class="{ 'is-active': lang.active }"
        type="button"
        @click="walletStore.changeLang(lang.value)"
      >
        <span class="language-row__mark">{{ lang.value.toUpperCase() }}</span>
        <span class="language-row__name">{{ lang.name }}</span>
        <svg v-if="lang.active" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4 4 10-10" /></svg>
      </button>
    </section>
  </WalletScreen>
</template>

<style scoped>
.language-card { display: grid !important; gap: 10px; }
.language-row { width: 100%; min-height: 72px; padding: 12px 16px; display: grid !important; grid-template-columns: 44px 1fr 28px; align-items: center; gap: 12px; border: 1px solid var(--screen-border); border-radius: 20px; background: var(--screen-card) !important; box-shadow: 0 10px 28px rgba(15,23,42,.07); color: var(--screen-text) !important; text-align: left; }
.language-row__mark { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 14px; background: var(--screen-soft); color: var(--screen-primary) !important; font-size: 12px; font-weight: 800; }
.language-row__name { color: var(--screen-text) !important; font-size: 17px; font-weight: 650; }
.language-row svg { width: 24px; fill: none; stroke: currentColor; stroke-width: 2.5; color: #fff; }
.language-row.is-active { border-color: rgba(59,130,246,.55); background: linear-gradient(135deg, var(--screen-primary), var(--screen-primary-2)) !important; }
.language-row.is-active .language-row__mark { background: rgba(255,255,255,.16); color: #fff !important; }
.language-row.is-active .language-row__name { color: #fff !important; }
</style>
