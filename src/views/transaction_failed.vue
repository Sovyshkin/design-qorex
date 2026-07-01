<script setup>
import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useWalletStore } from "@/stores/walletStore.ts";

const router = useRouter();
const walletStore = useWalletStore();
const { t } = useI18n();

const isDark = computed(() => {
  if (typeof document !== "undefined") {
    return document.body.classList.contains("dark-theme");
  }
  return !!walletStore.isDarkTheme;
});

const errorMessage = computed(
  () =>
    walletStore.transactionErrorMessage ||
    walletStore.errMessage ||
    t("failed_text")
);

const errorHint = computed(() => {
  const message = String(errorMessage.value || "").toLowerCase();

  if (message.includes("network") || message.includes("подключ")) {
    return t("network_error");
  }

  if (message.includes("qr")) {
    return t("invalid_qr_code");
  }

  if (message.includes("недостаточно") || message.includes("insufficient")) {
    return t("insufficient_funds");
  }

  return t("failed_text");
});

const goHome = () => router.push({ name: "main" });
const goHistory = () => router.push({ name: "history" });

const pageStyle = computed(() => ({
  minHeight: "100vh",
  background: isDark.value
    ? "radial-gradient(720px 320px at 50% -18%, rgba(37, 98, 235, 0.18), transparent 62%), linear-gradient(180deg, #07111f 0%, #0d1b2a 100%)"
    : "radial-gradient(560px 220px at 50% -16%, rgba(59, 130, 246, 0.18), transparent 70%), #f1f5f9",
}));

const backButtonStyle = computed(() => ({
  border: isDark.value
    ? "1px solid rgba(255,255,255,0.08)"
    : "1px solid #e2e8f0",
  borderRadius: "14px",
  background: isDark.value ? "rgba(30, 39, 59, 0.94)" : "#ffffff",
  boxShadow: isDark.value
    ? "0 14px 28px rgba(0,0,0,0.32)"
    : "0 10px 24px rgba(15, 23, 42, 0.08)",
  display: "grid",
  placeItems: "center",
}));

const surfaceStyle = computed(() => ({
  background: isDark.value ? "rgba(30, 39, 59, 0.96)" : "#ffffff",
  border: isDark.value
    ? "1px solid rgba(255,255,255,0.08)"
    : "1px solid #e2e8f0",
  boxShadow: isDark.value
    ? "0 14px 28px rgba(0,0,0,0.32)"
    : "0 14px 28px rgba(15,23,42,0.08)",
}));

const primaryTextStyle = computed(() => ({
  color: isDark.value ? "#ffffff" : "#0f172a",
}));

const secondaryTextStyle = computed(() => ({
  color: isDark.value ? "#94a3b8" : "#64748b",
}));

const secondaryButtonStyle = computed(() => ({
  background: isDark.value ? "rgba(37, 98, 235, 0.12)" : "#eff6ff",
  color: isDark.value ? "#ffffff" : "#2563eb",
  border: isDark.value
    ? "1px solid rgba(255,255,255,0.08)"
    : "1px solid #dbeafe",
}));

onMounted(() => {
  if (!walletStore.transactionErrorMessage && !walletStore.errMessage) {
    walletStore.transactionErrorMessage = t("failed_text");
  }
});
</script>

