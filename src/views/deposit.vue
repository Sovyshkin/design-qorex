<script setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useWalletStore } from "@/stores/walletStore.ts";
import WalletScreen from "@/components/ui/WalletScreen.vue";

const { t } = useI18n();
const walletStore = useWalletStore();
const amount = ref("");
const network = ref("USDT_TRC20");
const loading = ref(false);
const paymentUrl = ref("");
const showPayment = ref(false);
const networks = [
  { id:"USDT_TRC20", name:"TRC20 (Tron)", symbol:"T", color:"#26a17b" },
  { id:"USDT_TON", name:"TON", symbol:"◆", color:"#0098ea" },
  { id:"USDT_ERC20", name:"ERC20 (Ethereum)", symbol:"♦", color:"#627eea" },
  { id:"USDT_BSC", name:"BEP20 (BSC)", symbol:"⬡", color:"#f3ba2f" },
];
const valid = computed(() => Number(amount.value) >= 1 && Number(amount.value) <= 10000 && !loading.value);
const sanitize = () => { amount.value = String(amount.value).replace(/\D/g, "").slice(0, 5); };

const submit = async () => {
  if (!valid.value) return walletStore.showMessage(t("invalid_amount") || "Введите сумму от 1 до 10000 USDT", "error");
  loading.value = true;
  try {
    walletStore.amount = String(Math.floor(Number(amount.value)));
    const url = await walletStore.createInvoice(network.value);
    if (!url) throw new Error("empty payment url");
    paymentUrl.value = url;
    showPayment.value = true;
  } catch (error) {
    walletStore.showMessage(error?.response?.data?.detail || t("error_occurred"), "error");
  } finally { loading.value = false; }
};

const openPayment = () => {
  if (window.Telegram?.WebApp?.openLink) window.Telegram.WebApp.openLink(paymentUrl.value);
  else window.open(paymentUrl.value, "_blank", "noopener,noreferrer");
};
const copyPayment = async () => { await navigator.clipboard.writeText(paymentUrl.value); walletStore.showMessage(t("copied"), "success", 1500); };
</script>

<template>
  <WalletScreen :title="t('deposit_page')" @back="walletStore.goBack()">
    <section class="operation-hero">
      <span>USDT</span><strong>{{ amount || "0" }}</strong><small>{{ t("enter_amount") }}</small>
    </section>
    <section class="form-card">
      <label class="field"><span>{{ t("amount") || "Amount" }}</span><div><input v-model="amount" inputmode="numeric" placeholder="0" @input="sanitize"><b>USDT</b></div></label>
      <div class="quick"><button v-for="value in [5,10,25,50,100]" :key="value" :class="{active:amount===String(value)}" @click="amount=String(value)">{{ value }}</button></div>
      <div class="field-title">{{ t("network") || "Network" }}</div>
      <button v-for="item in networks" :key="item.id" class="network" :class="{active:network===item.id}" @click="network=item.id">
        <span class="coin" :style="{background:item.color}">{{ item.symbol }}</span><strong>{{ item.name }}</strong><span class="radio" />
      </button>
    </section>
    <button class="primary" :disabled="!valid" @click="submit">{{ loading ? `${t('loading')}...` : t("continue") }}</button>
    <div v-if="showPayment" class="scrim" @click.self="showPayment=false"><section class="payment-sheet"><span class="sheet-handle"/><h2>{{ t("deposit_payment") }}</h2><p>{{ networks.find(n=>n.id===network)?.name }}</p><button class="primary" @click="openPayment">{{ t("open_in_app") || "Открыть оплату" }}</button><button class="secondary" @click="copyPayment">{{ t("copy") || "Скопировать ссылку" }}</button><button class="link" @click="showPayment=false">{{ t("cancel") || "Отмена" }}</button></section></div>
  </WalletScreen>
</template>

<style scoped>
.operation-hero{min-height:150px;padding:22px;display:flex!important;flex-direction:column;justify-content:center;border-radius:26px;background:linear-gradient(145deg,#3b82f6,#1e40af)!important;box-shadow:0 20px 40px rgba(37,99,235,.25)}.operation-hero span,.operation-hero small{color:#dbeafe!important;font-size:13px}.operation-hero strong{margin:9px 0;color:#fff!important;font-size:40px;line-height:1;font-weight:750}
.form-card{padding:16px;display:grid!important;gap:10px;border:1px solid var(--screen-border);border-radius:24px;background:var(--screen-card)!important;box-shadow:0 12px 30px rgba(15,23,42,.07)}.field{display:grid;gap:7px}.field>span,.field-title{color:var(--screen-muted)!important;font-size:13px;font-weight:650}.field div{height:60px;padding:0 15px;display:flex!important;align-items:center;border:1px solid var(--screen-border);border-radius:17px;background:var(--screen-soft)!important}.field input{min-width:0;flex:1;color:var(--screen-text)!important;font-size:22px;font-weight:700}.field b{color:var(--screen-text)!important;font-size:14px;font-weight:700}.quick{display:grid!important;grid-template-columns:repeat(5,1fr);gap:7px;margin-bottom:5px}.quick button{min-height:40px;border-radius:12px;background:var(--screen-soft)!important;color:var(--screen-primary)!important;font-size:13px;font-weight:750}.quick button.active{background:var(--screen-primary)!important;color:#fff!important}.network{min-height:62px;padding:9px 12px;display:grid!important;grid-template-columns:38px 1fr 20px;align-items:center;gap:10px;border:1px solid var(--screen-border);border-radius:17px;background:transparent!important;text-align:left}.network.active{border-color:var(--screen-primary);background:color-mix(in srgb,var(--screen-primary) 10%,transparent)!important}.coin{width:36px;height:36px;display:grid;place-items:center;border-radius:50%;color:#fff!important;font-weight:800}.network strong{color:var(--screen-text)!important;font-size:15px;font-weight:650}.radio{width:18px;height:18px;border:2px solid var(--screen-muted);border-radius:50%}.network.active .radio{border:5px solid var(--screen-primary)}
.primary,.secondary{min-height:54px;border-radius:17px;font-weight:750}.primary{background:linear-gradient(135deg,#2563eb,#3b82f6)!important;color:#fff!important;box-shadow:0 14px 28px rgba(37,99,235,.24)}.primary:disabled{opacity:.45}.secondary{background:var(--screen-soft)!important;color:var(--screen-primary)!important}.scrim{position:fixed;inset:0;z-index:200;display:flex!important;align-items:flex-end;padding:16px;background:rgba(2,6,23,.58)!important}.payment-sheet{width:100%;padding:14px 18px calc(18px + env(safe-area-inset-bottom));display:grid!important;gap:10px;border:1px solid var(--screen-border);border-radius:26px;background:var(--screen-card)!important;box-shadow:0 24px 60px rgba(0,0,0,.3)}.sheet-handle{width:44px;height:4px;margin:0 auto 5px;border-radius:4px;background:var(--screen-border)}.payment-sheet h2{color:var(--screen-text)!important;font-size:21px;font-weight:750}.payment-sheet p{color:var(--screen-muted)!important}.link{min-height:44px;color:var(--screen-muted)!important;font-weight:650}
</style>
