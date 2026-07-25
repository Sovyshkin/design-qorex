<script setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useWalletStore } from "@/stores/walletStore.ts";
import WalletScreen from "@/components/ui/WalletScreen.vue";
import NavBar from "@/components/NavBar.vue";
import usdtIcon from "@/assets/coin-usdt.svg";

const { t } = useI18n();
const walletStore = useWalletStore();
const amount = ref("");
const loading = ref(false);
const valid = computed(() => Number(amount.value) >= 1 && Number(amount.value) <= 10000 && !loading.value);
const sanitize = () => { amount.value = String(amount.value).replace(/\D/g, "").slice(0, 5); };

const submit = async () => {
  if (!valid.value) return walletStore.showMessage(t("invalid_amount") || "Введите сумму от 1 до 10000 USDT", "error");
  loading.value = true;
  try {
    walletStore.amount = String(Math.floor(Number(amount.value)));
    const url = await walletStore.createInvoice();
    if (!url) throw new Error("empty payment url");
    window.location.assign(url);
  } catch (error) {
    const isTimeout =
      error?.code === "ECONNABORTED" || /timeout/i.test(String(error?.message || ""));
    walletStore.showMessage(
      error?.response?.data?.detail ||
        (isTimeout ? t("error_timer") : t("error_occurred")),
      "error"
    );
  } finally { loading.value = false; }
};

</script>

<template>
  <div class="deposit-layout" :class="{ 'is-dark': walletStore.isDarkTheme }">
  <WalletScreen :title="t('deposit_page')" @back="walletStore.goBack()">
    <section class="deposit-card deposit-card--amount">
      <div class="card-heading">
        <div><span class="eyebrow">{{ t("amount") }}</span><h2>{{ t("enter_amount") }}</h2></div>
      </div>
      <label class="amount-control">
        <img class="amount-control__icon" :src="usdtIcon" alt="">
        <input class="amount-control__input" v-model="amount" inputmode="numeric" placeholder="0" aria-label="USDT amount" style="border:0!important;outline:0!important;background:transparent!important;background-color:transparent!important;box-shadow:none!important;padding:0!important;margin:0!important;border-radius:0!important;appearance:none!important;-webkit-appearance:none!important" @input="sanitize">
        <span class="amount-control__currency">USDT</span>
      </label>
      <div class="quick-amounts">
        <button v-for="value in [5,10,25,50,100]" :key="value" :class="{active:amount===String(value)}" @click="amount=String(value)">+{{ value }}</button>
      </div>
      <div class="limits"><span>Min 1 USDT</span><span>Max 10 000 USDT</span></div>
    </section>

    <button class="primary" :disabled="!valid" @click="submit"><span>{{ loading ? `${t('loading')}...` : t("continue") }}</span><b>→</b></button>
  </WalletScreen>
  <NavBar embedded />
  </div>
</template>

