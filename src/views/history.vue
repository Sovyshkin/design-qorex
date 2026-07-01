<script setup>
import EmptyHistory from "@/components/EmptyHistory.vue";
import { useWalletStore } from "@/stores/walletStore";
import { useI18n } from "vue-i18n";
import { computed, onMounted } from "vue";
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

onMounted(async () => await walletStore.getPrice());
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
              <div class="row-icon">↕</div>
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
.row-icon { width: 34px; height: 34px; border-radius: 50%; background: #eff6ff; color: #2563eb; display: grid; place-items: center; font-weight: 700; }
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
  background: rgba(37, 98, 235, 0.16) !important;
  color: #3882fa !important;
}

:global(.dark-theme) strong {
  color: #ffffff !important;
}

:global(.dark-theme) small {
  color: #94a3b8 !important;
}
</style>
