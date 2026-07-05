<script setup>
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useWalletStore } from "@/stores/walletStore";
import WalletScreen from "@/components/ui/WalletScreen.vue";

const { t } = useI18n();
const walletStore = useWalletStore();
const referrals = ref([]);
const loading = ref(true);
const error = ref("");
const copied = ref(false);
const userId = computed(() => walletStore.user?.tg_id || walletStore.userTg?.id || "");
const referralLink = computed(() => `https://t.me/peekpay_bot?startapp=referal_${userId.value}`);
const earned = computed(() => referrals.value.reduce((sum, item) => sum + Number(item.referral_only_pay || 0), 0));

const load = async () => {
  loading.value = true;
  error.value = "";
  try { referrals.value = (await walletStore.getMyReferrals()) || []; }
  catch (_error) { error.value = t("referrals_load_failed"); }
  finally { loading.value = false; }
};

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(referralLink.value);
    copied.value = true;
    walletStore.showMessage(t("copied"), "success", 1500);
    setTimeout(() => (copied.value = false), 1500);
  } catch (_error) { walletStore.showMessage(t("error_occurred"), "error"); }
};

onMounted(load);
</script>

<template>
  <WalletScreen :title="t('referal')" @back="walletStore.goBack()">
    <section class="ref-hero">
      <span class="ref-hero__eyebrow">PEEKPAY REWARDS</span>
      <h2 v-html="t('earn_up_to_15')"></h2>
      <div class="ref-hero__orb" />
    </section>

    <section class="ref-card">
      <p class="ref-label">{{ t("referal_link") }}</p>
      <button class="ref-link" type="button" @click="copyLink">
        <span>{{ referralLink }}</span>
        <span class="ref-link__copy">{{ copied ? "✓" : "▣" }}</span>
      </button>
    </section>

    <div class="ref-stats">
      <div><span>{{ t("referals") }}</span><strong>{{ referrals.length }}</strong></div>
      <div><span>{{ t("earned") }}</span><strong>{{ walletStore.roundToHundredths(earned) }} $</strong></div>
    </div>

    <section class="ref-card ref-list">
      <div v-if="loading" class="ref-state"><span class="spinner" />{{ t("loading") }}...</div>
      <div v-else-if="error" class="ref-state ref-state--error"><p>{{ error }}</p><button @click="load">{{ t("try_again") }}</button></div>
      <div v-else-if="!referrals.length" class="ref-state"><span class="people-icon">◎</span><h3>{{ t("no_referals_yet") }}</h3><p>{{ t("no_referals_description") }}</p></div>
      <article v-else v-for="item in referrals" :key="item.id || item.tg_id" class="ref-user">
        <span class="ref-user__avatar">{{ (item.username || item.first_name || "P").slice(0, 1).toUpperCase() }}</span>
        <div><strong>{{ item.username ? `@${item.username}` : item.first_name }}</strong><small>{{ item.date || "PeekPay" }}</small></div>
        <b>{{ walletStore.roundToHundredths(item.referral_only_pay || 0) }} $</b>
      </article>
    </section>
  </WalletScreen>
</template>

<style scoped>
.ref-hero { min-height: 224px; position: relative; overflow: hidden; display: flex !important; flex-direction: column; justify-content: flex-end; padding: 24px; border-radius: 26px; background: linear-gradient(145deg,#3b82f6,#1e40af) !important; box-shadow: 0 20px 44px rgba(37,99,235,.28); }
.ref-hero__eyebrow { position: relative; z-index: 1; color: #dbeafe !important; font-size: 11px; letter-spacing: .14em; font-weight: 800; }
.ref-hero h2 { position: relative; z-index: 1; max-width: 330px; margin: 12px 0 0; color: #fff !important; font-size: clamp(28px,8vw,40px); line-height: 1.03; font-weight: 750; }
.ref-hero :deep(span) { color: #fff !important; font: inherit !important; }
.ref-hero__orb { position: absolute; width: 190px; height: 190px; right: -42px; top: -60px; border-radius: 50%; background: rgba(255,255,255,.16); }
.ref-card { padding: 18px; display: grid !important; gap: 10px; border-radius: 22px; border: 1px solid var(--screen-border); background: var(--screen-card) !important; box-shadow: 0 12px 30px rgba(15,23,42,.08); }
.ref-label { color: var(--screen-muted) !important; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; font-weight: 750; }
.ref-link { min-width: 0; width: 100%; padding: 14px; display: grid !important; grid-template-columns: minmax(0,1fr) 46px; align-items: center; gap: 10px; border: 1px solid var(--screen-border); border-radius: 16px; background: var(--screen-soft) !important; text-align: left; }
.ref-link span:first-child { overflow-wrap: anywhere; color: var(--screen-text) !important; font-size: 14px; font-weight: 600; }
.ref-link__copy { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 13px; background: linear-gradient(135deg,#2563eb,#3b82f6); color: #fff !important; font-size: 20px; }
.ref-stats { display: grid !important; grid-template-columns: 1fr 1fr; gap: 10px; }
.ref-stats div { padding: 16px; border-radius: 20px; border: 1px solid var(--screen-border); background: var(--screen-card) !important; }
.ref-stats span { display: block; color: var(--screen-muted) !important; font-size: 13px; }
.ref-stats strong { display: block; margin-top: 6px; color: var(--screen-text) !important; font-size: 22px; font-weight: 750; }
.ref-list { min-height: 160px; }
.ref-state { min-height: 130px; display: flex !important; flex-direction: column; align-items: center; justify-content: center; gap: 9px; color: var(--screen-muted) !important; text-align: center; }
.ref-state h3 { color: var(--screen-text) !important; font-size: 18px; font-weight: 700; }.ref-state p { color: var(--screen-muted) !important; font-size: 14px; }.ref-state button { color: var(--screen-primary) !important; font-weight: 700; }
.people-icon { color: var(--screen-primary) !important; font-size: 38px; }.spinner { width: 28px; height: 28px; border: 3px solid var(--screen-border); border-top-color: var(--screen-primary); border-radius: 50%; animation: spin .8s linear infinite; }
.ref-user { min-height: 64px; display: grid !important; grid-template-columns: 44px 1fr auto; align-items: center; gap: 11px; border-bottom: 1px solid var(--screen-border); }.ref-user:last-child { border: 0; }.ref-user__avatar { width: 44px; height: 44px; display:grid; place-items:center; border-radius:14px; background:var(--screen-soft); color:var(--screen-primary)!important; font-weight:800; }.ref-user strong,.ref-user b { color:var(--screen-text)!important; font-weight:700; }.ref-user small { display:block; color:var(--screen-muted)!important; font-size:12px; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
