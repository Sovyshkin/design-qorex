<template>
  <div class="require-2fa">
    <div class="card">
      <div class="icon-wrap"><img src="/assets/safety.svg" alt="Security" class="security-icon" /></div>
      <h2>{{ t('require_2fa_title') }}</h2>
      <p>{{ t('require_2fa_description') }}</p>
      <div class="actions">
        <button class="btn-primary" @click="goToSecurity">{{ t('enable_2fa') }}</button>
        <button class="btn-secondary" @click="goBack">{{ t('go_back') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
const { t } = useI18n();
const router = useRouter();
const goToSecurity = () => router.push({ name: 'twoFactorAuth', query: { from: 'transfer' } });
const goBack = () => router.back();
</script>

<style scoped>
.require-2fa { min-height: 100vh; background: #f1f5f9; padding: 16px; display: grid; place-items: center; }
.card { width: 100%; max-width: 380px; background: #fff; border: 1px solid #e2e8f0; border-radius: 24px; box-shadow: 0 10px 26px rgba(15,23,42,.08); padding: 24px; text-align: center; }
.icon-wrap { width: 88px; height: 88px; border-radius: 50%; background: #dbeafe; display: grid; place-items: center; margin: 0 auto 14px; }
.security-icon { width: 44px; }
h2 { margin: 0 0 8px; color: #0f172a; font-size: 22px; font-weight: 600; }
p { margin: 0 0 16px; color: #64748b; }
.actions { display: grid; gap: 10px; }
.btn-primary, .btn-secondary { min-height: 50px; border-radius: 14px; font-weight: 600; }
.btn-primary { background: linear-gradient(135deg, #2563eb, #1e40af); color: #fff; }
.btn-secondary { background: #fff; border: 1px solid #e2e8f0; color: #1e40af; }

:global(.dark-theme) .require-2fa {
  background:
    radial-gradient(720px 320px at 50% -18%, rgba(37, 98, 235, 0.18), transparent 62%),
    linear-gradient(180deg, #07111f 0%, #0d1b2a 100%) !important;
  padding-bottom: 112px;
}

:global(.dark-theme) .card {
  background: rgba(30, 39, 59, 0.96) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.34) !important;
}

:global(.dark-theme) .icon-wrap {
  background: rgba(37, 98, 235, 0.18) !important;
}

:global(.dark-theme) .security-icon {
  filter: brightness(0) invert(1);
  opacity: 0.92;
}

:global(.dark-theme) h2 {
  color: #ffffff !important;
}

:global(.dark-theme) p {
  color: #cbd5e1 !important;
}

:global(.dark-theme) .btn-primary {
  background: linear-gradient(135deg, #2562eb, #3882fa) !important;
  color: #ffffff !important;
  box-shadow: 0 14px 30px rgba(37, 98, 235, 0.28) !important;
}

:global(.dark-theme) .btn-secondary {
  background: rgba(30, 39, 59, 0.78) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  color: #ffffff !important;
}
</style>
