<template>
  <section class="require-2fa-view">
    <div class="require-2fa-view__card">
      <div class="require-2fa-view__icon">
        <img :src="safetyIcon" alt="Security" class="require-2fa-view__icon-image" />
      </div>

      <h2 class="require-2fa-view__title">{{ t("require_2fa_title") }}</h2>
      <p class="require-2fa-view__text">{{ t("require_2fa_description") }}</p>

      <div class="require-2fa-view__actions">
        <button class="require-2fa-view__button require-2fa-view__button--primary" @click="goToSecurity">
          {{ t("enable_2fa") }}
        </button>
        <button class="require-2fa-view__button require-2fa-view__button--secondary" @click="goBack">
          {{ t("go_back") }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import safetyIcon from "@/assets/safety.svg";

const props = defineProps({
  from: {
    type: String,
    default: "",
  },
});

const { t } = useI18n();
const router = useRouter();
const route = useRoute();

const fromRoute = computed(() => {
  if (props.from) return props.from;
  if (typeof route.name === "string" && route.name) return route.name;
  return "profile";
});

const goToSecurity = () =>
  router.push({ name: "twoFactorAuth", query: { from: fromRoute.value } });

const goBack = () => router.back();
</script>

<style scoped>
.require-2fa-view {
  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 24px 16px calc(132px + env(safe-area-inset-bottom));
  background:
    radial-gradient(820px 360px at 50% -18%, #dbeafe 0%, transparent 62%),
    #f1f5f9;
}

.require-2fa-view__card {
  width: min(100%, 380px);
  display: grid;
  justify-items: center;
  gap: 14px;
  padding: 28px 22px;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08);
  text-align: center;
}

.require-2fa-view__icon {
  width: 84px;
  height: 84px;
  display: grid;
  place-items: center;
  border-radius: 28px;
  background: linear-gradient(135deg, #dbeafe, #eff6ff);
}

.require-2fa-view__icon-image {
  width: 42px;
  height: 42px;
  filter: invert(33%) sepia(83%) saturate(1750%) hue-rotate(211deg) brightness(96%) contrast(95%);
}

.require-2fa-view__title {
  margin: 0;
  font-size: 24px;
  line-height: 29px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #0f172a;
}

.require-2fa-view__text {
  max-width: 320px;
  margin: 0;
  font-size: 15px;
  line-height: 22px;
  font-weight: 600;
  color: #64748b;
}

.require-2fa-view__actions {
  width: 100%;
  display: grid;
  gap: 10px;
  margin-top: 6px;
}

.require-2fa-view__button {
  width: 100%;
  min-height: 56px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  font-size: 16px;
  line-height: 20px;
  font-weight: 800;
  transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
}

.require-2fa-view__button:active {
  transform: scale(0.985);
}

.require-2fa-view__button--primary {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #ffffff;
  box-shadow: 0 18px 32px rgba(37, 99, 235, 0.24);
}

.require-2fa-view__button--secondary {
  background: #ffffff;
  border: 1px solid #dbe3ef;
  color: #1e40af;
}

:global(.dark-theme) .require-2fa-view {
  background:
    radial-gradient(760px 340px at 50% -16%, rgba(37, 98, 235, 0.16), transparent 62%),
    linear-gradient(180deg, #07111f 0%, #0d1b2a 100%) !important;
}

:global(.dark-theme) .require-2fa-view__card {
  background: rgba(30, 39, 59, 0.96) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.28) !important;
}

:global(.dark-theme) .require-2fa-view__icon {
  background: rgba(37, 98, 235, 0.18) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
}

:global(.dark-theme) .require-2fa-view__icon-image {
  filter: brightness(0) invert(1) !important;
}

:global(.dark-theme) .require-2fa-view__title {
  color: #ffffff !important;
}

:global(.dark-theme) .require-2fa-view__text {
  color: #94a3b8 !important;
}

:global(.dark-theme) .require-2fa-view__button--primary {
  background: linear-gradient(135deg, #2562eb, #3882fa) !important;
  color: #ffffff !important;
}

:global(.dark-theme) .require-2fa-view__button--secondary {
  background: rgba(13, 27, 42, 0.58) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  color: #ffffff !important;
}
</style>
