<script setup>
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useWalletStore } from "@/stores/walletStore.ts";
import { ref, onMounted } from "vue";

const router = useRouter();
const walletStore = useWalletStore();
const errorMessage = ref("");

onMounted(() => {
  errorMessage.value = walletStore.transactionErrorMessage || walletStore.errMessage || "";
});

const goBack = () => router.push({ name: "main" });
const { t } = useI18n();
</script>

<template>
  <div class="failed-page">
    <header class="failed-header">
      <img class="arrow" src="@/assets/arrow-left.svg" alt="back" @click="goBack" />
      <h1>{{ t("failed_payment") }}</h1>
      <div class="emp"></div>
    </header>

    <main class="failed-content">
      <section class="failed-card">
        <div class="failed-icon">✕</div>
        <h2>{{ t("failed_payment") }}</h2>
        <p>{{ errorMessage }}</p>
        <button class="cta" @click="goBack">{{ t('go_back') }}</button>
      </section>
    </main>
  </div>
</template>

<style scoped>
.failed-page { min-height: 100vh; background: #f1f5f9; }
.failed-header { padding: 16px; display: flex; align-items: center; justify-content: space-between; }
.arrow, .emp { width: 24px; height: 24px; }
h1 { margin: 0; color: #0f172a; font-size: 20px; font-weight: 600; }
.failed-content { padding: 8px 16px 124px; }
.failed-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 24px; box-shadow: 0 10px 24px rgba(15,23,42,.08); padding: 22px; display: grid; gap: 10px; text-align: center; }
.failed-icon { width: 68px; height: 68px; border-radius: 50%; margin: 0 auto; background: #fef2f2; color: #ef4444; display: grid; place-items: center; font-size: 30px; font-weight: 700; }
h2 { margin: 2px 0 0; color: #0f172a; font-size: 22px; font-weight: 600; }
p { margin: 0; color: #64748b; font-size: 14px; }
.cta { margin-top: 6px; min-height: 50px; border-radius: 14px; background: linear-gradient(135deg, #2563eb, #1e40af); color: #fff; font-weight: 600; }
</style>
