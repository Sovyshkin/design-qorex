<script setup>
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useWalletStore } from "@/stores/walletStore.ts";
import WalletScreen from "@/components/ui/WalletScreen.vue";
import NavBar from "@/components/NavBar.vue";
import usdtIcon from "@/assets/coin-usdt.svg";
import tonIcon from "@/assets/coin-ton.svg";
import ethereumIcon from "@/assets/coin-ethereum.svg";
import bnbIcon from "@/assets/coin-bnb.svg";

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
const networks=[
  {id:"USDT_TRC20",name:"TRON",standard:"TRC20",icon:usdtIcon},
  {id:"USDT_TON",name:"TON",standard:"TON Network",icon:tonIcon},
  {id:"USDT_ERC20",name:"Ethereum",standard:"ERC20",icon:ethereumIcon},
  {id:"USDT_BSC",name:"BNB Chain",standard:"BEP20",icon:bnbIcon},
];
const selectedNetwork=computed(()=>networks.find((item)=>item.id===network.value));
const balance = computed(()=>Number(walletStore.balance||0));
const valid = computed(()=>Number(amount.value)>=5&&Number(amount.value)<=balance.value&&address.value.trim()&&code.value.length===6&&!submitting.value);

const initialize=async()=>{phase.value="checking";try{const has2FA=await walletStore.check2FAStatus();if(!has2FA){phase.value="redirecting";await router.replace({name:"twoFactorAuth",query:{from:"withdraw"}});return}phase.value="ready"}catch(_error){phase.value="error"}};
const normalizeCode=()=>code.value=code.value.replace(/\D/g,"").slice(0,6);
const submit=async()=>{if(!valid.value)return;submitting.value=true;try{const result=await walletStore.withdrawFunds(amount.value,network.value.replace("USDT_",""),address.value.trim(),memo.value.trim(),code.value);if(result){success.value=true;amount.value="";address.value="";memo.value="";code.value=""}}finally{submitting.value=false}};
const closeSuccess=()=>{success.value=false;walletStore.getUser()};
onMounted(initialize);
</script>

<template>
  <div class="withdraw-layout" :class="{'is-dark':walletStore.isDarkTheme}">
    <WalletScreen :title="t('withdraw_page')" @back="walletStore.goBack()">
      <section v-if="phase!=='ready'" class="state-card"><span v-if="phase!=='error'" class="spinner"/><span v-else class="state-icon">!</span><h2>{{phase==='error'?t('error_occurred'):t('loading')}}</h2><p>{{phase==='redirecting'?t('transfer_requires_2fa'):t('network_error')}}</p><button v-if="phase==='error'" class="primary" @click="initialize">{{t('try_again')}}</button></section>
      <template v-else>
        <section class="balance-card">
          <div><span>{{t('available_balance')}}</span><strong>{{walletStore.roundToHundredths(balance)}} <small>USDT</small></strong></div>
          <img :src="usdtIcon" alt="USDT">
          <p>{{t('min_withdraw')}}: 5 USDT</p>
        </section>

        <section class="withdraw-card amount-card">
          <div class="section-heading"><span>01</span><div><small>{{t('amount')}}</small><h2>{{t('withdraw_amount')}}</h2></div></div>
          <label class="amount-control"><img :src="usdtIcon" alt=""><input class="amount-input" v-model="amount" type="number" min="5" :max="balance" placeholder="0"><b>USDT</b></label>
          <div class="amount-meta"><span>Min 5 USDT</span><span>Max {{walletStore.roundToHundredths(balance)}} USDT</span></div>
        </section>

        <section class="withdraw-card">
          <div class="section-heading"><span>02</span><div><small>{{t('network')}}</small><h2>{{t('select_network')}}</h2></div></div>
          <div class="network-grid"><button v-for="item in networks" :key="item.id" :class="{active:network===item.id}" @click="network=item.id"><img :src="item.icon" :alt="item.name"><span><strong>{{item.name}}</strong><small>{{item.standard}}</small></span><i>✓</i></button></div>
          <div class="network-note"><b>i</b><span>{{selectedNetwork?.name}} · {{selectedNetwork?.standard}}. {{t('faq_tip_network')}}.</span></div>
        </section>

        <section class="withdraw-card details-card">
          <div class="section-heading"><span>03</span><div><small>{{t('wallet_address')}}</small><h2>{{t('withdraw_funds')}}</h2></div></div>
          <label><span>{{t('wallet_address')}}</span><input v-model="address" autocomplete="off" :placeholder="t('wallet_address')"></label>
          <label><span>Memo / Tag <em>optional</em></span><input v-model="memo" autocomplete="off" placeholder="Memo / Tag"></label>
          <label><span>{{t('enter_2fa_code')}}</span><input v-model="code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="••••••" @input="normalizeCode"></label>
        </section>
        <button class="primary submit-button" :disabled="!valid" @click="submit"><span>{{submitting?`${t('loading')}...`:t('withdraw_funds')}}</span><b>→</b></button>
      </template>
      <div v-if="success" class="scrim"><section class="success-card"><span>✓</span><h2>{{t('withdraw_request_sent')}}</h2><p>{{t('withdraw_processing_message')}}</p><button class="primary" @click="closeSuccess">{{t('done')||'Готово'}}</button></section></div>
    </WalletScreen>
    <NavBar embedded />
  </div>
