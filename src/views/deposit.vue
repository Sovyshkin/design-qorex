<script setup>
import { useI18n } from "vue-i18n";
import { useWalletStore } from "@/stores/walletStore.ts";
import { ref, watch, onMounted } from "vue";
import { useRouter } from "vue-router";

const { t } = useI18n();
const walletStore = useWalletStore();
const router = useRouter();
const selectedNetwork = ref("USDT_TRC20");
const localAmount = ref("");

const networks = [
  { id: "USDT_TRC20", name: "TRC20 (Tron)", icon: "usdt" },
  { id: "USDT_TON", name: "TON", icon: "ton" },
  { id: "USDT_ERC20", name: "ERC20 (Ethereum)", icon: "ethereum" },
  { id: "USDT_BSC", name: "BEP20 (BSC)", icon: "bsc" },
];

const isCreatingInvoice = ref(false);
const isDisabled = ref(false);
const showPaymentChoiceModal = ref(false);
const currentPaymentUrl = ref("");
const currentNetworkName = ref("");
const copyStatus = ref("");

const normalizeNumber = (value) => {
  if (!value) return "";
  let normalized = value.toString().replace(/,/g, ".").replace(/[^\d.-]/g, "");
  const parts = normalized.split(".");
  if (parts.length > 2) normalized = parts[0] + "." + parts.slice(1).join("");
  return normalized;
};

const handleAmountInput = (event) => {
  let normalized = normalizeNumber(event.target.value);
  if (normalized.includes(".")) normalized = normalized.split(".")[0];
  localAmount.value = normalized;
  const numValue = parseInt(normalized);
  if (!isNaN(numValue) && numValue > 0) walletStore.amount = normalized;
  else if (normalized === "") walletStore.amount = "";
};

const selectQuickAmount = (amount) => {
  localAmount.value = amount.toString();
  walletStore.amount = amount.toString();
};

const handleCopyLink = async (url) => {
  copyStatus.value = "copying";
  try {
    await navigator.clipboard.writeText(url);
    copyStatus.value = "copied";
    walletStore.showMessage("Ссылка скопирована в буфер обмена", "success");
    setTimeout(() => (copyStatus.value = ""), 2000);
  } catch (_error) {
    copyStatus.value = "error";
    walletStore.showMessage("Не удалось скопировать ссылку", "error");
    setTimeout(() => (copyStatus.value = ""), 2000);
  }
};

