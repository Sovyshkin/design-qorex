<script setup>
import EmptyHistory from "@/components/EmptyHistory.vue";
import { useWalletStore } from "@/stores/walletStore";
import { useI18n } from "vue-i18n";
import { computed, onActivated, onBeforeUnmount, onMounted } from "vue";
import { getTransactionStatusMeta } from "@/utils/transactionStatus";
import {
  getCashbackTransactionLabel,
  isCashbackTransaction,
} from "@/utils/cashbackTransaction";

const walletStore = useWalletStore();
const { t, locale } = useI18n();

const parseCustomDate = (dateString) => {
  if (!dateString) return new Date();

  const value = String(dateString).trim();
  const serverDateMatch = value.match(
    /^(\d{2})\.(\d{2})\.(\d{4})[-T ](\d{2}):(\d{2}):(\d{2})$/
  );

  if (serverDateMatch) {
    const [, day, month, year, hours, minutes, seconds] = serverDateMatch;
    const parsedServerDate = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes),
      Number(seconds)
    );

    if (
      parsedServerDate.getFullYear() === Number(year) &&
      parsedServerDate.getMonth() === Number(month) - 1 &&
      parsedServerDate.getDate() === Number(day)
    ) {
      return parsedServerDate;
    }
  }

  const parsedDate = new Date(value);
  return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
};

const groupedHistory = computed(() => {
  const groups = {};
  const sortedHistory = [...walletStore.history].sort(
    (left, right) =>
      parseCustomDate(right.datatime).getTime() -
      parseCustomDate(left.datatime).getTime()
  );

  sortedHistory.forEach((item) => {
    const d = parseCustomDate(item.datatime);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const dateLocale = locale.value === "en" ? "en-US" : "ru-RU";
    if (!groups[key]) groups[key] = { displayDate: d.toLocaleDateString(dateLocale, { day: "numeric", month: "long" }), items: [] };
    groups[key].items.push(item);
  });
  return groups;
});

const getTransactionStatus = (boolSuccess) =>
  getTransactionStatusMeta(boolSuccess, t);

const getHistoryTitle = (item) => {
  if (isCashbackTransaction(item?.type_trans)) {
    return getCashbackTransactionLabel(item.type_trans);
  }

  return item.type_trans === "transfer"
    ? t("transfer_transaction")
    : t(item.type_trans || "buy");
};

const getHistoryIconType = (type) => {
  if (isCashbackTransaction(type)) return "reward";

  switch (String(type || "").toLowerCase()) {
    case "input":
    case "receiving":
      return "deposit";
    case "output":
      return "withdraw";
    case "transfer":
      return "transfer";
    case "referal":
      return "reward";
    case "buy":
    default:
      return "exchange";
  }
};

const formatHistoryAmount = (item) => {
  if (walletStore.hideBalanceActive) return "********";

  if (isCashbackTransaction(item?.type_trans)) {
    return `+${walletStore.roundToHundredths(item.amount)} ₽`;
  }

  return `${walletStore.roundToHundredths(item.amount)} USDT`;
};

const formatHistoryRub = (item) => {
  if (walletStore.hideBalanceActive) return "********";

  if (isCashbackTransaction(item?.type_trans)) {
    return "Начисление кешбэка";
  }

  return `${walletStore.roundToHundredths(walletStore.getRub(item.amount))} ₽`;
};

const refreshHistoryData = async () => {
  try {
    const hasTelegramUser = walletStore.user?.tg_id || walletStore.userTg?.id;
    const requests = [walletStore.getPrice()];

    if (hasTelegramUser) {
      requests.unshift(walletStore.getUser());
    }

    await Promise.allSettled(requests);
  } catch (err) {
    console.error("Error refreshing history page data:", err);
  }
};

const handleWindowFocus = () => {
  refreshHistoryData();
};

const handleVisibilityChange = () => {
  if (document.visibilityState === "visible") {
    refreshHistoryData();
  }
};

