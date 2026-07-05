<script setup>
import { useWalletStore } from "@/stores/walletStore";
import { useI18n } from "vue-i18n";
import { onActivated, onMounted } from "vue";
import { useRouter } from "vue-router";

const walletStore = useWalletStore();
const { t } = useI18n();
const router = useRouter();

const goRoute = (name) => router.push({ name });

const refreshMainData = async () => {
  try {
    const hasTelegramUser = walletStore.user?.tg_id || walletStore.userTg?.id;
    const requests = [walletStore.getPrice()];

    if (hasTelegramUser) {
      requests.unshift(walletStore.getUser());
    }

    await Promise.allSettled(requests);
  } catch (err) {
    console.error("Error refreshing main page data:", err);
  }
};

onMounted(refreshMainData);
onActivated(refreshMainData);
</script>

<template>
  <div class="home-page">
    <header class="home-header">
      <div class="home-user">
        <div class="home-avatar" :class="{ 'brand-avatar': !walletStore.userTg.photo_url }">
          <img :src="walletStore.userTg.photo_url || '/assets/peekpay-logo-150.png'" alt="avatar" />
        </div>
        <div>
          <h1>{{ walletStore.user.first_name || walletStore.userTg.first_name || "Пользователь" }}</h1>
          <p>PeekPay Account</p>
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
.home-user > div:last-child { min-width: 0; display: grid; justify-items: start; text-align: left !important; }
.home-avatar { width: 44px; height: 44px; border-radius: 50%; overflow: hidden; border: 2px solid #dbeafe; background: #fff; }
.home-avatar img { width: 100%; height: 100%; object-fit: cover; }
.home-avatar.brand-avatar img { object-fit: contain; padding: 7px; }
h1 { width: 100%; margin: 0; color: #0f172a; font-size: 20px; line-height: 1.15; font-weight: 600; text-align: left !important; }
.home-user p { width: 100%; margin: 2px 0 0; color: #2563eb; font-size: 13px; font-weight: 500; text-align: left !important; }

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

:global(.dark-theme) .home-page {
  background:
    radial-gradient(760px 340px at 50% -16%, rgba(37, 98, 235, 0.2), transparent 62%),
    linear-gradient(180deg, #07111f 0%, #0d1b2a 100%) !important;
}

:global(.dark-theme) .home-avatar {
  background: rgba(30, 39, 59, 0.9) !important;
  border-color: rgba(56, 130, 250, 0.28) !important;
}

:global(.dark-theme) .home-user h1 {
  color: #ffffff !important;
}

:global(.dark-theme) .home-user p {
  color: #94a3b8 !important;
}

:global(.dark-theme) .quick-action {
  background: rgba(30, 39, 59, 0.9) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.28) !important;
}

:global(.dark-theme) .quick-action i {
  background: rgba(37, 98, 235, 0.16) !important;
  color: #3882fa !important;
}

:global(.dark-theme) .quick-action span {
  color: #ffffff !important;
}

:global(.dark-theme) .assets-block {
  background: rgba(30, 39, 59, 0.96) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.32) !important;
}

:global(.dark-theme) .assets-head h3 {
  color: #ffffff !important;
}

:global(.dark-theme) .asset-row {
  background: rgba(13, 27, 42, 0.72) !important;
}

:global(.dark-theme) .asset-icon {
  background: rgba(37, 98, 235, 0.18) !important;
  color: #ffffff !important;
}

:global(.dark-theme) strong {
  color: #ffffff !important;
}

:global(.dark-theme) small {
  color: #94a3b8 !important;
}
</style>