</template>

<style scoped>
.withdraw-layout{--layout-bg:#f1f5f9;width:100%;min-height:100vh;min-height:100dvh;display:flex!important;flex-direction:column;background:var(--layout-bg)!important}.withdraw-layout.is-dark{--layout-bg:#0d1b2a;background:linear-gradient(180deg,#07111f,#0d1b2a)!important}.withdraw-layout :deep(.wallet-screen__body){padding-bottom:20px}.withdraw-layout :deep(.wallet-nav-wrap){margin:0 16px calc(10px + env(safe-area-inset-bottom));width:calc(100% - 32px)!important;background:transparent!important}
.state-card,.success-card{padding:28px;display:flex!important;flex-direction:column;align-items:center;justify-content:center;gap:12px;border:1px solid var(--screen-border);border-radius:26px;background:var(--screen-card)!important;text-align:center}.state-card{min-height:280px}.state-card h2,.success-card h2{margin:0;color:var(--screen-text)!important;font-size:22px;font-weight:750}.state-card p,.success-card p{margin:0;color:var(--screen-muted)!important;font-size:14px}.spinner{width:42px;height:42px;border:4px solid var(--screen-border);border-top-color:var(--screen-primary);border-radius:50%;animation:spin .8s linear infinite}.state-icon{color:var(--screen-danger)!important;font-size:32px}
.balance-card{min-height:142px;padding:22px;position:relative;display:grid!important;grid-template-columns:1fr 58px;align-items:center;gap:12px;overflow:hidden;border-radius:26px;background:linear-gradient(145deg,#3b82f6,#1e40af)!important;box-shadow:0 18px 38px rgba(37,99,235,.24)}.balance-card:after{content:"";position:absolute;width:150px;height:150px;right:-55px;top:-70px;border-radius:50%;background:rgba(255,255,255,.1)}.balance-card span,.balance-card p{color:#dbeafe!important;font-size:12px}.balance-card strong{display:block;margin-top:9px;color:#fff!important;font-size:30px;line-height:1;font-weight:780}.balance-card strong small{color:#dbeafe!important;font-size:13px}.balance-card img{width:54px;height:54px;position:relative;z-index:1}.balance-card p{grid-column:1/-1;margin:0}
.withdraw-card{padding:20px;display:grid!important;gap:17px;border:1px solid var(--screen-border);border-radius:24px;background:var(--screen-card)!important;box-shadow:0 12px 30px rgba(15,23,42,.07)}.section-heading{display:flex!important;align-items:center;gap:12px}.section-heading>span{width:34px;height:34px;display:grid;place-items:center;border-radius:12px;background:color-mix(in srgb,var(--screen-primary) 10%,var(--screen-soft));color:var(--screen-primary)!important;font-size:11px;font-weight:800}.section-heading small{display:block;color:var(--screen-primary)!important;font-size:9px;letter-spacing:.12em;text-transform:uppercase;font-weight:800}.section-heading h2{margin:4px 0 0;color:var(--screen-text)!important;font-size:18px;line-height:1.2;font-weight:760}
.amount-control{min-height:82px;padding:0 18px;display:flex!important;align-items:center;gap:12px;border:1px solid var(--screen-border);border-radius:20px;background:var(--screen-soft)!important}.amount-control:focus-within{border-color:var(--screen-primary);box-shadow:0 0 0 4px color-mix(in srgb,var(--screen-primary) 14%,transparent)}.amount-control input{min-width:0;height:64px;flex:1;padding:0!important;border:0!important;background:transparent!important;color:var(--screen-text)!important;font-size:30px;font-weight:760}.amount-control b{padding:9px 12px;border-radius:12px;background:color-mix(in srgb,var(--screen-primary) 10%,transparent);color:var(--screen-text)!important;font-size:13px}.amount-meta{display:flex!important;justify-content:space-between;gap:12px;color:var(--screen-muted)!important;font-size:10px}
.network-grid{display:grid!important;grid-template-columns:1fr 1fr;gap:10px}.network-grid button{min-width:0;min-height:100px;padding:15px;position:relative;display:grid!important;grid-template-columns:44px minmax(0,1fr);align-items:center;gap:12px;border:1px solid var(--screen-border);border-radius:18px;background:var(--screen-soft)!important;text-align:left}.network-grid button.active{border-color:var(--screen-primary);background:color-mix(in srgb,var(--screen-primary) 11%,var(--screen-card))!important}.network-grid img{width:44px;height:44px}.network-grid strong{display:block;overflow:hidden;text-overflow:ellipsis;color:var(--screen-text)!important;font-size:13px;font-weight:760}.network-grid small{display:block;margin-top:5px;color:var(--screen-muted)!important;font-size:10px}.network-grid i{width:22px;height:22px;position:absolute;right:8px;top:8px;display:none;place-items:center;border-radius:50%;background:var(--screen-primary);color:#fff!important;font-size:12px;font-style:normal}.network-grid button.active i{display:grid}.network-note{padding:12px 13px;display:flex!important;align-items:center;gap:9px;border-radius:14px;background:color-mix(in srgb,var(--screen-primary) 8%,var(--screen-soft))!important;color:var(--screen-muted)!important;font-size:10px;line-height:1.4}.network-note b{width:21px;height:21px;flex:0 0 21px;display:grid;place-items:center;border-radius:50%;background:var(--screen-primary);color:#fff!important}
.details-card label{display:grid!important;gap:7px}.details-card label>span{color:var(--screen-muted)!important;font-size:11px;font-weight:650}.details-card em{opacity:.65;font-size:9px;font-style:normal}.details-card input{width:100%;min-height:56px;padding:0 15px;border:1px solid var(--screen-border)!important;border-radius:16px;background:var(--screen-soft)!important;color:var(--screen-text)!important;font-size:13px}.details-card input:focus{border-color:var(--screen-primary)!important;box-shadow:0 0 0 4px color-mix(in srgb,var(--screen-primary) 14%,transparent)}
.primary{min-height:56px;padding:0 20px;border-radius:18px;background:linear-gradient(135deg,#2563eb,#3b82f6)!important;color:#fff!important;font-weight:750}.submit-button{display:flex!important;align-items:center;justify-content:space-between}.submit-button span,.submit-button b{color:#fff!important}.submit-button b{font-size:20px}.primary:disabled{opacity:.42}.scrim{position:fixed;inset:0;z-index:6000;padding:16px;display:grid!important;place-items:center;background:rgba(2,6,23,.62)!important}.success-card{width:100%;max-width:380px}.success-card>span{width:64px;height:64px;display:grid;place-items:center;border-radius:22px;background:color-mix(in srgb,var(--screen-success) 15%,transparent);color:var(--screen-success)!important;font-size:34px}

.withdraw-layout .amount-control{min-height:86px;padding:14px 16px;display:grid!important;grid-template-columns:46px minmax(0,1fr) auto;align-items:center;gap:14px}
.withdraw-layout .amount-control>img{width:46px;height:46px;display:block;filter:drop-shadow(0 6px 10px rgba(16,185,129,.16))}
.withdraw-layout .amount-input{all:unset!important;box-sizing:border-box!important;width:100%!important;min-width:0!important;height:54px!important;display:block!important;color:var(--screen-text)!important;font-size:30px!important;line-height:54px!important;font-weight:760!important;font-variant-numeric:tabular-nums!important;caret-color:var(--screen-primary)!important}
.withdraw-layout .amount-input::placeholder{color:var(--screen-muted)!important;opacity:.7!important}
.withdraw-layout .amount-control b{padding:10px 12px!important;border-radius:13px;color:var(--screen-text)!important}
.withdraw-layout .amount-meta span,.withdraw-layout .network-note span{color:var(--screen-muted)!important}

@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:350px){.network-grid{grid-template-columns:1fr}}
</style>
