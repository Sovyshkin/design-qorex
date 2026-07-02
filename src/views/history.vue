<script setup>
import EmptyHistory from "@/components/EmptyHistory.vue";
import { useWalletStore } from "@/stores/walletStore";
import { useI18n } from "vue-i18n";
import { computed, onActivated, onBeforeUnmount, onMounted } from "vue";
import { getTransactionStatusMeta } from "@/utils/transactionStatus";

const walletStore = useWalletStore();
const { t } = useI18n();

const parseCustomDate = (dateString) => {
  if (!dateString) return new Date();
  const parsedDate = new Date(String(dateString));
  return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
};

const groupedHistory = computed(() => {
  const groups = {};
  walletStore.history.forEach((item) => {
    const d = parseCustomDate(item.datatime);
    const key = d.toLocaleDateString("ru-RU");
    if (!groups[key]) groups[key] = { displayDate: d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" }), items: [] };
    groups[key].items.push(item);
  });
  return groups;
});

const getTransactionStatus = (boolSuccess) =>
  getTransactionStatusMeta(boolSuccess, t);

const getHistoryIconType = (type) => {
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
  <div class="history-page">
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
                <strong>{{ item.type_trans === 'transfer' ? t('transfer_transaction') : t(item.type_trans || 'buy') }}</strong>
                <span :class="`state ${getTransactionStatus(item.bool_suecess).class}`">{{ getTransactionStatus(item.bool_suecess).text }}</span>
              </div>
            </div>
            <div class="row-right">
              <strong v-if="!walletStore.hideBalanceActive">{{ walletStore.roundToHundredths(item.amount) }} USDT</strong>
              <strong v-else>********</strong>
              <small v-if="!walletStore.hideBalanceActive">{{ walletStore.roundToHundredths(walletStore.getRub(item.amount)) }} ₽</small>
              <small v-else>********</small>
            </div>
          </button>
        </section>
      </template>
      <EmptyHistory v-else />
    </main>
  </div>
</template>

<style scoped>
.history-page { min-height: 100vh; background: #f1f5f9; }
.history-header { padding: 18px 16px 10px; }
h1 { margin: 0; font-size: 28px; line-height: 1; color: #0f172a; font-weight: 600; }
.history-content { padding: 0 16px 124px; display: grid; gap: 14px; }
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
.row-meta { text-align: left; display: grid; }
strong { color: #0f172a; font-size: 14px; font-weight: 600; }
small { color: #64748b; font-size: 12px; }
.state { font-size: 11px; }
.success { color: #10b981; }
.error { color: #ef4444; }
.in_processing { color: #2563eb; }
.row-right { text-align: right; display: grid; }

:global(.dark-theme) .history-page {
  background:
    radial-gradient(720px 320px at 50% -18%, rgba(37, 98, 235, 0.18), transparent 62%),
    linear-gradient(180deg, #07111f 0%, #0d1b2a 100%) !important;
}

:global(.dark-theme) .history-header h1 {
  color: #ffffff !important;
}

:global(.dark-theme) .history-group h2 {
  color: #94a3b8 !important;
}

:global(.dark-theme) .history-item {
  background: rgba(30, 39, 59, 0.94) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.3) !important;
}

:global(.dark-theme) .row-icon {
  border-color: rgba(255, 255, 255, 0.08) !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
}

:global(.dark-theme) .row-icon--deposit {
  background: linear-gradient(180deg, rgba(16, 185, 129, 0.18) 0%, rgba(16, 185, 129, 0.1) 100%) !important;
  color: #34d399 !important;
}

:global(.dark-theme) .row-icon--withdraw {
  background: linear-gradient(180deg, rgba(239, 68, 68, 0.18) 0%, rgba(239, 68, 68, 0.1) 100%) !important;
  color: #f87171 !important;
}

:global(.dark-theme) .row-icon--transfer {
  background: linear-gradient(180deg, rgba(37, 98, 235, 0.24) 0%, rgba(37, 98, 235, 0.12) 100%) !important;
  color: #60a5fa !important;
}

:global(.dark-theme) .row-icon--reward {
  background: linear-gradient(180deg, rgba(139, 92, 246, 0.22) 0%, rgba(139, 92, 246, 0.1) 100%) !important;
  color: #c4b5fd !important;
}

:global(.dark-theme) .row-icon--exchange {
  background: linear-gradient(180deg, rgba(148, 163, 184, 0.18) 0%, rgba(100, 116, 139, 0.1) 100%) !important;
  color: #e2e8f0 !important;
}

:global(.dark-theme) strong {
  color: #ffffff !important;
}

:global(.dark-theme) small {
  color: #94a3b8 !important;
}
</style>
