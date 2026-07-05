<script setup>
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useWalletStore } from "@/stores/walletStore.ts";
import BackButton from "@/components/ui/BackButton.vue";

defineProps({ standalone: { type: Boolean, default: false } });
const emit = defineEmits(["back", "completed"]);
const { t } = useI18n();
const walletStore = useWalletStore();
const phase = ref("loading");
const qrImage = ref("");
const authKey = ref("");
const code = ref("");
const submitting = ref(false);
const error = ref("");
const qrSource = computed(() => qrImage.value ? `data:image/png;base64,${qrImage.value}` : "");

const initialize = async () => {
  phase.value = "loading";
  error.value = "";
  try {
    const result = await walletStore.enable2FA();
    if (!result?.success || !result?.qrImage || !result?.key) throw new Error(result?.detail || t("2fa_setup_failed"));
    qrImage.value = result.qrImage;
    authKey.value = result.key;
    phase.value = "setup";
  } catch (cause) {
    error.value = cause?.message || t("error_occurred");
    phase.value = "error";
  }
};
const normalizeCode = () => code.value = code.value.replace(/\D/g, "").slice(0, 6);
const verify = async () => {
  if (code.value.length !== 6 || submitting.value) return;
  submitting.value = true;
  try {
    const ok = await walletStore.verify2FACode(code.value);
    if (!ok) return;
    phase.value = "success";
  } finally { submitting.value = false; }
};
const openAuthenticator = () => { if (authKey.value) window.location.href = authKey.value; };
const copyKey = async () => { await navigator.clipboard.writeText(authKey.value); walletStore.showMessage(t("copied"), "success", 1500); };
onMounted(initialize);
</script>

<template>
  <div class="secure-setup" :class="{ 'is-dark': walletStore.isDarkTheme }">
    <header class="secure-setup__header">
      <BackButton @click="emit('back')" />
      <h1>{{ t("two_factor_auth") }}</h1>
      <span />
    </header>
    <main class="secure-setup__body">
      <section v-if="phase==='loading'" class="secure-state"><span class="secure-spinner"/><h2>{{t('loading')}}...</h2></section>
      <section v-else-if="phase==='error'" class="secure-state"><span class="secure-error">!</span><h2>{{t('error_occurred')}}</h2><p>{{error}}</p><button class="secure-primary" @click="initialize">{{t('try_again')}}</button></section>
      <section v-else-if="phase==='success'" class="secure-state"><span class="secure-success">✓</span><h2>{{t('2fa_enabled_success')}}</h2><button class="secure-primary" @click="emit('completed')">{{t('continue')}}</button></section>
      <template v-else>
        <section class="secure-card">
          <span class="secure-card__step">01</span><h2>{{t('setup_2fa')}}</h2>
          <ol><li>{{t('install_authenticator') || 'Установите Google Authenticator или аналогичное приложение'}}</li><li>{{t('scan_qr_code') || 'Отсканируйте QR-код или откройте его в приложении'}}</li><li>{{t('enter_6_digit_code')}}</li></ol>
        </section>
        <section class="secure-card secure-card--center">
          <span class="secure-card__step">02</span><div class="secure-qr"><img :src="qrSource" alt="2FA QR code"></div>
          <button class="secure-secondary" @click="openAuthenticator">{{t('open_in_app') || 'Открыть в приложении'}}</button>
          <button class="secure-key" @click="copyKey"><span>{{authKey}}</span><b>▣</b></button>
        </section>
        <section class="secure-card">
          <span class="secure-card__step">03</span><h2>{{t('enter_2fa_code')}}</h2><input v-model="code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="••••••" @input="normalizeCode">
          <button class="secure-primary" :disabled="code.length!==6||submitting" @click="verify">{{submitting?`${t('loading')}...`:t('continue')}}</button>
        </section>
      </template>
    </main>
  </div>
</template>

