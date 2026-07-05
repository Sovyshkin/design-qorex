<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useWalletStore } from "../../stores/walletStore.ts";
import BackButton from "@/components/ui/BackButton.vue";

const { t } = useI18n();
const router = useRouter();
const walletStore = useWalletStore();

const documents = computed(() => [
  {
    name: "AML",
    slug: "aml",
    icon: "shield",
    subtitle: t("info_aml_subtitle"),
  },
  {
    name: t("terms_of_use"),
    slug: "terms_of_use",
    icon: "file",
    subtitle: t("info_terms_subtitle"),
  },
  {
    name: t("privacy_policy"),
    slug: "privacy_policy",
    icon: "lock",
    subtitle: t("info_privacy_subtitle"),
  },
]);

const iconPaths = {
  shield: '<path d="M12 4.25 18.25 7v4.8c0 3.2-2.55 5.9-6.25 7.95-3.7-2.05-6.25-4.75-6.25-7.95V7z"/><path d="m9.25 12.2 1.8 1.8 3.95-4.2"/>',
  file: '<path d="M7 4.75h6.2l3.8 3.8v10.7H7z"/><path d="M13 4.9v4h4"/><path d="M9.75 12.25h4.5M9.75 15.25h3.25"/>',
  lock: '<rect x="6.25" y="10.25" width="11.5" height="8" rx="2"/><path d="M8.75 10.25V8.5a3.25 3.25 0 0 1 6.5 0v1.75"/><path d="M12 13.4v1.7"/>',
};
</script>

<template>
  <main class="info-page" :class="{ 'is-dark': walletStore.isDarkTheme }">
    <header class="page-header">
      <BackButton @click="walletStore.goBack()" />
      <div>
        <h1>{{ t("info") }}</h1>
        <p>{{ t("info_header_subtitle") }}</p>
      </div>
      <div class="header-spacer"></div>
    </header>

    <section class="hero-card">
      <div class="hero-icon">i</div>
      <h2>{{ t("info_hero_title") }}</h2>
      <p>{{ t("info_hero_text") }}</p>
    </section>

    <section class="document-list" aria-label="Documents">
      <button
        v-for="item in documents"
        :key="item.slug"
        class="document-card"
        type="button"
        @click="router.push({ name: 'info_detail', params: { slug: item.slug } })"
      >
        <i><svg viewBox="0 0 24 24" aria-hidden="true" v-html="iconPaths[item.icon]"></svg></i>
        <span>
          <strong>{{ item.name }}</strong>
          <small>{{ item.subtitle }}</small>
        </span>
        <b>›</b>
      </button>
    </section>
  </main>
</template>

<style scoped>
.info-page { min-height: 100vh; padding: 20px 16px 124px; background: radial-gradient(820px 360px at 50% -18%, #dbeafe 0%, #f1f5f9 58%); display: grid; align-content: start; gap: 20px; }
.page-header { display: grid; grid-template-columns: 44px 1fr 44px; align-items: center; gap: 12px; margin-bottom: 4px; }
.page-header div:nth-child(2) { text-align: center; min-width: 0; }
h1 { margin: 0; color: #0f172a; font-size: 20px; line-height: 24px; font-weight: 700; }
.page-header p { margin: 4px 0 0; color: #64748b; font-size: 12px; line-height: 16px; font-weight: 600; letter-spacing: .02em; }
.header-spacer { width: 44px; height: 44px; }
.hero-card { position: relative; overflow: hidden; border-radius: 24px; padding: 20px; color: #fff; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); box-shadow: 0 18px 34px rgba(37,99,235,.24); }
.hero-card::after { content: ""; position: absolute; width: 170px; height: 170px; right: -70px; top: -70px; border-radius: 50%; background: rgba(255,255,255,.16); }
.hero-icon { width: 44px; height: 44px; border-radius: 16px; display: grid; place-items: center; background: rgba(255,255,255,.16); color: #fff; font-size: 22px; font-weight: 800; }
.hero-card h2 { margin: 16px 0 6px; color: #fff; font-size: 22px; line-height: 26px; font-weight: 700; }
.hero-card p { margin: 0; max-width: 290px; color: rgba(255,255,255,.82); font-size: 14px; line-height: 20px; }
.document-list { display: grid; gap: 10px; }
.document-card { min-height: 74px; width: 100%; border: 1px solid #e2e8f0; border-radius: 22px; background: rgba(255,255,255,.94); box-shadow: 0 10px 24px rgba(15,23,42,.06); padding: 12px; display: grid; grid-template-columns: 46px minmax(0,1fr) 20px; gap: 12px; align-items: center; text-align: left; transition: transform .18s ease, background-color .18s ease; }
.document-card:active { transform: scale(.99); background: #f8fafc; }
.document-card i { width: 46px; height: 46px; border-radius: 16px; display: grid; place-items: center; color: #2563eb; background: linear-gradient(135deg, #eff6ff, #dbeafe); box-shadow: inset 0 1px 0 rgba(255,255,255,.9); }
.document-card svg { width: 23px; height: 23px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
.document-card svg * { fill: none !important; stroke: currentColor !important; }
.document-card span { min-width: 0; display: grid; gap: 4px; }
.document-card strong { color: #0f172a; font-size: 16px; line-height: 20px; font-weight: 700; }
.document-card small { color: #64748b; font-size: 13px; line-height: 17px; font-weight: 500; }
.document-card b { color: #94a3b8; font-size: 26px; line-height: 1; font-weight: 500; }

.info-page.is-dark {
  background:
    radial-gradient(720px 320px at 50% -16%, rgba(37, 98, 235, 0.2), transparent 62%),
    linear-gradient(180deg, #07111f 0%, #0d1b2a 100%) !important;
}

.info-page.is-dark .page-header {
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
  outline: 0 !important;
}

.info-page.is-dark .page-header h1 {
  color: #ffffff !important;
}

.info-page.is-dark .page-header p {
  color: #94a3b8 !important;
}

.info-page.is-dark .document-card {
  background: rgba(30, 39, 59, 0.96) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 16px 30px rgba(0, 0, 0, 0.3) !important;
}

.info-page.is-dark .document-card:active {
  background: rgba(37, 52, 78, 0.98) !important;
}

.info-page.is-dark .document-card i {
  color: #dbeafe !important;
  background: linear-gradient(135deg, rgba(37, 98, 235, 0.38), rgba(56, 130, 250, 0.22)) !important;
  border: 1px solid rgba(219, 234, 254, 0.55) !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 10px 22px rgba(37, 98, 235, 0.16) !important;
}

.info-page.is-dark .document-card svg,
.info-page.is-dark .document-card svg * {
  color: #ffffff !important;
  stroke: #ffffff !important;
  fill: none !important;
  filter: none !important;
}

.info-page.is-dark .document-card strong {
  color: #ffffff !important;
}

.info-page.is-dark .document-card small {
  color: #94a3b8 !important;
}

.info-page.is-dark .document-card b {
  color: #ffffff !important;
}

.info-page.is-dark .hero-card h2,
.info-page.is-dark .hero-card p,
.info-page.is-dark .hero-icon {
  color: #ffffff !important;
}
</style>
