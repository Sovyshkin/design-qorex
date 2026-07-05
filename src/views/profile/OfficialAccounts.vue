<script setup>
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useWalletStore } from "../../stores/walletStore.ts";
import { useRouter } from "vue-router";
import BackButton from "@/components/ui/BackButton.vue";

const { t } = useI18n();
const walletStore = useWalletStore();
const router = useRouter();

const accounts = ref([
  {
    name: 'Telegram',
    value: '@peekpay',
    icon: 'telegram',
    href: 'https://t.me/peekpay'
  },
  {
    name: "Instagram",
    value: '@PeekPay',
    icon: 'instagram',
    route: 'terms_of_use'
  },
  {
    name: "VK",
    value: '@PeekPay',
    icon: 'vk',
    route: 'privacy_policy'
  },
]);
</script>

<template>
  <div class="official-page" :class="{'is-dark':walletStore.isDarkTheme}">
    <header class="header">
      <BackButton @click="walletStore.goBack()" />
      <h1>{{ t("official_accounts") }}</h1>
      <div class="emp"></div>
    </header>
    <main class="safety">
      <div class="docs">
        <a class="list-item" v-for="(item, i) in accounts" :key="i" :href="item.href" target="_blank">
          <div class="info">
            <div class="wrap-img">
              <img :src="`/assets/${item.icon}.svg`" :alt="item.icon" />
            </div>
            <div class="wrap-text">
              <span class="list-value">{{ item.name }}</span>
              <span class="subtitle">{{ item.value }}</span>
            </div>
          </div>
          <img class="arrow-right" src="../../assets/arrow-right.svg" alt="arrow-right" />
        </a>
      </div>
    </main>
  </div>
</template>

<style scoped>
.official-page{min-height:100vh;min-height:100dvh;background:#f1f5f9}
.header {
  padding: 20px 15px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

h2 {
  color: #0F172A;
  font-weight: 300;
}
.safety {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 15px 120px 15px;
  overflow-y: auto;
}

.docs {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.profile-item {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.profile-value {
  color: #0F172A;
  font-weight: 300;
}

.list-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  transition: all 0.3s ease;
  padding: 16px;
  border-radius: 16px;
}

.list-value {
  font-size: 14px;
}

.info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.wrap-img {
  background-color: #2563EB;
  padding: 8px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wrap-img img {
  height: 24px;
  width: 24px;
}

.arrow-right {
  width: 24px;
  height: 24px;
}

.emp {
  width: 52px;
}

.wrap-text {
    display: flex;
    flex-direction: column;
}

.subtitle {
    opacity: 0.4;
    font-weight: 300;
    font-size: 10px;
}
.official-page.is-dark{background:linear-gradient(180deg,#07111f,#0d1b2a)!important}
.official-page.is-dark .header{background:transparent!important;color:#fff!important}
.official-page.is-dark .header h1,.official-page.is-dark .list-value{color:#fff!important}
.official-page.is-dark .list-item{background:#1e273b!important;border:1px solid rgba(255,255,255,.08);box-shadow:0 14px 28px rgba(0,0,0,.22)}
.official-page.is-dark .wrap-img{background:rgba(37,98,235,.28)!important}
.official-page.is-dark .wrap-img img,.official-page.is-dark .arrow-right{filter:brightness(0) invert(1)!important;opacity:1}
.official-page.is-dark .subtitle{color:#94a3b8!important;opacity:1}
</style>
