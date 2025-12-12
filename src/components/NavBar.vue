<script setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useWalletStore } from '@/stores/walletStore.ts';

const { t } = useI18n();
const router = useRouter();
const walletStore = useWalletStore();
const activeTab = ref("main");

const navItems = [
  { id: "main", name: t("main"), icon: "main", path: "/" },
  { id: "history", name: t("history"), icon: "history", path: "/history" },
  { id: "scanner", name: t("scanner"), icon: "scanner", path: "/scanner" },
  { id: "transfer", name: t("transfer"), icon: "send", path: "/transfer", isPng: true },
  { id: "profile", name: t("profile"), icon: "profile", path: "/profile" },
];

const setActiveTab = (tabId) => {
  activeTab.value = tabId;
};

const handleScannerClick = (navigate) => {
  // Проверяем, включен ли PIN-код
  if (walletStore.hasPinCode()) {
    const pinVerified = localStorage.getItem('pinVerified');
    
    // Если PIN не верифицирован, перенаправляем на ввод PIN
    if (!pinVerified) {
      router.push({ 
        name: 'enterPin', 
        query: { returnTo: '/scanner' } 
      });
      return;
    }
    
    // Проверяем, не истекло ли время сессии (5 минут)
    if (pinVerified) {
      const verificationTime = parseInt(pinVerified);
      const currentTime = Date.now();
      const sessionTimeout = 5 * 60 * 1000; // 5 минут
      
      if (currentTime - verificationTime > sessionTimeout) {
        localStorage.removeItem('pinVerified');
        router.push({ 
          name: 'enterPin', 
          query: { returnTo: '/scanner' } 
        });
        return;
      }
    }
  }
  
  // Если PIN верифицирован или не установлен, переходим на сканер
  navigate();
};
</script>
<template>
  <nav class="navbar">
    <router-link
      v-for="item in navItems"
      :key="item.id"
      :to="item.path"
      custom
      v-slot="{ navigate, isActive }"
    >
      <button 
        @click="handleScannerClick(navigate)" 
        :class="{ active: isActive }"
        class="scanner"
        v-if="item.id == 'scanner'"
      >
        <img :src="`/assets/${item.icon}.svg`" />
      </button>
      <button 
        @click="navigate" 
        :class="{ active: isActive }"
        @click.prevent="navigate"
        v-else
      >
        <img :src="`/assets/${item.icon}${item.isPng ? '.png' : '.svg'}`" class="icon" />
        <span>{{ item.name }}</span>
      </button>
    </router-link>
  </nav>
</template>

<style scoped>
.navbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: white;
  z-index: 100;
  border-radius: 8px 8px 0 0;
}

button {
  display: flex;
  flex-direction: column;
  align-items: center;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 600;
  color: #888;
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: 0.6;
}

.scanner {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #DEEC51;
  padding: 8px;
  border-radius: 8px;
  opacity: 1;
}

.scanner img {
  height: 36px;
  width: 36px;
}

button span {
  padding: 0;
  font-size: 10px;
  font-weight: 300;
}

button.active {
  color: var(--tg-theme-button-color, #0373ff);
}

button.active img {
  filter: brightness(0) saturate(100%) invert(84%) sepia(71%) saturate(401%) hue-rotate(359deg) brightness(103%) contrast(93%);
}

button .icon {
  width: 24px;
  height: 24px;
}

/* PNG иконки делаем чуть меньше */
button img[src$=".png"] {
  width: 20px;
  height: 20px;
}

/* Анимация при нажатии */
button:active {
  transform: scale(0.95);
}

.active {
  opacity: 1;
}
</style>
