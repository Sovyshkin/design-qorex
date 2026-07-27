<script setup>
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useWalletStore } from "@/stores/walletStore.ts";
import WalletScreen from "@/components/ui/WalletScreen.vue";

const { t } = useI18n();
const router = useRouter();
const walletStore = useWalletStore();
const phase = ref("checking");
const amount = ref("");
const recipient = ref("");
const code = ref("");
const ownWallet = ref("");
const sending = ref(false);
const copied = ref(false);
const balance = computed(() => Number(walletStore.balance || 0));
const valid = computed(() => Number(amount.value) >= 1 && Number(amount.value) <= balance.value && recipient.value.trim() && code.value.length === 6 && !sending.value);

const initialize = async () => {
  phase.value = "checking";
  try {
    const has2FA = await walletStore.check2FAStatus();
    if (!has2FA) {
      phase.value = "redirecting";
      await router.replace({ name: "twoFactorAuth", query: { from: "transfer" } });
      return;
    }
    ownWallet.value = (await walletStore.getUserWallet()) || walletStore.userWallet || "";
    phase.value = "ready";
  } catch (_error) {
    phase.value = "error";
  }
};
const normalizeCode = () => { code.value = code.value.replace(/\D/g, "").slice(0,6); };
const normalizeAmount = () => { amount.value = amount.value.replace(/[^\d.]/g, ""); };
const copyWallet = async () => { if(!ownWallet.value)return; await navigator.clipboard.writeText(ownWallet.value); copied.value=true; setTimeout(()=>copied.value=false,1400); };
const submit = async () => {
  if (!valid.value) return;
  if (recipient.value.trim() === ownWallet.value.trim()) return walletStore.showMessage(t("cannot_transfer_to_self"), "error");
  sending.value = true;
  try {
    await walletStore.transferFunds(recipient.value.trim(), amount.value, code.value);
  } catch (_error) {
    walletStore.showMessage(t("transfer_failed"), "error");
  } finally {
    sending.value = false;
  }
};
onMounted(initialize);
</script>

<template>
  <WalletScreen :title="t('transfer_page')" @back="walletStore.goBack()">
    <section v-if="phase !== 'ready'" class="state-card">
      <span v-if="phase === 'checking' || phase === 'redirecting'" class="spinner" />
      <span v-else class="state-icon">!</span>
      <h2>{{ phase === "error" ? t("error_occurred") : t("loading") }}</h2>
      <p>{{ phase === "redirecting" ? t("transfer_requires_2fa") : phase === "error" ? t("network_error") : t("transfer_2fa_required") }}</p>
      <button v-if="phase === 'error'" class="primary" @click="initialize">{{ t("try_again") }}</button>
    </section>

    <template v-else>
      <section class="wallet-card">
        <div><span>{{ t("my_wallet") }}</span><strong>{{ ownWallet || "—" }}</strong></div>
        <button type="button" @click="copyWallet">{{ copied ? "✓" : "▣" }}</button>
      </section>
      <section class="form-card">
        <label><span>{{ t("recipient_wallet_number") }}</span><input v-model="recipient" autocomplete="off" :placeholder="t('recipient_wallet_number')"></label>
        <label><span>{{ t("select_amount") }}</span><div class="amount-field"><input v-model="amount" class="transfer-amount-input" inputmode="decimal" placeholder="0.00" style="border:0!important;outline:0!important;background:transparent!important;box-shadow:none!important;padding:0!important;border-radius:0!important;appearance:none!important;-webkit-appearance:none!important" @input="normalizeAmount"><b>USDT</b></div></label>
        <div class="balance"><span>{{ t("available_balance") }}</span><strong>{{ walletStore.roundToHundredths(balance) }} USDT</strong></div>
        <p v-if="amount && Number(amount) > balance" class="error">{{ t("insufficient_funds") }}</p>
        <p v-else-if="amount && Number(amount) < 1" class="error">{{ t("minimum_transfer_amount") }}</p>
        <label><span>{{ t("enter_2fa_code") }}</span><input v-model="code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="••••••" @input="normalizeCode"></label>
      </section>
      <button class="primary" :disabled="!valid" @click="submit">{{ sending ? `${t('loading')}...` : t("transfer_funds") }}</button>
    </template>
  </WalletScreen>
</template>

<style scoped>
.state-card{min-height:300px;padding:28px;display:flex!important;flex-direction:column;align-items:center;justify-content:center;gap:12px;border:1px solid var(--screen-border);border-radius:26px;background:var(--screen-card)!important;text-align:center;box-shadow:0 18px 40px rgba(15,23,42,.09)}.state-card h2{color:var(--screen-text)!important;font-size:22px;font-weight:750}.state-card p{max-width:310px;color:var(--screen-muted)!important;font-size:14px;line-height:1.5}.spinner{width:42px;height:42px;border:4px solid var(--screen-border);border-top-color:var(--screen-primary);border-radius:50%;animation:spin .8s linear infinite}.state-icon{width:58px;height:58px;display:grid;place-items:center;border-radius:18px;background:color-mix(in srgb,var(--screen-danger) 14%,transparent);color:var(--screen-danger)!important;font-size:28px;font-weight:800}
.wallet-card{min-height:110px;padding:18px;display:grid!important;grid-template-columns:minmax(0,1fr) 48px;align-items:center;gap:12px;border-radius:24px;background:linear-gradient(145deg,#3b82f6,#1e40af)!important;box-shadow:0 18px 36px rgba(37,99,235,.24)}.wallet-card span{color:#dbeafe!important;font-size:12px}.wallet-card strong{display:block;margin-top:7px;overflow-wrap:anywhere;color:#fff!important;font-size:17px;font-weight:700}.wallet-card button{width:48px;height:48px;border-radius:15px;background:rgba(255,255,255,.16)!important;color:#fff!important;font-size:20px}
.form-card{padding:17px;display:grid!important;gap:14px;border:1px solid var(--screen-border);border-radius:24px;background:var(--screen-card)!important;box-shadow:0 12px 30px rgba(15,23,42,.07)}label{display:grid;gap:7px}label>span,.balance span{color:var(--screen-muted)!important;font-size:13px;font-weight:650}input,.amount-field{width:100%;min-height:56px;padding:0 14px;border:1px solid var(--screen-border)!important;border-radius:16px;background:var(--screen-soft)!important;color:var(--screen-text)!important;font-weight:650}.amount-field{display:flex!important;align-items:center;gap:12px}.amount-field .transfer-amount-input{display:block!important;min-width:0!important;flex:1 1 auto!important;width:100%!important;height:54px!important;min-height:0!important;margin:0!important;border:0!important;outline:0!important;background:transparent!important;box-shadow:none!important;padding:0!important;border-radius:0!important;color:var(--screen-text)!important;font-size:20px!important;font-weight:650!important;appearance:none!important;-webkit-appearance:none!important}.amount-field b{flex:0 0 auto;padding:8px 11px;border-radius:11px;background:color-mix(in srgb,var(--screen-primary) 12%,transparent)!important;color:var(--screen-text)!important;font-size:13px;font-weight:700}.balance{display:flex!important;justify-content:space-between;gap:12px}.balance strong{color:var(--screen-text)!important;font-size:13px;font-weight:700}.error{color:var(--screen-danger)!important;font-size:12px}.primary{min-height:54px;padding:0 20px;border-radius:17px;background:linear-gradient(135deg,#2563eb,#3b82f6)!important;color:#fff!important;font-weight:750;box-shadow:0 14px 28px rgba(37,99,235,.24)}.primary:disabled{opacity:.42}@keyframes spin{to{transform:rotate(360deg)}}
</style>
