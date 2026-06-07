<script setup>
import { useWalletStore } from "@/stores/walletStore";
import { useI18n } from "vue-i18n";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

const walletStore = useWalletStore();
const { t } = useI18n();
const router = useRouter();
const isInitialized = ref(false);

const goRoute = (name) => router.push({ name });

onMounted(async () => {
  if (isInitialized.value) return;
  try {
    const hasUserData = walletStore.user?.tg_id || walletStore.balance !== undefined;
    const hasPrice = walletStore.usdt_price > 0;
    if (!hasUserData && walletStore.userTg?.id) await walletStore.getUser();
    if (!hasPrice) await walletStore.getPrice();
    isInitialized.value = true;
  } catch (err) {
    console.error("Error in main.vue onMounted:", err);
  }
});
</script>

<template>
  <div class="home-page">
    <header class="home-header">
      <div class="home-user">
        <div class="home-avatar"><img :src="walletStore.userTg.photo_url" alt="avatar" /></div>
        <div>
          <h1>{{ walletStore.user.first_name || walletStore.userTg.first_name || "Пользователь" }}</h1>
          <p>Premium</p>
        </div>
      </div>
    </header>

    <main class="home-content">
      <section class="hero-balance" @click="walletStore.setHideBalanceActive(!walletStore.hideBalanceActive)">
        <div class="hero-title-row"><span>{{ t("total_balance") }}</span></div>
        <h2 v-if="!walletStore.hideBalanceActive">${{ walletStore.roundToHundredths(walletStore.balance) }}</h2>
        <h2 v-else>********</h2>
        <small v-if="!walletStore.hideBalanceActive">≈ {{ walletStore.roundToHundredths(walletStore.balance_rub) }} ₽</small>
        <small v-else>≈ ********</small>
      </section>

      <section class="quick-actions">
        <button class="quick-action" @click="goRoute('deposit')"><i>↓</i><span>{{ t('deposit') }}</span></button>
        <button class="quick-action" @click="goRoute('transfer')"><i>↗</i><span>{{ t('transfer') }}</span></button>
        <button class="quick-action" @click="goRoute('withdraw')"><i>↑</i><span>{{ t('pay_out') }}</span></button>
      </section>

      <section class="assets-block">
        <div class="assets-head">
          <h3>{{ t('actives') }}</h3>
        </div>
        <button class="asset-row" @click="goRoute('history')">
          <div class="asset-left">
            <div class="asset-icon">₮</div>
            <div class="asset-meta"><strong>USDT</strong><small>{{ walletStore.roundToHundredths(walletStore.usdt_price) }} ₽</small></div>
          </div>
          <div class="asset-right" v-if="!walletStore.hideBalanceActive">
            <strong>{{ walletStore.roundToHundredths(walletStore.balance) }} USDT</strong>
            <small>{{ walletStore.roundToHundredths(walletStore.balance_rub) }} ₽</small>
          </div>
          <div class="asset-right" v-else>
            <strong>********</strong>
            <small>********</small>
          </div>
        </button>
      </section>
    </main>
  </div>
</template>

<style scoped>
.home-page { min-height: 100vh; background: #f1f5f9; }
.home-header { padding: 18px 16px 8px; }
.home-user { display: flex; align-items: center; gap: 12px; }
.home-avatar { width: 44px; height: 44px; border-radius: 50%; overflow: hidden; border: 2px solid #dbeafe; background: #fff; }
.home-avatar img { width: 100%; height: 100%; object-fit: cover; }
h1 { margin: 0; color: #0f172a; font-size: 20px; line-height: 1.15; font-weight: 600; }
.home-user p { margin: 2px 0 0; color: #2563eb; font-size: 13px; font-weight: 500; }

.home-content { padding: 12px 16px 124px; display: grid; gap: 16px; }

.hero-balance {
  border-radius: 22px;
  padding: 18px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 45%, #1e40af 100%);
  box-shadow: 0 16px 36px rgba(37, 99, 235, 0.32);
}
.hero-title-row span { color: #dbeafe; font-size: 14px; font-weight: 500; }
.hero-balance h2 { margin: 8px 0 4px; color: #fff; font-size: 42px; line-height: 1; font-weight: 600; }
.hero-balance small { color: #dbeafe; font-size: 14px; }

.quick-actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.quick-action { min-height: 58px; border-radius: 16px; background: #fff; border: 1px solid #e2e8f0; box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06); display: grid; gap: 3px; place-items: center; padding: 7px 4px; }
.quick-action i { width: 28px; height: 28px; border-radius: 50%; background: #eff6ff; color: #2563eb; display: grid; place-items: center; font-style: normal; font-size: 16px; font-weight: 700; }
.quick-action span { color: #0f172a; font-size: 12px; line-height: 14px; font-weight: 500; }

.assets-block { background: #fff; border: 1px solid #e2e8f0; border-radius: 22px; box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08); padding: 12px; }
.assets-head h3 { margin: 2px 6px 10px; color: #0f172a; font-size: 18px; font-weight: 600; }
.asset-row { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 12px; border-radius: 16px; padding: 10px; background: #f8fafc; }
.asset-left { min-width: 0; display: flex; align-items: center; gap: 10px; text-align: left; flex: 1 1 auto; }
.asset-icon { width: 36px; height: 36px; flex: 0 0 36px; border-radius: 50%; background: #2563eb; color: #fff; display: grid; place-items: center; font-weight: 700; }
.asset-meta { min-width: 0; display: grid; gap: 2px; }
.asset-right { flex: 0 1 auto; min-width: 96px; text-align: right; display: grid; gap: 2px; }
strong { color: #0f172a; font-weight: 600; font-size: 15px; }
small { color: #64748b; font-size: 12px; }
.asset-meta strong,
.asset-meta small,
.asset-right strong,
.asset-right small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 360px) {
  .asset-row { gap: 8px; padding: 9px; }
  .asset-icon { width: 32px; height: 32px; flex-basis: 32px; }
  .asset-right { min-width: 82px; }
  strong { font-size: 14px; }
  small { font-size: 11px; }
}
</style>
