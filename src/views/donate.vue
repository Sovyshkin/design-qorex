<script setup>
import { useI18n } from "vue-i18n";
import { useWalletStore } from '@/stores/walletStore.ts'
import { ref, nextTick } from "vue";

const { t } = useI18n();
const walletStore = useWalletStore();
const selectedNetwork = ref("");
const copyStatus = ref(''); // '' | 'copying' | 'copied' | 'error'
const addressSectionRef = ref(null);

const networks = [
  { id: "TON", name: "TON", icon: "ton", address: "UQBbFoIeK2qVV_Q-jyioie9kAE-9eAUyDjSrfgr6IDjD66gL" },
  { id: "TRON", name: "TRC20 (Tron)", icon: "usdt", address: "TKfQkvhiGKGpTqt1urPc6aEPUv19tc5fs8" },
  { id: "ERC20", name: "ERC20 (Ethereum)", icon: "ethereum", address: "0x52E52CF48605f8c42c8008c3d0be0Ad3aD14b81c" },
  { id: "BEP20", name: "BEP20 (BSC)", icon: "bsc", address: "0xf786b08Bc6809D2B188f215A5b1B0B5b118985Cc" }
];

const currentAddress = ref('');

const handleNetworkSelect = async (network) => {
  selectedNetwork.value = network.id;
  currentAddress.value = network.address;
  
  // Скроллим к секции с адресом после её появления
  await nextTick();
  setTimeout(() => {
    addressSectionRef.value?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
  }, 100);
};

const copyAddress = async () => {
  if (!currentAddress.value) {
    walletStore.showMessage('Сначала выберите сеть', 'warning');
    return;
  }
  
  copyStatus.value = 'copying';
  
  try {
    await navigator.clipboard.writeText(currentAddress.value);
    copyStatus.value = 'copied';
    walletStore.showMessage('Адрес скопирован в буфер обмена', 'success');
    
    setTimeout(() => {
      copyStatus.value = '';
    }, 2000);
  } catch (error) {
    copyStatus.value = 'error';
    console.error('❌ Failed to copy address:', error);
    walletStore.showMessage('Не удалось скопировать адрес', 'error');
    
    setTimeout(() => {
      copyStatus.value = '';
    }, 2000);
  }
};
</script>

<template>
  <transition name="fade-down" appear>
    <header class="header">
      <img
        class="arrow"
        src="../assets/arrow-left.svg"
        alt=""
        @click="walletStore.goBack()"
      />
      <h1>Поддержать проект</h1>
      <div class="emp"></div>
    </header>
  </transition>
  <transition name="fade-scale" appear>
    <main class="container donate-page">
    <div class="form-container">
      <div class="donate-info">
        <div class="info-icon">❤️</div>
        <h3>Спасибо за вашу поддержку!</h3>
        <p>Ваш вклад помогает нам развивать проект и делать его лучше</p>
      </div>
      
      <div class="network-selector">
        <h3>Выберите сеть для поддержки</h3>
        <div class="networks-list">
          <div 
            v-for="network in networks" 
            :key="network.id" 
            class="network-item" 
            :class="{ active: selectedNetwork === network.id }"
            @click="handleNetworkSelect(network)"
          >
            <div class="network-icon">
              <img :src="`/assets/${network.icon}.png`" alt="">
            </div>
            <div class="network-info">
              <span class="network-name">{{ network.name }}</span>
            </div>
            <div class="network-check" v-if="selectedNetwork === network.id">
              <div class="check-icon"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Адрес показывается только когда выбрана сеть -->
      <transition name="address-appear">
        <div v-if="selectedNetwork && currentAddress" class="address-section" ref="addressSectionRef">
          <h4>Адрес для поддержки</h4>
          <div class="address-container">
            <div class="address-value">{{ currentAddress }}</div>
            <button 
              class="copy-btn" 
              :class="{ 
                'copying': copyStatus === 'copying', 
                'copied': copyStatus === 'copied',
                'error': copyStatus === 'error'
              }"
              @click="copyAddress"
              :disabled="copyStatus === 'copying'"
            >
              <span v-if="copyStatus === 'copying'">⏳</span>
              <span v-else-if="copyStatus === 'copied'">✅</span>
              <span v-else-if="copyStatus === 'error'">❌</span>
              <img v-else src="@/assets/copy.svg" alt="copy" />
            </button>
          </div>
          <p class="address-hint">Нажмите на иконку для копирования адреса</p>
        </div>
      </transition>
    </div>
    </main>
  </transition>