<template>
  <div class="failed-page" :style="pageStyle">
    <header class="failed-header">
      <button class="back-button" type="button" :style="backButtonStyle" @click="goHome">
        <img
          class="arrow"
          src="@/assets/arrow-left.svg"
          alt="back"
          :style="{ filter: isDark ? 'brightness(0) invert(1)' : 'none' }"
        />
      </button>
      <h1 :style="primaryTextStyle">{{ t("failed_payment") }}</h1>
      <div class="header-spacer"></div>
    </header>

    <main class="failed-content">
      <section class="failed-hero" :style="surfaceStyle">
        <div class="failed-hero__icon">!</div>
        <div class="failed-hero__text">
          <span class="failed-hero__eyebrow">{{ t("error") }}</span>
          <h2 :style="primaryTextStyle">{{ t("failed_payment") }}</h2>
          <p :style="secondaryTextStyle">{{ errorHint }}</p>
        </div>
      </section>

      <section class="failed-card" :style="surfaceStyle">
        <div class="failed-card__row">
          <span class="failed-card__label" :style="secondaryTextStyle">{{ t("error") }}</span>
          <strong :style="primaryTextStyle">{{ errorMessage }}</strong>
        </div>

        <p class="failed-card__description" :style="secondaryTextStyle">
          {{ t("failed_text") }}
        </p>

        <div class="failed-actions">
          <button class="cta cta-primary" type="button" @click="goHome">
            {{ t("go_back") }}
          </button>
          <button
            class="cta cta-secondary"
            type="button"
            :style="secondaryButtonStyle"
            @click="goHistory"
          >
            {{ t("history") }}
          </button>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.failed-page {
  min-height: 100vh;
  background:
    radial-gradient(560px 220px at 50% -16%, rgba(59, 130, 246, 0.18), transparent 70%),
    #f1f5f9;
}

.failed-header {
  padding: 16px;
  display: grid;
  grid-template-columns: 44px 1fr 44px;
  align-items: center;
  gap: 12px;
}

.back-button,
.header-spacer {
  width: 44px;
  height: 44px;
}

.back-button {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  display: grid;
  place-items: center;
}

.arrow {
  width: 18px;
  height: 18px;
}

h1 {
  margin: 0;
  text-align: center;
  color: #0f172a;
  font-size: 22px;
  font-weight: 600;
}

.failed-content {
  padding: 8px 16px 124px;
  display: grid;
  gap: 16px;
}

.failed-hero,
.failed-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
}

.failed-hero {
  padding: 20px;
  display: grid;
  grid-template-columns: 68px 1fr;
  gap: 16px;
  align-items: center;
}

.failed-hero__icon {
  width: 68px;
  height: 68px;
  border-radius: 22px;
  background: linear-gradient(135deg, #ef4444, #f97316);
  color: #ffffff;
  display: grid;
  place-items: center;
  font-size: 34px;
  font-weight: 700;
}

.failed-hero__eyebrow {
  display: inline-flex;
  margin-bottom: 6px;
  color: #ef4444;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.failed-hero__text h2 {
  margin: 0 0 6px;
  color: #0f172a;
  font-size: 24px;
  font-weight: 600;
}

.failed-hero__text p,
.failed-card__description {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.55;
}

.failed-card {
  padding: 20px;
  display: grid;
  gap: 16px;
}

.failed-card__row {
  display: grid;
  gap: 8px;
}

.failed-card__label {
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.failed-card__row strong {
  color: #0f172a;
  font-size: 18px;
  line-height: 1.45;
}

.failed-actions {
  display: grid;
  gap: 12px;
}

.cta {
  min-height: 52px;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 600;
}

.cta-primary {
  background: linear-gradient(135deg, #2563eb, #1e40af);
  color: #ffffff;
}

.cta-secondary {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #dbeafe;
}

:global(.dark-theme) .failed-page {
  background:
    radial-gradient(720px 320px at 50% -18%, rgba(37, 98, 235, 0.18), transparent 62%),
    linear-gradient(180deg, #07111f 0%, #0d1b2a 100%) !important;
}

:global(.dark-theme) .back-button,
:global(.dark-theme) .failed-hero,
:global(.dark-theme) .failed-card {
  background: rgba(30, 39, 59, 0.94) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.32) !important;
}

:global(.dark-theme) h1,
:global(.dark-theme) .failed-hero__text h2,
:global(.dark-theme) .failed-card__row strong {
  color: #ffffff !important;
}

:global(.dark-theme) .failed-hero__text p,
:global(.dark-theme) .failed-card__description,
:global(.dark-theme) .failed-card__label {
  color: #94a3b8 !important;
}

:global(.dark-theme) .arrow {
  filter: brightness(0) invert(1);
}

:global(.dark-theme) .cta-secondary {
  background: rgba(37, 98, 235, 0.12) !important;
  color: #ffffff !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
}
</style>
