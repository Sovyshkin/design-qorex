<script setup>
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useWalletStore } from "@/stores/walletStore.ts";

const { t } = useI18n();
const router = useRouter();
const walletStore = useWalletStore();

const navItems = [
  { id: "main", name: t("main"), icon: "main", path: "/" },
  { id: "history", name: t("history"), icon: "history", path: "/history" },
  { id: "scanner", name: t("scanner"), icon: "scanner", path: "/scanner" },
  { id: "transfer", name: t("transfer"), icon: "send", path: "/transfer", isPng: true },
  { id: "profile", name: t("profile"), icon: "profile", path: "/profile" },
];

const handleScannerClick = (navigate) => {
  if (walletStore.hasPinCode()) {
    const pinVerified = localStorage.getItem("pinVerified");
    if (!pinVerified) return router.push({ name: "enterPin", query: { returnTo: "/scanner" } });
    const verificationTime = parseInt(pinVerified);
    if (Date.now() - verificationTime > 5 * 60 * 1000) {
      localStorage.removeItem("pinVerified");
      return router.push({ name: "enterPin", query: { returnTo: "/scanner" } });
    }
  }
  navigate();
};
</script>

<template>
  <nav class="wallet-nav-wrap">
    <div class="wallet-nav">
      <router-link v-for="item in navItems" :key="item.id" :to="item.path" custom v-slot="{ navigate, isActive }">
        <button v-if="item.id === 'scanner'" class="wallet-tab center-scan" :class="{ active: isActive }" @click="handleScannerClick(navigate)">
          <img :src="`/assets/${item.icon}.svg`" alt="scan" />
        </button>
        <button v-else class="wallet-tab" :class="{ active: isActive }" @click="navigate">
          <img :src="`/assets/${item.icon}${item.isPng ? '.png' : '.svg'}`" class="wallet-icon" alt="icon" />
          <span>{{ item.name }}</span>
        </button>
      </router-link>
    </div>
  </nav>
</template>

<style scoped>
.wallet-nav-wrap { position: fixed; left: 0; right: 0; bottom: 8px; z-index: 100; padding: 0 14px max(8px, env(safe-area-inset-bottom)); }
.wallet-nav { height: 76px; border-radius: 26px; border: 1px solid #e2e8f0; background: rgba(255,255,255,.95); backdrop-filter: blur(12px); box-shadow: 0 14px 30px rgba(15,23,42,.14); display: flex; justify-content: space-between; align-items: center; padding: 0 10px; }
.wallet-tab { width: 58px; min-height: 56px; border-radius: 16px; display: grid; place-items: center; gap: 2px; color: #64748b; }
.wallet-tab span { font-size: 10px; font-weight: 500; }
.wallet-icon { width: 20px; height: 20px; }
.wallet-tab.active { color: #2563eb; }
.center-scan { width: 60px; height: 60px; border-radius: 999px; transform: translateY(-12px); background: linear-gradient(135deg, #3b82f6, #1e40af); box-shadow: 0 12px 24px rgba(37,99,235,.36); }
.center-scan img { width: 26px; height: 26px; filter: brightness(0) invert(1); }
</style>
