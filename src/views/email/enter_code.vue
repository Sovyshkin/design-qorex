<script setup>
import { useI18n } from "vue-i18n";
import { useWalletStore } from "@/stores/walletStore.ts";
import { ref } from 'vue';

const { t } = useI18n();
const walletStore = useWalletStore();
const isChecking = ref(false);

const checkCode = async () => {
  if (isChecking.value || !walletStore.code?.trim()) return;
  
  isChecking.value = true;
  try {
    await walletStore.checkCode();
  } finally {
    setTimeout(() => {
      isChecking.value = false;
    }, 2000); // 2 секунды защиты
  }
};
</script>
<template>
  <header class="header">
    <img
      class="arrow"
      src="../../assets/arrow-left.svg"
      alt=""
      @click="walletStore.goBack()"
    />
    <h1>{{ t("enter_code") }}</h1>
    <div class="emp"></div>
  </header>
  <main class="container">
    <input
      type="number"
      :placeholder="t('your_code')"
      id="code"
      v-model="walletStore.code"
    />
    <button class="btn" @click="checkCode()" :disabled="isChecking || walletStore.isLoading">
      <span v-if="isChecking">Проверяем...</span>
      <span v-else>{{ t("confirm") }}</span>
    </button>
  </main>
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
  text-align: center;
}

.container {
  display: flex;
  flex-direction: column;
  padding: 0 20px 120px 20px;
  overflow-y: auto;
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
  caret-color: #000000;
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
  display: flex;
  flex-direction: column;
  gap: 20px;
}

p {
  text-align: center;
  font-weight: 300;
  font-size: 14px;
  color: #141414;
}
</style>
