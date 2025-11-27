<script setup>
import { useI18n } from "vue-i18n";
import { useWalletStore } from '@/stores/walletStore.ts'
import { ref, computed } from "vue";
import AppLoader from '@/components/AppLoader.vue';

const { t } = useI18n();
const walletStore = useWalletStore();
const amount = ref("");
const walletAddress = ref("");
const memo = ref("");
const selectedNetwork = ref("USDT_TRC20");
const isWithdrawing = ref(false); // Состояние загрузки для кнопки вывода

const networks = [
  { id: "USDT_TRC20", name: "TRC20 (Tron)", icon: "usdt" },
  { id: "USDT_TON", name: "TON", icon: "ton" },
  { id: "USDT_ERC20", name: "ERC20 (Ethereum)", icon: "ethereum" }
];

const isFormValid = computed(() => {
  return amount.value && walletAddress.value && selectedNetwork.value && !isWithdrawing.value;
});

const handleWithdraw = async () => {
  if (!isFormValid.value || isWithdrawing.value) return;
  
  // Конвертируем USDT_TRC20 -> TRC20 для API
  const networkId = selectedNetwork.value.replace('USDT_', '');
  
  isWithdrawing.value = true;
  try {
    await walletStore.withdrawFunds(
      amount.value,
      networkId,
      walletAddress.value,
      memo.value
    );
  } finally {
    isWithdrawing.value = false;
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
      <h1>{{ t("withdraw_page") }}</h1>
      <div class="emp"></div>
    </header>
  </transition>
  <transition name="fade-scale" appear>
    <main class="container">
    <div class="form-container">
      <div class="group">
        <input type="number" :placeholder="t('select_amount')" id="amount" v-model="amount" :disabled="isWithdrawing"/>
        <span class="group-item">USDT</span>
      </div>
      
      <div class="network-selector">
        <h3>Выберите сеть</h3>
        <div class="networks-list">
          <div 
            v-for="network in networks" 
            :key="network.id" 
            class="network-item" 
            :class="{ active: selectedNetwork === network.id, disabled: isWithdrawing }"
            :style="{ pointerEvents: isWithdrawing ? 'none' : 'auto' }"
            @click="!isWithdrawing && (selectedNetwork = network.id)"
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

      <input 
        type="text" 
        :placeholder="t('enter_wallet_address')" 
        id="wallet" 
        v-model="walletAddress"
        :disabled="isWithdrawing"
        required
      />

      <div class="memo-container">
        <input 
          type="text" 
          :placeholder="t('memo_optional')" 
          id="memo" 
          v-model="memo"
          :disabled="isWithdrawing"
        />
        <p class="memo-note">{{ t('memo_warning') }}</p>
      </div>
    </div>
    
    <button 
      class="btn" 
      :class="{ disabled: !isFormValid || isWithdrawing }"
      :disabled="!isFormValid || isWithdrawing"
      @click="handleWithdraw()"
    >
      <AppLoader v-if="isWithdrawing" class="btn-loader" />
      <span v-else>{{ t("withdraw_funds") }}</span>
    </button>
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
  color: #141414;
}

.container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0 20px 120px 20px;
  overflow-y: auto;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 8px;
  font-weight: 300;
  font-size: 14px;
  color: #141414;
  background-color: #deec51;
  transition: opacity 0.2s ease;
}

.btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-loader {
  width: 20px !important;
  height: 20px !important;
}

input,
textarea,
select {
  width: 100%;
  border: 1px solid black;
  border-radius: 10px;
  padding: 16px;
  background: none;
  outline: none;
}

input::placeholder,
textarea::placeholder,
select::placeholder {
  color: #a5a5a5;
  font-weight: 400;
  font-size: 14px;
  line-height: 19.12px;
}

.group {
  position: relative;
}

.group-item {
  position: absolute;
  right: 4%;
  top: 50%;
  transform: translateY(-50%);
}

.memo-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.memo-note {
  font-size: 12px;
  color: #ff6b6b;
  padding: 0 4px;
  margin: 0;
  line-height: 1.4;
}

.network-selector {
  margin-top: 20px;
}

.network-selector h3 {
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: 400;
  color: #141414;
}

.networks-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.network-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background-color: #fff;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.network-item.active {
  background-color: #f5f5f5;
  border: 1px solid #deec51;
}

.network-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

.icon-placeholder {
  width: 32px;
  height: 32px;
  background-color: #deec51;
  border-radius: 50%;
}

.network-info {
  flex: 1;
  margin-left: 10px;
}

.network-name {
  font-size: 14px;
  font-weight: 400;
  color: #141414;
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

/* Стили для заблокированных элементов */
input:disabled,
textarea:disabled,
select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #f8f9fa !important;
}

.network-item.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
