<script setup>
import { onMounted, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { useWalletStore } from '../../stores/walletStore.ts'
import BackButton from "@/components/ui/BackButton.vue";
import { getElementSnapshot, logThemeSnapshot } from "@/utils/pageDebug";

const { t } = useI18n();
const walletStore = useWalletStore()

onMounted(async () => {
  await nextTick();
  logThemeSnapshot("SelectLang mounted", {
    page: getElementSnapshot(".lang-page"),
    header: getElementSnapshot(".lang-header"),
    list: getElementSnapshot(".lang-list"),
    firstItem: getElementSnapshot(".lang-item"),
  });
});

</script>
<template>
  <div class="lang-page">
    <header class="lang-header">
      <BackButton @click="walletStore.goBack()" />
      <h1 class="lang-title">{{ t("select_lang") }}</h1>
      <div class="lang-header-spacer"></div>
    </header>
    <main class="lang-list">
      <div class="lang-item" v-for="(lang, i) in walletStore.langs" :key="i" @click="walletStore.changeLang(lang.value)">
        <span class="lang-item__label">{{ lang.name }}</span>
        <img
          v-if="lang.active"
          class="lang-item__check"
          src="../../assets/check.svg"
          alt=""
        />
      </div>
    </main>
  </div>
</template>
<style scoped>
.lang-page {
  min-height: 100vh;
  min-height: 100dvh;
  background:
    radial-gradient(820px 360px at 50% -18%, #dbeafe 0%, transparent 62%),
    #f1f5f9;
}

.lang-header {
  padding: 16px;
  width: 100%;
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) 52px;
  align-items: center;
  gap: 12px;
}

.lang-title {
  margin: 0;
  color: #0F172A;
  font-size: 24px;
  line-height: 28px;
  font-weight: 750;
  text-align: center;
  letter-spacing: -0.03em;
}

.lang-header-spacer {
  width: 52px;
  height: 52px;
}

.lang-list {
  padding: 0 16px calc(176px + env(safe-area-inset-bottom));
  width: 100%;
  display: grid;
  gap: 15px;
  margin: 0 auto;
  overflow-y: auto;
}

.lang-item {
  width: 100%;
  min-height: 72px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  border: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.96);
  transition: all 0.3s ease;
  padding: 16px;
  border-radius: 20px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.lang-item__label {
  color: #0f172a;
  font-size: 18px;
  line-height: 22px;
  font-weight: 700;
}

.lang-item__check {
  height: 24px;
  width: 24px;
}

:global(.dark-theme) .lang-page {
  background:
    radial-gradient(720px 320px at 50% -18%, rgba(37, 98, 235, 0.18), transparent 62%),
    linear-gradient(180deg, #07111f 0%, #0d1b2a 100%) !important;
}

:global(.dark-theme) .lang-header,
:global(.dark-theme) .lang-list {
  background: transparent !important;
}

:global(.dark-theme) .lang-title,
:global(.dark-theme) .lang-item__label {
  color: #ffffff !important;
}

:global(.dark-theme) .lang-item {
  background: rgba(30, 39, 59, 0.96) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.34) !important;
}

:global(.dark-theme) .lang-item__check {
  filter: brightness(0) invert(1) !important;
}
</style>
