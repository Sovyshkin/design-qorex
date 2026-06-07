<script setup>
import { useWalletStore } from "@/stores/walletStore.ts";
import { ref } from "vue";

const walletStore = useWalletStore();
const selectedNetwork = ref("");
const copyStatus = ref("");

const networks = [
  { id: "TON", name: "TON", icon: "ton", address: "UQBbFoIeK2qVV_Q-jyioie9kAE-9eAUyDjSrfgr6IDjD66gL" },
  { id: "TRON", name: "TRC20 (Tron)", icon: "usdt", address: "TKfQkvhiGKGpTqt1urPc6aEPUv19tc5fs8" },
  { id: "ERC20", name: "ERC20 (Ethereum)", icon: "ethereum", address: "0x52E52CF48605f8c42c8008c3d0be0Ad3aD14b81c" },
  { id: "BEP20", name: "BEP20 (BSC)", icon: "bsc", address: "0xf786b08Bc6809D2B188f215A5b1B0B5b118985Cc" },
];

const currentAddress = ref("");
const handleNetworkSelect = (network) => { selectedNetwork.value = network.id; currentAddress.value = network.address; };

const copyAddress = async () => {
  if (!currentAddress.value) return walletStore.showMessage("Сначала выберите сеть", "warning");
  copyStatus.value = "copying";
  try {
    await navigator.clipboard.writeText(currentAddress.value);
    copyStatus.value = "copied";
    walletStore.showMessage("Адрес скопирован в буфер обмена", "success");
    setTimeout(() => (copyStatus.value = ""), 2000);
  } catch (_e) {
    copyStatus.value = "error";
    walletStore.showMessage("Не удалось скопировать адрес", "error");
    setTimeout(() => (copyStatus.value = ""), 2000);
  }
};
</script>

<template>
  <div class="donate-page">
    <header class="header">
      <img class="arrow" src="../assets/arrow-left.svg" alt="back" @click="walletStore.goBack()" />
      <h1>Поддержать проект</h1>
      <div class="emp"></div>
    </header>

    <main class="content">
      <section class="card">
        <h3>Спасибо за поддержку</h3>
        <p>Выберите сеть и скопируйте адрес.</p>

        <div class="networks">
          <button v-for="network in networks" :key="network.id" class="network" :class="{ active: selectedNetwork === network.id }" @click="handleNetworkSelect(network)">
            <div class="left"><img :src="`/assets/${network.icon}.png`" alt="icon" /><span>{{ network.name }}</span></div>
            <b v-if="selectedNetwork === network.id">✓</b>
          </button>
        </div>

        <div v-if="selectedNetwork && currentAddress" class="address">
          <p>{{ currentAddress }}</p>
          <button class="cta" @click="copyAddress">
            <span v-if="copyStatus === 'copying'">Копирование...</span>
            <span v-else-if="copyStatus === 'copied'">Скопировано</span>
            <span v-else>Скопировать адрес</span>
          </button>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.donate-page { min-height: 100vh; background: #f1f5f9; }
.header { padding: 16px; display: flex; align-items: center; justify-content: space-between; }
.arrow, .emp { width: 24px; height: 24px; }
h1 { margin: 0; font-size: 20px; color: #0f172a; font-weight: 600; }
.content { padding: 8px 16px 124px; }
.card { background: #fff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 16px; box-shadow: 0 10px 24px rgba(15,23,42,.08); }
h3 { margin: 0; color: #0f172a; }
.card > p { margin: 6px 0 12px; color: #64748b; }
.networks { display: grid; gap: 8px; }
.network { min-height: 54px; border-radius: 14px; border: 1px solid #e2e8f0; background: #fff; display: flex; align-items: center; justify-content: space-between; padding: 0 12px; }
.network.active { background: #eff6ff; border-color: #3b82f6; }
.left { display: flex; align-items: center; gap: 10px; }
.left img { width: 24px; height: 24px; }
.left span { color: #0f172a; font-weight: 500; }
b { color: #2563eb; }
.address { margin-top: 12px; border: 1px solid #e2e8f0; border-radius: 14px; background: #f8fafc; padding: 12px; }
.address p { margin: 0 0 10px; color: #0f172a; word-break: break-all; }
.cta { min-height: 50px; width: 100%; border-radius: 14px; background: linear-gradient(135deg, #2563eb, #1e40af); color: #fff; font-weight: 600; }
</style>