<style scoped>
.secure-setup{--s-bg:#f1f5f9;--s-card:#fff;--s-soft:#eff6ff;--s-text:#0f172a;--s-muted:#64748b;--s-border:#e2e8f0;--s-primary:#2563eb;display:block!important;width:100%;min-height:100vh;min-height:100dvh;position:relative;z-index:5;overflow-x:hidden;background:radial-gradient(640px 280px at 50% -12%,#dbeafe,transparent 68%),var(--s-bg)!important;color:var(--s-text)!important;opacity:1!important;visibility:visible!important;transform:none!important}.secure-setup__header{min-height:78px;padding:max(14px,env(safe-area-inset-top)) 16px 10px;display:grid!important;grid-template-columns:48px minmax(0,1fr) 48px;align-items:center;gap:8px;background:transparent!important}.secure-setup__header h1{margin:0;color:var(--s-text)!important;font-size:clamp(21px,6vw,27px);line-height:1.15;font-weight:750;text-align:center}.secure-setup__body{width:100%;padding:8px 16px calc(42px + env(safe-area-inset-bottom));display:grid!important;gap:14px;background:transparent!important}
.secure-card,.secure-state{width:100%;padding:20px;display:block!important;border:1px solid var(--s-border);border-radius:24px;background:var(--s-card)!important;box-shadow:0 14px 34px rgba(15,23,42,.08);opacity:1!important;visibility:visible!important;transform:none!important}.secure-card__step{display:inline-grid;place-items:center;min-width:42px;height:30px;margin-bottom:13px;border-radius:10px;background:var(--s-soft);color:var(--s-primary)!important;font-size:12px;font-weight:800}.secure-card h2,.secure-state h2{margin:0 0 12px;color:var(--s-text)!important;font-size:20px;font-weight:750}.secure-card ol{padding-left:25px;display:grid!important;gap:12px}.secure-card li{list-style:decimal;color:var(--s-muted)!important;font-size:14px;line-height:1.45;font-weight:550}.secure-card li::marker{color:var(--s-primary);font-weight:800}.secure-card--center{text-align:center}.secure-qr{width:min(240px,100%);aspect-ratio:1;margin:0 auto 14px;padding:14px;display:grid!important;place-items:center;border:1px solid var(--s-border);border-radius:22px;background:#fff!important}.secure-qr img{display:block!important;width:100%;height:100%;object-fit:contain;opacity:1!important;visibility:visible!important}.secure-secondary,.secure-primary{width:100%;min-height:54px;padding:0 16px;border-radius:16px;font-weight:750}.secure-secondary{background:var(--s-soft)!important;color:var(--s-primary)!important}.secure-primary{background:linear-gradient(135deg,#2563eb,#3b82f6)!important;color:#fff!important;box-shadow:0 14px 28px rgba(37,99,235,.22)}.secure-primary:disabled{opacity:.45}.secure-key{width:100%;margin-top:9px;padding:12px;display:grid!important;grid-template-columns:minmax(0,1fr) 30px;gap:8px;border:1px solid var(--s-border);border-radius:14px;background:var(--s-soft)!important}.secure-key span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--s-muted)!important;font-size:11px}.secure-key b{color:var(--s-primary)!important}.secure-card input{width:100%;height:58px;margin-bottom:12px;border:1px solid var(--s-border)!important;border-radius:16px;background:var(--s-soft)!important;color:var(--s-text)!important;font-size:24px;font-weight:750;letter-spacing:.32em;text-align:center}.secure-state{min-height:300px;display:flex!important;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center}.secure-state p{color:var(--s-muted)!important}.secure-spinner{width:42px;height:42px;border:4px solid var(--s-border);border-top-color:var(--s-primary);border-radius:50%;animation:secure-spin .8s linear infinite}.secure-error,.secure-success{width:64px;height:64px;display:grid;place-items:center;border-radius:20px;font-size:32px;font-weight:800}.secure-error{background:#fee2e2;color:#ef4444!important}.secure-success{background:#d1fae5;color:#10b981!important}
.secure-setup.is-dark{--s-bg:#0d1b2a;--s-card:#1e273b;--s-soft:#17243a;--s-text:#fff;--s-muted:#94a3b8;--s-border:rgba(255,255,255,.08);background:radial-gradient(680px 300px at 50% -14%,rgba(37,98,235,.2),transparent 66%),linear-gradient(180deg,#07111f,#0d1b2a)!important}.secure-setup.is-dark .secure-setup__header,.secure-setup.is-dark .secure-setup__body{background:transparent!important}@keyframes secure-spin{to{transform:rotate(360deg)}}
</style>
