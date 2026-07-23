<script setup>
import { useWalletStore } from "@/stores/walletStore";
import { useI18n } from "vue-i18n";
import { computed, onActivated, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";

const walletStore = useWalletStore();
const { t } = useI18n();
const router = useRouter();
const cashback = ref(null);
const cashbackLoading = ref(false);
const cashbackError = ref("");
const userId = computed(() => walletStore.user?.tg_id || walletStore.userTg?.id || "");

const goRoute = (name) => router.push({ name });

const getCashbackAmount = (periodKey, periodData = {}) => {
  const legacyKeys = {
    daily: "cash_back_d",
    monthly: "cash_back_m",
    yearly: "cash_back_y",
  };

  return (
    periodData.cashback_amount ??
    periodData.cashback_calculated ??
    cashback.value?.[legacyKeys[periodKey]] ??
    0
  );
};

const cashbackPeriods = computed(() => {
  const periods = cashback.value?.periods || {};
  return [
    { key: "daily", label: "День", caption: 30000, data: periods.daily || {} },
    { key: "monthly", label: "Месяц", caption: 1000000, data: periods.monthly || {} },
    { key: "yearly", label: "Год", caption: 15000000, data: periods.yearly || {} },
  ].map((period) => ({
    ...period,
    cashbackAmount: getCashbackAmount(period.key, period.data),
  }));
});

const formatRub = (value) => `${walletStore.roundToHundredths(Number(value || 0))} ₽`;

const periodProgress = (period) => {
  const total = Number(period?.total_rub || 0);
  const need = Number(period?.need_for_cb || 0);
  if (!need) return 0;
  return Math.min(100, Math.max(0, (total / need) * 100));
};

const periodStatus = (period) => {
  if (period?.paid_now) return "Начислено сейчас";
  if (period?.already_paid) return "Уже выплачено";
  if (period?.threshold_reached) return "Доступно";
  return "В процессе";
};

const loadCashback = async () => {
  if (!userId.value) return;

  cashbackLoading.value = true;
  cashbackError.value = "";

  try {
    const result = await walletStore.getMyCashback();
    if (result) {
      cashback.value = result;
      const paidNow = Object.values(result.periods || {}).some((period) => period?.paid_now);
      if (paidNow) await walletStore.getUser();
    } else {
      cashbackError.value = "Не удалось загрузить кешбэк";
    }
  } catch (err) {
    cashbackError.value = "Не удалось загрузить кешбэк";
  } finally {
    cashbackLoading.value = false;
  }
};

const refreshMainData = async () => {
  try {
    const hasTelegramUser = walletStore.user?.tg_id || walletStore.userTg?.id;
    const requests = [walletStore.getPrice()];

    if (hasTelegramUser) {
      requests.unshift(walletStore.getUser());
      requests.push(loadCashback());
    }

    await Promise.allSettled(requests);
  } catch (err) {
    console.error("Error refreshing main page data:", err);
  }
};

onMounted(refreshMainData);
onActivated(refreshMainData);

watch(
  userId,
  (value, oldValue) => {
    if (value && value !== oldValue) {
      loadCashback();
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="home-page" :class="{ 'is-dark': walletStore.isDarkTheme }">
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

      <section class="cashback-block">
        <div class="cashback-head">
          <div>
            <span>PeekPay Cashback</span>
            <h3>Кешбэк</h3>
          </div>
          <button type="button" @click="loadCashback" :disabled="cashbackLoading">
            {{ cashbackLoading ? "..." : "↻" }}
          </button>
        </div>

        <div v-if="cashbackLoading && !cashback" class="cashback-state">Загружаем кешбэк...</div>
        <div v-else-if="cashbackError && !cashback" class="cashback-state cashback-state--error">
          {{ cashbackError }}
        </div>
        <div v-else class="cashback-list">
          <article
            v-for="period in cashbackPeriods"
            :key="period.key"
            class="cashback-row"
            :class="{ 'is-reached': period.data?.threshold_reached }"
          >
            <div class="cashback-row__top">
              <div>
                <strong>{{ period.label }}</strong>
                <small>Порог {{ formatRub(period.data?.need_for_cb || period.caption) }}</small>
              </div>
              <b>{{ formatRub(period.cashbackAmount) }}</b>
            </div>
            <div class="cashback-meter">
              <span :style="{ width: `${periodProgress(period.data)}%` }"></span>
            </div>
            <div class="cashback-row__bottom">
              <small>Оборот {{ formatRub(period.data?.total_rub) }}</small>
              <small>{{ periodStatus(period.data) }}</small>
            </div>
          </article>
        </div>
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

.cashback-block { padding: 14px; display: grid; gap: 12px; border-radius: 22px; border: 1px solid #dbeafe; background: linear-gradient(180deg, #fff 0%, #f8fbff 100%); box-shadow: 0 12px 28px rgba(15, 23, 42, 0.07); }
.cashback-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 2px 2px 0; }
.cashback-head span { color: #2563eb; font-size: 11px; line-height: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; }
.cashback-head h3 { margin: 3px 0 0; color: #0f172a; font-size: 19px; line-height: 22px; font-weight: 750; }
.cashback-head button { width: 38px; height: 38px; border-radius: 13px; background: #eff6ff; color: #2563eb; font-size: 18px; font-weight: 800; }
.cashback-head button:disabled { opacity: .55; }
.cashback-state { min-height: 84px; display: grid; place-items: center; color: #64748b; font-size: 14px; font-weight: 650; text-align: center; }
.cashback-state--error { color: #dc2626; }
.cashback-list { display: grid; gap: 9px; }
.cashback-row { padding: 12px; display: grid; gap: 9px; border-radius: 16px; background: #f1f5f9; border: 1px solid transparent; }
.cashback-row.is-reached { background: #ecfdf5; border-color: #bbf7d0; }
.cashback-row__top,
.cashback-row__bottom { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.cashback-row__top div { min-width: 0; display: grid; gap: 2px; }
.cashback-row strong { color: #0f172a; font-size: 15px; line-height: 18px; font-weight: 750; }
.cashback-row b { flex: 0 0 auto; color: #16a34a; font-size: 17px; line-height: 20px; font-weight: 800; }
.cashback-row small { min-width: 0; color: #64748b; font-size: 11px; line-height: 14px; font-weight: 600; }
.cashback-meter { width: 100%; height: 7px; overflow: hidden; border-radius: 999px; background: #e2e8f0; }
.cashback-meter span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #2563eb, #22c55e); transition: width .25s ease; }

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

.home-page.is-dark,
:global(.dark-theme) .home-page {
  background:
    radial-gradient(760px 340px at 50% -16%, rgba(37, 98, 235, 0.2), transparent 62%),
    linear-gradient(180deg, #07111f 0%, #0d1b2a 100%) !important;
}

.home-page.is-dark .home-avatar,
:global(.dark-theme) .home-avatar {
  background: rgba(30, 39, 59, 0.9) !important;
  border-color: rgba(56, 130, 250, 0.28) !important;
}

.home-page.is-dark .home-user h1,
:global(.dark-theme) .home-user h1 {
  color: #ffffff !important;
}

.home-page.is-dark .home-user p,
:global(.dark-theme) .home-user p {
  color: #94a3b8 !important;
}

.home-page.is-dark .quick-action,
:global(.dark-theme) .quick-action {
  background: rgba(30, 39, 59, 0.9) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.28) !important;
}

.home-page.is-dark .quick-action i,
:global(.dark-theme) .quick-action i {
  background: rgba(37, 98, 235, 0.16) !important;
  color: #3882fa !important;
}

.home-page.is-dark .quick-action span,
:global(.dark-theme) .quick-action span {
  color: #ffffff !important;
}

.home-page.is-dark .cashback-block,
:global(body.dark-theme) .cashback-block,
:global(.dark-theme) .cashback-block {
  background: linear-gradient(180deg, rgba(30, 39, 59, 0.98), rgba(15, 23, 42, 0.98)) !important;
  border-color: rgba(148, 163, 184, 0.18) !important;
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.34) !important;
}

.home-page.is-dark .cashback-head span,
:global(body.dark-theme) .cashback-head span,
:global(.dark-theme) .cashback-head span {
  color: #60a5fa !important;
}

.home-page.is-dark .cashback-head h3,
.home-page.is-dark .cashback-row strong,
:global(body.dark-theme) .cashback-head h3,
:global(body.dark-theme) .cashback-row strong,
:global(.dark-theme) .cashback-head h3,
:global(.dark-theme) .cashback-row strong {
  color: #f8fafc !important;
}

.home-page.is-dark .cashback-row small,
:global(body.dark-theme) .cashback-row small,
:global(.dark-theme) .cashback-row small {
  color: #94a3b8 !important;
}

.home-page.is-dark .cashback-head button,
:global(body.dark-theme) .cashback-head button,
:global(.dark-theme) .cashback-head button {
  background: rgba(37, 98, 235, 0.18) !important;
  color: #93c5fd !important;
}

.home-page.is-dark .cashback-row,
:global(body.dark-theme) .cashback-row,
:global(.dark-theme) .cashback-row {
  background: rgba(15, 23, 42, 0.82) !important;
  border-color: rgba(148, 163, 184, 0.1) !important;
}

.home-page.is-dark .cashback-row.is-reached,
:global(body.dark-theme) .cashback-row.is-reached,
:global(.dark-theme) .cashback-row.is-reached {
  background: rgba(22, 163, 74, 0.16) !important;
  border-color: rgba(34, 197, 94, 0.24) !important;
}

.home-page.is-dark .cashback-meter,
:global(body.dark-theme) .cashback-meter,
:global(.dark-theme) .cashback-meter {
  background: rgba(148, 163, 184, 0.2) !important;
}

.home-page.is-dark .assets-block,
:global(.dark-theme) .assets-block {
  background: rgba(30, 39, 59, 0.96) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.32) !important;
}

.home-page.is-dark .assets-head h3,
:global(.dark-theme) .assets-head h3 {
  color: #ffffff !important;
}

.home-page.is-dark .asset-row,
:global(.dark-theme) .asset-row {
  background: rgba(13, 27, 42, 0.72) !important;
}

.home-page.is-dark .asset-icon,
:global(.dark-theme) .asset-icon {
  background: rgba(37, 98, 235, 0.18) !important;
  color: #ffffff !important;
}

.home-page.is-dark strong,
:global(.dark-theme) strong {
  color: #ffffff !important;
}

.home-page.is-dark small,
:global(.dark-theme) small {
  color: #94a3b8 !important;
}
</style>