onMounted(() => {
  refreshHistoryData();
  window.addEventListener("focus", handleWindowFocus);
  document.addEventListener("visibilitychange", handleVisibilityChange);
});

onActivated(refreshHistoryData);

onBeforeUnmount(() => {
  window.removeEventListener("focus", handleWindowFocus);
  document.removeEventListener("visibilitychange", handleVisibilityChange);
});
</script>

<template>
  <div class="history-page" :class="{ 'is-dark': walletStore.isDarkTheme }">
    <header class="history-header">
      <h1>{{ t("history_tranc") }}</h1>
    </header>

    <main class="history-content">
      <template v-if="walletStore.history.length">
        <section v-for="(group, dateKey) in groupedHistory" :key="dateKey" class="history-group">
          <h2>{{ group.displayDate }}</h2>
          <button v-for="(item, index) in group.items" :key="`${dateKey}-${index}`" class="history-item" @click="walletStore.goTransaction(item)">
            <div class="row-left">
              <div class="row-icon" :class="`row-icon--${getHistoryIconType(item.type_trans)}`">
                <svg
                  v-if="getHistoryIconType(item.type_trans) === 'deposit'"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 5v12" />
                  <path d="M7 12l5 5 5-5" />
                </svg>
                <svg
                  v-else-if="getHistoryIconType(item.type_trans) === 'withdraw'"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 19V7" />
                  <path d="M17 12l-5-5-5 5" />
                </svg>
                <svg
                  v-else-if="getHistoryIconType(item.type_trans) === 'transfer'"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M7 7h10" />
                  <path d="M13 3l4 4-4 4" />
                  <path d="M17 17H7" />
                  <path d="M11 13l-4 4 4 4" />
                </svg>
                <svg
                  v-else-if="getHistoryIconType(item.type_trans) === 'reward'"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 4l1.9 3.85 4.25.62-3.08 3 0.73 4.23L12 13.7 8.2 15.7l0.73-4.23-3.08-3 4.25-.62L12 4Z" />
                </svg>
                <svg
                  v-else
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M7 8h10" />
                  <path d="M14 5l3 3-3 3" />
                  <path d="M17 16H7" />
                  <path d="M10 13l-3 3 3 3" />
                </svg>
              </div>
              <div class="row-meta">
                <strong>{{ getHistoryTitle(item) }}</strong>
                <span :class="`state ${getTransactionStatus(item.bool_suecess).class}`">{{ getTransactionStatus(item.bool_suecess).text }}</span>
              </div>
            </div>
            <div class="row-right">
              <strong>{{ formatHistoryAmount(item) }}</strong>
              <small>{{ formatHistoryRub(item) }}</small>
            </div>
          </button>
        </section>
      </template>
      <EmptyHistory v-else />
    </main>
  </div>
</template>