<style scoped>
.deposit-layout{--layout-bg:#f1f5f9;width:100%;min-height:100vh;min-height:100dvh;display:flex!important;flex-direction:column;background:var(--layout-bg)!important}
.deposit-layout.is-dark{--layout-bg:#0d1b2a;background:linear-gradient(180deg,#07111f 0%,#0d1b2a 100%)!important}
.deposit-layout :deep(.wallet-screen__body){padding-bottom:20px}
.deposit-layout :deep(.wallet-nav-wrap){margin:0 16px calc(10px + env(safe-area-inset-bottom));width:calc(100% - 32px)!important;background:transparent!important}
.deposit-card{padding:22px;display:grid!important;gap:18px;border:1px solid var(--screen-border);border-radius:24px;background:var(--screen-card)!important;box-shadow:0 14px 34px rgba(15,23,42,.07)}.deposit-card--amount{background:linear-gradient(145deg,color-mix(in srgb,var(--screen-card) 92%,#3b82f6),var(--screen-card))!important}.card-heading{padding:0 2px;display:flex!important;align-items:center;justify-content:space-between;gap:14px}.eyebrow{display:block;color:var(--screen-primary)!important;font-size:10px;line-height:1.1;letter-spacing:.12em;text-transform:uppercase;font-weight:800}.card-heading h2{margin:7px 0 0;color:var(--screen-text)!important;font-size:18px;line-height:1.25;font-weight:750}.asset-badge{height:40px;padding:6px 12px 6px 6px;display:flex!important;align-items:center;gap:8px;border:1px solid var(--screen-border);border-radius:14px;background:var(--screen-soft)!important;color:var(--screen-text)!important;font-size:12px;font-weight:750}.asset-badge img{width:28px;height:28px}.amount-control{height:78px;padding:0 20px;display:flex!important;align-items:center;gap:12px;border:1px solid var(--screen-border);border-radius:20px;background:var(--screen-soft)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.05)}.amount-control:focus-within{border-color:var(--screen-primary);box-shadow:0 0 0 4px color-mix(in srgb,var(--screen-primary) 14%,transparent)}.amount-control input{min-width:0;height:100%;flex:1;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;color:var(--screen-text)!important;font-size:34px;line-height:1;font-weight:750}.amount-control span{padding-left:4px;color:var(--screen-muted)!important;font-size:14px;font-weight:750}.quick-amounts{display:grid!important;grid-template-columns:repeat(5,1fr);gap:9px}.quick-amounts button{min-width:0;min-height:44px;padding:0 8px;border:1px solid var(--screen-border);border-radius:14px;background:var(--screen-soft)!important;color:var(--screen-primary)!important;font-size:12px;font-weight:750}.quick-amounts button.active{border-color:transparent;background:linear-gradient(135deg,#2563eb,#3b82f6)!important;color:#fff!important}.limits{padding:0 2px;display:flex!important;justify-content:space-between;gap:16px}.limits span{color:var(--screen-muted)!important;font-size:10px}
.network-count{width:36px;height:36px;display:grid;place-items:center;border-radius:12px;background:var(--screen-soft);color:var(--screen-muted)!important;font-size:12px;font-weight:750}.network-grid{display:grid!important;grid-template-columns:1fr 1fr;gap:12px}.network-card{min-width:0;min-height:96px;padding:16px;position:relative;display:grid!important;grid-template-columns:42px minmax(0,1fr);align-items:center;gap:12px;border:1px solid var(--screen-border);border-radius:18px;background:var(--screen-soft)!important;text-align:left}.network-card.active{border-color:var(--screen-primary);background:color-mix(in srgb,var(--screen-primary) 11%,var(--screen-card))!important;box-shadow:0 8px 20px color-mix(in srgb,var(--screen-primary) 14%,transparent)}.network-card>img{width:42px;height:42px;filter:drop-shadow(0 5px 8px rgba(15,23,42,.12))}.network-card strong{display:block;overflow:hidden;text-overflow:ellipsis;color:var(--screen-text)!important;font-size:13px;line-height:1.2;font-weight:750}.network-card small{display:block;margin-top:5px;color:var(--screen-muted)!important;font-size:10px}.network-card i{width:22px;height:22px;position:absolute;right:9px;top:9px;display:grid;place-items:center;border:1.5px solid var(--screen-border);border-radius:50%;background:var(--screen-card);opacity:0}.network-card.active i{opacity:1;background:var(--screen-primary);border-color:var(--screen-primary)}.network-card i svg{width:13px;fill:none;stroke:#fff;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}.network-note{padding:13px 14px;display:flex!important;align-items:flex-start;gap:10px;border-radius:15px;background:color-mix(in srgb,var(--screen-primary) 8%,var(--screen-soft))!important}.network-note>span{width:22px;height:22px;flex:0 0 22px;display:grid;place-items:center;border-radius:50%;background:var(--screen-primary);color:#fff!important;font-size:11px;font-weight:800}.network-note p{margin:0;padding-top:2px;color:var(--screen-muted)!important;font-size:11px;line-height:1.45}
.primary,.secondary{min-height:56px;border-radius:18px;font-weight:750}.primary{padding:0 18px;display:flex!important;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#2563eb,#3b82f6)!important;color:#fff!important;box-shadow:0 14px 28px rgba(37,99,235,.24)}.primary span,.primary b{color:#fff!important;font-weight:750}.primary b{font-size:20px}.primary:disabled{opacity:.42}.secondary{background:var(--screen-soft)!important;color:var(--screen-primary)!important}.scrim{position:fixed;inset:0;z-index:200;display:flex!important;align-items:flex-end;padding:16px;background:rgba(2,6,23,.62)!important}.payment-sheet{width:100%;padding:14px 18px calc(18px + env(safe-area-inset-bottom));display:grid!important;gap:11px;border:1px solid var(--screen-border);border-radius:26px;background:var(--screen-card)!important;box-shadow:0 24px 60px rgba(0,0,0,.3)}.sheet-handle{width:44px;height:4px;margin:0 auto 6px;border-radius:4px;background:var(--screen-border)}.sheet-network{display:flex!important;align-items:center;gap:12px}.sheet-network img{width:48px;height:48px}.payment-sheet h2{margin:0;color:var(--screen-text)!important;font-size:20px;font-weight:750}.payment-sheet p{margin:3px 0 0;color:var(--screen-muted)!important;font-size:12px}.link{min-height:44px;color:var(--screen-muted)!important;font-weight:650}

/* Keep the amount entry as one visual control, isolated from legacy input styles. */
.deposit-layout .amount-control{min-height:86px;height:auto;padding:14px 16px;display:grid!important;grid-template-columns:46px minmax(0,1fr) auto;align-items:center;gap:14px;border-radius:20px}
.amount-control__icon{width:46px;height:46px;display:block;filter:drop-shadow(0 6px 10px rgba(16,185,129,.16))}
.deposit-layout .amount-control__input,.deposit-layout .amount-control__input:focus,.deposit-layout .amount-control__input:focus-visible{all:unset!important;box-sizing:border-box!important;width:100%!important;min-width:0!important;height:54px!important;display:block!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;outline:0!important;background:transparent!important;background-color:transparent!important;box-shadow:none!important;color:var(--screen-text)!important;font-size:32px!important;line-height:54px!important;font-weight:760!important;font-variant-numeric:tabular-nums!important;caret-color:var(--screen-primary)!important;appearance:none!important;-webkit-appearance:none!important}
.deposit-layout .amount-control__input::placeholder{color:var(--screen-muted)!important;opacity:.7!important}
.amount-control__currency{padding:10px 12px!important;border-radius:13px;background:color-mix(in srgb,var(--screen-primary) 10%,transparent)!important;color:var(--screen-text)!important;font-size:13px!important;font-weight:800!important}
.network-card{min-height:104px;padding:17px;grid-template-columns:46px minmax(0,1fr);gap:14px}
.network-card>img{width:46px;height:46px}
.network-card small{line-height:1.2}

@media(max-width:350px){.network-grid{grid-template-columns:1fr}.quick-amounts{gap:4px}.quick-amounts button{font-size:11px}}
</style>