</template>

<style scoped>
.header {
  padding: 20px 15px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.emp {
  width: 32px;
}

h1 {
  color: var(--text-primary);
}

.container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0 0 150px 0;
  overflow-y: auto;
  background: var(--bg-primary);
  min-height: calc(100vh - 80px);
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px 20px;
  background: var(--bg-secondary);
  border: 2px solid var(--border-primary);
  background-clip: padding-box;
  border-radius: 0;
  box-shadow: var(--shadow-lg);
  position: relative;
  overflow: hidden;
  width: 100%;
  margin: 0;
}

.form-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #deec51, #d6e34a, #c9d93d);
}

.donate-info {
  text-align: center;
  padding: 24px 20px;
  background: linear-gradient(135deg, rgba(222, 236, 81, 0.1) 0%, rgba(249, 248, 113, 0.1) 100%);
  border: 2px solid var(--border-primary);
  border-radius: 20px;
  box-shadow: var(--shadow-sm);
}

.info-icon {
  font-size: 48px;
  margin-bottom: 12px;
  animation: heartbeat 1.5s ease-in-out infinite;
}

@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  10%, 30% { transform: scale(1.1); }
  20%, 40% { transform: scale(1); }
}

.donate-info h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.donate-info p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

.network-selector {
  margin-top: 8px;
}

.network-selector h3 {
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
}

.networks-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.network-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: var(--bg-secondary);
  border: 2px solid var(--border-primary);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.network-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(222, 236, 81, 0.1), transparent);
  transition: left 0.6s ease;
}

.network-item:hover::before {
  left: 100%;
}

.network-item:hover {
  border-color: #deec51;
  transform: translateY(-2px);
  box-shadow: 
    0 12px 32px rgba(0, 0, 0, 0.1),
    0 6px 16px rgba(222, 236, 81, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.network-item.active {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 2px solid #deec51;
  box-shadow: 
    0 8px 24px rgba(222, 236, 81, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.network-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

.network-info {
  flex: 1;
  margin-left: 10px;
}

.network-name {
  font-size: 14px;
  font-weight: 400;
  color: var(--text-primary);
}

.network-check {
  width: 24px;
  height: 24px;
}

.check-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #deec51;
  position: relative;
}

.check-icon:after {
  content: "";
  position: absolute;
  width: 12px;
  height: 6px;
  border-left: 2px solid #141414;
  border-bottom: 2px solid #141414;
  transform: rotate(-45deg);
  top: 8px;
  left: 6px;
}

.address-section {
  margin-top: 16px;
  padding: 24px;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%);
  border: 2px solid var(--border-primary);
  border-radius: 20px;
  box-shadow: var(--shadow-sm);
}

.address-section h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  text-align: center;
}

.address-container {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--bg-secondary);
  border: 2px solid var(--border-primary);
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
}

.address-value {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  word-break: break-all;
  line-height: 1.5;
  font-family: 'Courier New', monospace;
}

.copy-btn {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border: 2px solid var(--border-primary);
  border-radius: 12px;
  background: linear-gradient(135deg, #deec51 0%, #d6e34a 100%);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
  box-shadow: 
    0 4px 12px rgba(222, 236, 81, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.copy-btn:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 
    0 8px 20px rgba(222, 236, 81, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.copy-btn:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
}

.copy-btn.copying {
  background: linear-gradient(135deg, #e0e0e0 0%, #d0d0d0 100%);
  cursor: not-allowed;
}

.copy-btn.copied {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  animation: pulse-success 0.5s ease-out;
}

.copy-btn.error {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  animation: shake 0.5s ease-out;
}

@keyframes pulse-success {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@keyframes shake {
  0%, 20%, 40%, 60%, 80%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
}

.address-hint {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 12px 0 0 0;
  text-align: center;
  font-style: italic;
}

/* Анимация появления адреса */
.address-appear-enter-active,
.address-appear-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.address-appear-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.address-appear-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

/* Адаптивность */
@media (max-width: 480px) {
  .address-value {
    font-size: 11px;
  }
  
  .copy-btn {
    width: 44px;
    height: 44px;
    font-size: 18px;
  }
}

/* Исправление для маленьких экранов iPhone 5/SE */
@media (max-height: 600px) and (max-width: 400px) {
  .container {
    padding: 0 20px 80px 20px;
    min-height: calc(100vh - 60px);
  }
  
  .form-container {
    gap: 15px;
    margin-bottom: 15px;
  }
}
</style>