const openPaymentUrl = (url) => {
  if (!url) return;
  try {
    if (window.Telegram?.WebApp?.openLink) {
      window.Telegram.WebApp.openLink(url, { try_instant_view: false });
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  } catch (_error) {
    window.location.href = url;
  }
};

const handleOpenInApp = (url) => {
  openPaymentUrl(url);
  showPaymentChoiceModal.value = false;
};

const closePaymentModal = () => {
  copyStatus.value = "";
  showPaymentChoiceModal.value = false;
};

const createInvoice2 = async () => {
  if (isDisabled.value) return;
  const cleanAmount = localAmount.value.replace(/[^\d]/g, "");
  const numAmount = parseInt(cleanAmount);
  if (!cleanAmount || isNaN(numAmount) || numAmount <= 0) return walletStore.showMessage("Введите корректную сумму в USDT", "error");
  if (numAmount < 1) return walletStore.showMessage("Минимальная сумма для пополнения: 1 USDT", "error");
  if (numAmount > 10000) return walletStore.showMessage("Максимальная сумма для пополнения: 10,000 USDT", "error");

  isDisabled.value = true;
  isCreatingInvoice.value = true;
  try {
    walletStore.amount = Math.floor(numAmount).toString();
    const url = await walletStore.createInvoice(selectedNetwork.value);
    if (url && url.trim()) {
      currentPaymentUrl.value = url.trim();
      currentNetworkName.value = networks.find((n) => n.id === selectedNetwork.value)?.name || selectedNetwork.value;
      showPaymentChoiceModal.value = true;
    } else {
      walletStore.showMessage("Не удалось получить ссылку для оплаты", "error");
    }
  } catch (error) {
    walletStore.showMessage(error?.response?.data?.detail || "Произошла ошибка при создании платежа", "error");
  } finally {
    isCreatingInvoice.value = false;
    setTimeout(() => (isDisabled.value = false), 500);
  }
};

watch(showPaymentChoiceModal, () => {});
onMounted(() => walletStore.startInvoiceTimer());
</script>

<template>
  <div class="deposit-page">
    <header class="header">
      <img class="arrow" src="../assets/arrow-left.svg" alt="back" @click="walletStore.goBack()" />
      <h1>{{ t("deposit_page") }}</h1>
      <div class="emp"></div>
    </header>

    <main class="content">
      <section class="sheet-card">
        <label class="field-label">Amount</label>
        <div class="amount-input-wrap">
          <input type="text" placeholder="0" :value="localAmount" @input="handleAmountInput" inputmode="numeric" />
          <span>USDT</span>
        </div>

        <div class="quick-grid">
          <button v-for="amount in [5, 10, 25, 50, 100]" :key="amount" class="quick" :class="{ active: localAmount === amount.toString() }" @click="selectQuickAmount(amount)">
            {{ amount }}
          </button>
        </div>

        <label class="field-label">Network</label>
        <div class="network-list">
          <button v-for="network in networks" :key="network.id" class="network" :class="{ active: selectedNetwork === network.id }" @click="selectedNetwork = network.id">
            <div class="left"><img :src="`/assets/${network.icon}.png`" alt="icon" /><span>{{ network.name }}</span></div>
            <span class="dot" v-if="selectedNetwork === network.id">●</span>
          </button>
        </div>
      </section>

      <button class="cta" :disabled="isCreatingInvoice || isDisabled || walletStore.remainingInvoiceTime > 0" @click="createInvoice2()">
        <span v-if="walletStore.remainingInvoiceTime > 0">Подождите {{ walletStore.remainingInvoiceTime }}с</span>
        <span v-else-if="isCreatingInvoice">Создание платежа...</span>
        <span v-else>{{ t("continue") }}</span>
      </button>
    </main>

    <div v-if="showPaymentChoiceModal" class="modal-overlay" @click.self="closePaymentModal">
      <div class="modal">
        <h3>Способ оплаты</h3>
        <p>{{ currentNetworkName }}</p>
        <button class="secondary" :disabled="copyStatus === 'copying'" @click="handleCopyLink(currentPaymentUrl)">
          <span v-if="copyStatus === 'copied'">Ссылка скопирована</span>
          <span v-else-if="copyStatus === 'copying'">Копирование...</span>
          <span v-else>Скопировать ссылку</span>
        </button>
        <button class="cta" @click="handleOpenInApp(currentPaymentUrl)">Открыть в приложении</button>
        <button class="ghost" @click="closePaymentModal">Отмена</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.deposit-page { min-height: 100vh; background: #f1f5f9; }
.header { padding: 16px; display: flex; align-items: center; justify-content: space-between; }
.arrow, .emp { width: 24px; height: 24px; }
h1 { margin: 0; color: #0f172a; font-size: 20px; font-weight: 600; }

.content { padding: 6px 16px 124px; display: grid; gap: 16px; }
.sheet-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 16px; box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08); display: grid; gap: 10px; }
.field-label { font-size: 14px; font-weight: 500; color: #64748b; }

.amount-input-wrap { position: relative; }
.amount-input-wrap input { width: 100%; height: 56px; padding: 0 16px; border-radius: 16px; border: 1px solid #dbe3ef; background: #f8fafc; color: #0f172a; font-weight: 600; }
.amount-input-wrap span { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: #64748b; font-size: 14px; }

.quick-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 4px; }
.quick { min-height: 38px; border-radius: 12px; background: #eff6ff; color: #1e40af; font-size: 12px; font-weight: 600; }
.quick.active { background: #2563eb; color: #fff; }

.network-list { display: grid; gap: 8px; }
.network { min-height: 54px; border-radius: 14px; border: 1px solid #e2e8f0; background: #fff; display: flex; align-items: center; justify-content: space-between; padding: 0 12px; }
.network.active { background: #eff6ff; border-color: #3b82f6; }
.left { display: flex; gap: 10px; align-items: center; }
.left img { width: 24px; height: 24px; }
.left span { color: #0f172a; font-weight: 500; }
.dot { color: #2563eb; }

.cta { min-height: 54px; border-radius: 16px; background: linear-gradient(135deg, #2563eb, #1e40af); color: #fff; font-weight: 600; box-shadow: 0 12px 26px rgba(37,99,235,.28); }
.cta:disabled { opacity: .55; }

.modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.45); display: grid; place-items: center; z-index: 120; padding: 16px; }
.modal { width: 100%; max-width: 380px; background: #fff; border: 1px solid #e2e8f0; border-radius: 22px; box-shadow: 0 20px 40px rgba(15,23,42,.2); padding: 16px; display: grid; gap: 10px; }
.modal h3 { margin: 0; color: #0f172a; font-weight: 600; }
.modal p { margin: 0; color: #64748b; }
.secondary, .ghost { min-height: 48px; border-radius: 14px; font-weight: 600; }
.secondary { background: #eff6ff; color: #1e40af; }
.ghost { background: #f8fafc; color: #64748b; }

:global(.dark-theme) .deposit-page {
  background:
    radial-gradient(720px 320px at 50% -18%, rgba(37, 98, 235, 0.18), transparent 62%),
    linear-gradient(180deg, #07111f 0%, #0d1b2a 100%) !important;
}

:global(.dark-theme) .deposit-page .header h1 {
  color: #ffffff !important;
}

:global(.dark-theme) .deposit-page .arrow {
  filter: brightness(0) invert(1);
  opacity: 0.94;
}

:global(.dark-theme) .sheet-card,
:global(.dark-theme) .modal {
  background: rgba(30, 39, 59, 0.96) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.34) !important;
}

:global(.dark-theme) .field-label,
:global(.dark-theme) .modal p {
  color: #cbd5e1 !important;
}

:global(.dark-theme) .amount-input-wrap input {
  background: rgba(13, 27, 42, 0.58) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  color: #ffffff !important;
}

:global(.dark-theme) .amount-input-wrap span {
  color: #ffffff !important;
}

:global(.dark-theme) .quick {
  background: rgba(241, 245, 249, 0.95) !important;
  color: #1e40af !important;
}

:global(.dark-theme) .quick.active {
  background: linear-gradient(135deg, #2562eb, #3882fa) !important;
  color: #ffffff !important;
}

:global(.dark-theme) .network {
  background: rgba(13, 27, 42, 0.46) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
}

:global(.dark-theme) .network.active {
  background: rgba(37, 98, 235, 0.18) !important;
  border-color: rgba(56, 130, 250, 0.42) !important;
}

:global(.dark-theme) .left span,
:global(.dark-theme) .modal h3 {
  color: #ffffff !important;
}

:global(.dark-theme) .dot {
  color: #ffffff !important;
}

:global(.dark-theme) .cta {
  background: linear-gradient(135deg, #2562eb, #3882fa) !important;
  color: #ffffff !important;
  box-shadow: 0 14px 30px rgba(37, 98, 235, 0.28) !important;
}

:global(.dark-theme) .secondary {
  background: rgba(37, 98, 235, 0.16) !important;
  color: #ffffff !important;
}

:global(.dark-theme) .ghost {
  background: rgba(13, 27, 42, 0.54) !important;
  color: #94a3b8 !important;
}
</style>
