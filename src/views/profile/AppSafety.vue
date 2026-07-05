<script setup>
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useWalletStore } from "@/stores/walletStore.ts";
import WalletScreen from "@/components/ui/WalletScreen.vue";
import InputCheck from "@/components/ui/inputs/InputCheck.vue";

const { t } = useI18n();
const router = useRouter();
const walletStore = useWalletStore();
const checking2FA = ref(false);
const codePasswordActive = computed(() => walletStore.codePasswordActive);
const hideBalanceActive = computed(() => walletStore.hideBalanceActive);
const twoFactorActive = computed(() => walletStore.has2FA);

const toggleCodePassword = async (enabled) => {
  if (enabled) return router.push({ name: "createPin", query: { createMode: true } });
  await walletStore.disablePinCode();
};
const toggleHideBalance = (enabled) => walletStore.setHideBalanceActive(enabled);
const open2FA = () => router.push({ name: "twoFactorAuth", query: { from: "safety" } });

onMounted(async () => {
  if (!walletStore.user?.tg_id && !walletStore.userTg?.id) return;
  checking2FA.value = true;
  try { await walletStore.check2FAStatus(); } finally { checking2FA.value = false; }
});
</script>

<template>
  <WalletScreen :title="t('safety')" @back="router.push({ name: 'profile' })">
    <section class="security-intro">
      <span class="security-intro__icon">
        <svg viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 4.6 2.9 8.2 7 10 4.1-1.8 7-5.4 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg>
      </span>
      <div><strong>{{ t("safety") }}</strong><p>{{ t("security_description") || "Управляйте защитой аккаунта и операций" }}</p></div>
    </section>

    <section class="security-section">
      <h2>{{ t("auth") }}</h2>
      <div class="security-card">
        <div class="security-row">
          <span class="row-icon row-icon--telegram">➤</span>
          <div><strong>Telegram</strong><small>@{{ walletStore.user?.username || walletStore.userTg?.username || "user" }}</small></div>
          <span class="status-dot is-on" />
        </div>
      </div>
    </section>

    <section class="security-section">
      <h2>{{ t("logIn") }}</h2>
      <div class="security-card">
        <div class="security-row">
          <span class="row-icon"><svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="4"/><path d="M9 8h.01M15 8h.01M9 13h.01M15 13h.01"/></svg></span>
          <div><strong>{{ t("code_password") }}</strong><small>{{ codePasswordActive ? t("enabled") : t("disabled") }}</small></div>
          <InputCheck :modelValue="codePasswordActive" @update:modelValue="toggleCodePassword" />
        </div>
        <button class="security-row" type="button" @click="open2FA">
          <span class="row-icon"><svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></svg></span>
          <div><strong>{{ t("two_factor_auth") }}</strong><small>{{ checking2FA ? `${t('loading')}...` : twoFactorActive ? t("2fa_enabled") : t("setup_2fa") }}</small></div>
          <span class="row-arrow">›</span>
        </button>
        <div class="security-row">
          <span class="row-icon"><svg viewBox="0 0 24 24"><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z"/><path d="m4 4 16 16"/></svg></span>
          <div><strong>{{ t("hide_balance") }}</strong><small>{{ hideBalanceActive ? t("enabled") : t("disabled") }}</small></div>
          <InputCheck :modelValue="hideBalanceActive" @update:modelValue="toggleHideBalance" />
        </div>
      </div>
    </section>
  </WalletScreen>
</template>

<style scoped>
.security-intro { min-height: 112px; padding: 18px; display: flex !important; align-items: center; gap: 15px; border-radius: 24px; background: linear-gradient(135deg,#2563eb,#1e40af) !important; box-shadow:0 18px 34px rgba(37,99,235,.24); }
.security-intro__icon { width:58px;height:58px;flex:0 0 58px;display:grid;place-items:center;border-radius:18px;background:rgba(255,255,255,.16); }.security-intro svg,.row-icon svg{width:28px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.security-intro svg{color:#fff}.security-intro strong{color:#fff!important;font-size:19px;font-weight:750}.security-intro p{margin:5px 0 0;color:#dbeafe!important;font-size:13px}
.security-section { display:grid!important; gap:9px; }.security-section h2{margin:0 4px;color:var(--screen-muted)!important;font-size:12px;letter-spacing:.1em;text-transform:uppercase;font-weight:800}.security-card{overflow:hidden;border:1px solid var(--screen-border);border-radius:22px;background:var(--screen-card)!important;box-shadow:0 12px 30px rgba(15,23,42,.07)}
.security-row{width:100%;min-height:78px;padding:12px 14px;display:grid!important;grid-template-columns:48px minmax(0,1fr) auto;align-items:center;gap:12px;border-bottom:1px solid var(--screen-border);background:transparent!important;text-align:left}.security-row:last-child{border:0}.row-icon{width:46px;height:46px;display:grid;place-items:center;border-radius:15px;background:var(--screen-soft);color:var(--screen-primary)!important;font-size:23px}.row-icon--telegram{transform:rotate(-18deg)}.security-row strong{display:block;color:var(--screen-text)!important;font-size:16px;font-weight:680}.security-row small{display:block;margin-top:3px;color:var(--screen-muted)!important;font-size:12px}.row-arrow{color:var(--screen-muted)!important;font-size:32px}.status-dot{width:12px;height:12px;border-radius:50%;background:var(--screen-success);box-shadow:0 0 0 5px color-mix(in srgb,var(--screen-success) 16%,transparent)}
</style>