<style scoped>
.history-page {
  width: 100%;
  height: 100vh;
  height: 100dvh;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f1f5f9;
}
.history-header { flex: 0 0 auto; padding: 18px 16px 10px; }
h1 { margin: 0; font-size: 28px; line-height: 1; color: #0f172a; font-weight: 600; }
.history-content {
  min-height: 0;
  flex: 1 1 auto;
  padding: 0 16px calc(116px + env(safe-area-inset-bottom, 0px));
  display: grid;
  align-content: start;
  gap: 14px;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;
}
.history-group { display: grid; gap: 10px; }
h2 { margin: 0; color: #64748b; font-size: 14px; font-weight: 500; }
.history-item { width: 100%; border-radius: 18px; border: 1px solid #e2e8f0; background: #fff; box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08); padding: 12px; display: flex; justify-content: space-between; align-items: center; }
.row-left { display: flex; align-items: center; gap: 10px; }
.row-icon {
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  border-radius: 15px;
  background: linear-gradient(180deg, #f8fbff 0%, #edf4ff 100%);
  border: 1px solid #dbeafe;
  color: #2563eb;
  display: grid;
  place-items: center;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}
.row-icon svg {
  width: 20px;
  height: 20px;
  display: block;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.row-icon--reward svg {
  fill: currentColor;
  stroke: none;
}
.row-icon--deposit {
  color: #10b981;
  background: linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%);
  border-color: #bbf7d0;
}
.row-icon--withdraw {
  color: #ef4444;
  background: linear-gradient(180deg, #fff5f5 0%, #fee2e2 100%);
  border-color: #fecaca;
}
.row-icon--transfer {
  color: #2563eb;
  background: linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%);
  border-color: #bfdbfe;
}
.row-icon--reward {
  color: #8b5cf6;
  background: linear-gradient(180deg, #f5f3ff 0%, #ede9fe 100%);
  border-color: #ddd6fe;
}
.row-icon--exchange {
  color: #0f172a;
  background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
  border-color: #cbd5e1;
}
.row-meta { min-width: 0; text-align: left; display: grid; justify-items: start; align-content: center; gap: 4px; }
strong { color: #0f172a; font-size: 14px; font-weight: 600; }
small { color: #64748b; font-size: 12px; }
.state { display: block; margin: 0; padding: 0; font-size: 11px; line-height: 1.15; text-align: left; justify-self: start; }
.success { color: #10b981; }
.error { color: #ef4444; }
.in_processing { color: #2563eb; }
.row-right { text-align: right; display: grid; }

.history-page.is-dark {
  background: #0d1b2a !important;
}

:global(body.dark-theme) .history-page.is-dark,
:global(body.dark-theme) .history-page.is-dark .history-header,
:global(body.dark-theme) .history-page.is-dark .history-content,
:global(body.dark-theme) .history-page.is-dark .history-group {
  background: transparent !important;
  background-color: transparent !important;
  box-shadow: none !important;
}

:global(body.dark-theme) .history-page.is-dark {
  background: #0d1b2a !important;
  background-color: #0d1b2a !important;
}

.history-page.is-dark .history-header h1 {
  color: #ffffff !important;
}

.history-page.is-dark .history-group h2 {
  color: #94a3b8 !important;
}

.history-page.is-dark .history-item {
  background: rgba(30, 39, 59, 0.94) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.3) !important;
}

.history-page.is-dark .row-icon {
  border-color: rgba(255, 255, 255, 0.08) !important;
  color: #ffffff !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
}

.history-page.is-dark .row-icon svg,
.history-page.is-dark .row-icon svg path {
  color: #ffffff !important;
  stroke: #ffffff !important;
}

.history-page.is-dark .row-icon--reward svg,
.history-page.is-dark .row-icon--reward svg path {
  fill: #ffffff !important;
  stroke: none !important;
}

.history-page.is-dark .row-icon--deposit {
  background: linear-gradient(180deg, rgba(16, 185, 129, 0.18) 0%, rgba(16, 185, 129, 0.1) 100%) !important;
  color: #ffffff !important;
}

.history-page.is-dark .row-icon--withdraw {
  background: linear-gradient(180deg, rgba(239, 68, 68, 0.18) 0%, rgba(239, 68, 68, 0.1) 100%) !important;
  color: #ffffff !important;
}

.history-page.is-dark .row-icon--transfer {
  background: linear-gradient(180deg, rgba(37, 98, 235, 0.24) 0%, rgba(37, 98, 235, 0.12) 100%) !important;
  color: #ffffff !important;
}

.history-page.is-dark .row-icon--reward {
  background: linear-gradient(180deg, rgba(139, 92, 246, 0.22) 0%, rgba(139, 92, 246, 0.1) 100%) !important;
  color: #ffffff !important;
}

.history-page.is-dark .row-icon--exchange {
  background: linear-gradient(180deg, rgba(148, 163, 184, 0.18) 0%, rgba(100, 116, 139, 0.1) 100%) !important;
  color: #ffffff !important;
}

.history-page.is-dark strong {
  color: #ffffff !important;
}

.history-page.is-dark small {
  color: #94a3b8 !important;
}
</style>
