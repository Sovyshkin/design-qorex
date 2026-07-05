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
  <Teleport to="body">
    <nav class="wallet-nav-wrap">
      <div class="wallet-nav">
        <router-link v-for="item in navItems" :key="item.id" :to="item.path" custom v-slot="{ navigate, isActive }">
          <button v-if="item.id === 'scanner'" class="wallet-tab center-scan" :class="{ active: isActive }" @click="handleScannerClick(navigate)">
            <img :src="`/assets/${item.icon}.svg`" alt="scan" />
          </button>
          <button v-else class="wallet-tab" :class="{ active: isActive }" @click="navigate">
            <img :src="`/assets/${item.icon}${item.isPng ? '.png' : '.svg'}`" class="wallet-icon" alt="icon" />
            <span>{{ item.name }}</span>
            <span class="active-dot"></span>
          </button>
        </router-link>
      </div>
    </nav>
  </Teleport>
</template>

<style scoped>
.wallet-nav-wrap { position: fixed !important; top: auto !important; left: 0 !important; right: 0 !important; bottom: max(8px, env(safe-area-inset-bottom)) !important; width: 100% !important; z-index: 5000 !important; padding: 0 14px; pointer-events: none; transform: none !important; }
.wallet-nav { height: 76px; border-radius: 26px; border: 1px solid var(--border, #e2e8f0); background: rgba(255,255,255,.95); backdrop-filter: blur(12px); box-shadow: 0 14px 30px rgba(15,23,42,.14); display: flex; justify-content: space-between; align-items: center; padding: 0 10px; pointer-events: auto; }
.wallet-tab { position: relative; width: 58px; min-height: 56px; border-radius: 18px; display: grid; place-items: center; gap: 3px; color: var(--textSecondary, #64748b); transition: transform .18s ease, color .18s ease; }
.wallet-tab span { font-size: 10px; font-weight: 500; line-height: 1; transition: font-weight .18s ease, color .18s ease; }
.wallet-icon { width: 20px; height: 20px; opacity: .72; transition: opacity .18s ease, transform .18s ease, filter .18s ease; }
.wallet-tab.active { color: var(--primary, #2563eb); transform: translateY(-2px); }
.wallet-tab.active .wallet-icon { opacity: 1; transform: translateY(-1px); filter: drop-shadow(0 5px 8px rgba(37,99,235,.22)); }
.wallet-tab.active span:not(.active-dot) { font-weight: 750; color: var(--primary, #2563eb); }
.active-dot { width: 5px; height: 5px; border-radius: 999px; background: transparent; transition: background-color .18s ease, box-shadow .18s ease, transform .18s ease; }
.wallet-tab.active .active-dot { background: var(--primary, #2563eb); box-shadow: 0 0 0 4px rgba(37,99,235,.12); transform: translateY(1px); }
.center-scan { width: 60px; height: 60px; border-radius: 999px; transform: translateY(-12px); background: linear-gradient(135deg, var(--light-blue, #3b82f6), var(--deep-blue, #1e40af)); box-shadow: 0 12px 24px rgba(37,99,235,.36); transition: transform .18s ease, box-shadow .18s ease, filter .18s ease; }
.center-scan.active { transform: translateY(-14px) scale(1.03); box-shadow: 0 16px 28px rgba(37,99,235,.44), 0 0 0 6px rgba(59,130,246,.12); }
.center-scan img { width: 26px; height: 26px; filter: brightness(0) invert(1); }

:global(.dark-theme) .wallet-nav {
  background: rgba(30, 39, 59, 0.92);
  border-color: var(--border, rgba(255, 255, 255, 0.08));
  box-shadow: 0 18px 32px rgba(0, 0, 0, 0.28);
}

:global(.dark-theme) .wallet-tab {
  color: var(--textSecondary, #94a3b8);
}

:global(.dark-theme) .wallet-tab.active span:not(.active-dot) {
  color: var(--primary-hover, #3882fa);
}

:global(.dark-theme) .wallet-tab.active .wallet-icon {
  filter: drop-shadow(0 5px 8px rgba(56, 130, 250, 0.28));
}

:global(.dark-theme) .wallet-tab.active .active-dot {
  background: var(--primary-hover, #3882fa);
  box-shadow: 0 0 0 4px rgba(56, 130, 250, 0.16);
}

:global(.dark-theme) .center-scan {
  background: linear-gradient(135deg, var(--primary, #2562eb), var(--primary-hover, #3882fa));
  box-shadow: 0 14px 28px rgba(37, 98, 235, 0.38);
}
</style>
