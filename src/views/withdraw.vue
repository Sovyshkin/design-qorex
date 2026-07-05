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
const address = ref("");
const memo = ref("");
const code = ref("");
const network = ref("USDT_TRC20");
const submitting = ref(false);
const success = ref(false);
const networks=[{id:"USDT_TRC20",name:"TRC20",symbol:"T"},{id:"USDT_TON",name:"TON",symbol:"◆"},{id:"USDT_ERC20",name:"ERC20",symbol:"♦"},{id:"USDT_BSC",name:"BEP20",symbol:"⬡"}];
const balance = computed(()=>Number(walletStore.balance||0));
const valid = computed(()=>Number(amount.value)>=5&&Number(amount.value)<=balance.value&&address.value.trim()&&code.value.length===6&&!submitting.value);

const initialize=async()=>{phase.value="checking";try{const has2FA=await walletStore.check2FAStatus();if(!has2FA){phase.value="redirecting";await router.replace({name:"twoFactorAuth",query:{from:"withdraw"}});return}phase.value="ready"}catch(_error){phase.value="error"}};
const normalizeCode=()=>code.value=code.value.replace(/\D/g,"").slice(0,6);
const submit=async()=>{if(!valid.value)return;submitting.value=true;try{const result=await walletStore.withdrawFunds(amount.value,network.value.replace("USDT_",""),address.value.trim(),memo.value.trim(),code.value);if(result){success.value=true;amount.value="";address.value="";memo.value="";code.value=""}}finally{submitting.value=false}};
const closeSuccess=()=>{success.value=false;walletStore.getUser()};
onMounted(initialize);
</script>

<template>
  <WalletScreen :title="t('withdraw_page')" @back="walletStore.goBack()">
    <section v-if="phase!=='ready'" class="state-card"><span v-if="phase!=='error'" class="spinner"/><span v-else class="state-icon">!</span><h2>{{phase==='error'?t('error_occurred'):t('loading')}}</h2><p>{{phase==='redirecting'?t('transfer_requires_2fa'):t('network_error')}}</p><button v-if="phase==='error'" class="primary" @click="initialize">{{t('try_again')}}</button></section>
    <template v-else>
      <section class="balance-card"><span>{{t('available_balance')}}</span><strong>{{walletStore.roundToHundredths(balance)}} USDT</strong><small>{{t('min_withdraw')}}: 5 USDT</small></section>
      <section class="form-card">
        <label><span>{{t('withdraw_amount')}}</span><div class="amount-field"><input v-model="amount" type="number" min="5" :max="balance" placeholder="0.00"><b>USDT</b></div></label>
        <div><span class="label">{{t('network')}}</span><div class="network-grid"><button v-for="item in networks" :key="item.id" :class="{active:network===item.id}" @click="network=item.id"><i>{{item.symbol}}</i>{{item.name}}</button></div></div>
        <label><span>{{t('wallet_address')}}</span><input v-model="address" autocomplete="off" :placeholder="t('wallet_address')"></label>
        <label><span>Memo</span><input v-model="memo" autocomplete="off" placeholder="Memo / Tag"></label>
        <label><span>{{t('enter_2fa_code')}}</span><input v-model="code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="••••••" @input="normalizeCode"></label>
      </section>
      <button class="primary" :disabled="!valid" @click="submit">{{submitting?`${t('loading')}...`:t('withdraw_funds')}}</button>
    </template>
    <div v-if="success" class="scrim"><section class="success-card"><span>✓</span><h2>{{t('withdraw_request_sent')}}</h2><p>{{t('withdraw_processing_message')}}</p><button class="primary" @click="closeSuccess">{{t('done')||'Готово'}}</button></section></div>
  </WalletScreen>
</template>

<style scoped>
.state-card,.success-card{padding:28px;display:flex!important;flex-direction:column;align-items:center;justify-content:center;gap:12px;border:1px solid var(--screen-border);border-radius:26px;background:var(--screen-card)!important;text-align:center}.state-card{min-height:280px}.state-card h2,.success-card h2{color:var(--screen-text)!important;font-size:22px;font-weight:750}.state-card p,.success-card p{color:var(--screen-muted)!important;font-size:14px}.spinner{width:42px;height:42px;border:4px solid var(--screen-border);border-top-color:var(--screen-primary);border-radius:50%;animation:spin .8s linear infinite}.state-icon{color:var(--screen-danger)!important;font-size:32px}.balance-card{min-height:138px;padding:22px;display:flex!important;flex-direction:column;justify-content:center;border-radius:26px;background:linear-gradient(145deg,#3b82f6,#1e40af)!important;box-shadow:0 18px 38px rgba(37,99,235,.24)}.balance-card span,.balance-card small{color:#dbeafe!important;font-size:13px}.balance-card strong{margin:10px 0;color:#fff!important;font-size:34px;font-weight:750}
.form-card{padding:17px;display:grid!important;gap:14px;border:1px solid var(--screen-border);border-radius:24px;background:var(--screen-card)!important;box-shadow:0 12px 30px rgba(15,23,42,.07)}label{display:grid;gap:7px}label>span,.label{display:block;margin-bottom:7px;color:var(--screen-muted)!important;font-size:13px;font-weight:650}input,.amount-field{width:100%;min-height:55px;padding:0 14px;border:1px solid var(--screen-border)!important;border-radius:16px;background:var(--screen-soft)!important;color:var(--screen-text)!important}.amount-field{display:flex!important;align-items:center}.amount-field input{min-width:0;flex:1;padding:0;border:0!important;background:transparent!important}.amount-field b{color:var(--screen-text)!important;font-size:13px}.network-grid{display:grid!important;grid-template-columns:1fr 1fr;gap:8px}.network-grid button{min-height:52px;padding:8px;display:flex!important;align-items:center;gap:8px;border:1px solid var(--screen-border);border-radius:15px;background:var(--screen-soft)!important;color:var(--screen-text)!important;font-size:13px;font-weight:650}.network-grid button.active{border-color:var(--screen-primary);color:var(--screen-primary)!important}.network-grid i{width:28px;height:28px;display:grid;place-items:center;border-radius:50%;background:var(--screen-primary);color:#fff!important;font-style:normal}.primary{min-height:54px;padding:0 20px;border-radius:17px;background:linear-gradient(135deg,#2563eb,#3b82f6)!important;color:#fff!important;font-weight:750}.primary:disabled{opacity:.42}.scrim{position:fixed;inset:0;z-index:300;padding:16px;display:grid!important;place-items:center;background:rgba(2,6,23,.62)!important}.success-card{width:100%;max-width:380px}.success-card>span{width:64px;height:64px;display:grid;place-items:center;border-radius:22px;background:color-mix(in srgb,var(--screen-success) 15%,transparent);color:var(--screen-success)!important;font-size:34px}@keyframes spin{to{transform:rotate(360deg)}}
</style>
