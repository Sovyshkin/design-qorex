<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import AutoScrollPills from "@/components/ui/AutoScrollPills.vue";
import BackButton from "@/components/ui/BackButton.vue";
import { useWalletStore } from "@/stores/walletStore.ts";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const walletStore = useWalletStore();

const pages = computed(() => ({
  aml: {
    eyebrow: t("info_document_label"),
    title: t("info_aml_title"),
    lead: t("info_aml_lead"),
    highlights: [t("info_aml_highlight_1"), t("info_aml_highlight_2"), t("info_aml_highlight_3")],
    sections: [
      {
        title: t("info_aml_section_1_title"),
        text: t("info_aml_section_1_text"),
      },
      {
        title: t("info_aml_section_2_title"),
        text: t("info_aml_section_2_text"),
      },
      {
        title: t("info_aml_section_3_title"),
        text: t("info_aml_section_3_text"),
      },
    ],
  },
  terms_of_use: {
    eyebrow: t("info_document_label"),
    title: t("terms_of_use"),
    lead: t("info_terms_lead"),
    highlights: [t("info_terms_highlight_1"), t("info_terms_highlight_2"), t("info_terms_highlight_3")],
    sections: [
      {
        title: t("info_terms_section_1_title"),
        text: t("info_terms_section_1_text"),
      },
      {
        title: t("info_terms_section_2_title"),
        text: t("info_terms_section_2_text"),
      },
      {
        title: t("info_terms_section_3_title"),
        text: t("info_terms_section_3_text"),
      },
    ],
  },
  privacy_policy: {
    eyebrow: t("info_document_label"),
    title: t("privacy_policy"),
    lead: t("info_privacy_lead"),
    highlights: [t("info_privacy_highlight_1"), t("info_privacy_highlight_2"), t("info_privacy_highlight_3")],
    sections: [
      {
        title: t("info_privacy_section_1_title"),
        text: t("info_privacy_section_1_text"),
      },
      {
        title: t("info_privacy_section_2_title"),
        text: t("info_privacy_section_2_text"),
      },
      {
        title: t("info_privacy_section_3_title"),
        text: t("info_privacy_section_3_text"),
      },
    ],
  },
}));

const currentPage = computed(() => pages.value[route.params.slug] || pages.value.aml);
</script>

<template>
  <main class="detail-page" :class="{'is-dark':walletStore.isDarkTheme}">
    <header class="page-header">
      <BackButton @click="router.back()" />
      <div>
        <h1>{{ currentPage.title }}</h1>
        <span>{{ currentPage.eyebrow }}</span>
      </div>
      <div class="header-spacer" aria-hidden="true"></div>
    </header>

    <section class="intro-card">
      <p>{{ currentPage.lead }}</p>
      <AutoScrollPills :items="currentPage.highlights" variant="white" :duration="22" />
    </section>

    <section class="content-card" v-for="section in currentPage.sections" :key="section.title">
      <h2>{{ section.title }}</h2>
      <p>{{ section.text }}</p>
    </section>

    <section class="notice-card">
      <strong>{{ t("important") }}</strong>
      <p>{{ t("info_notice_text") }}</p>
    </section>
  </main>
</template>

<style scoped>
.detail-page { min-height: 100vh; padding: 20px 16px 124px; background: radial-gradient(820px 360px at 50% -18%, #dbeafe 0%, #f1f5f9 58%); display: grid; align-content: start; gap: 16px; }
.page-header { width:100%;min-height:72px;display:grid;grid-template-columns:52px minmax(0,1fr) 52px;align-items:center;gap:10px;margin-bottom:4px;background:transparent!important;border:0!important;box-shadow:none!important; }
.page-header div { min-width: 0;text-align:center; }
.page-header span { color: #64748b; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; }
h1 { margin: 0 0 5px; color: #0f172a; font-size: 20px; line-height: 24px; font-weight: 750; overflow-wrap:anywhere; }
.header-spacer{width:52px;height:52px}
.intro-card { border-radius: 24px; padding: 18px; color: #fff; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); box-shadow: 0 18px 34px rgba(37,99,235,.22); display: grid; gap: 14px; }
.intro-card * { color: #fff !important; }
.intro-card p { margin: 0; color: rgba(255,255,255,.88) !important; font-size: 15px; line-height: 22px; font-weight: 500; }
.intro-card :deep(.auto-scroll-pills),.intro-card :deep(.track),.intro-card :deep(.pill-group){background:transparent!important;border:0!important;box-shadow:none!important}
.intro-card :deep(.pill.white){background:rgba(255,255,255,.14)!important;color:#fff!important;border:1px solid rgba(255,255,255,.16)}
.content-card, .notice-card { border-radius: 22px; background: rgba(255,255,255,.94); border: 1px solid #e2e8f0; box-shadow: 0 10px 24px rgba(15,23,42,.06); padding: 16px; }
.content-card h2 { margin: 0 0 8px; color: #0f172a; font-size: 17px; line-height: 22px; font-weight: 750; }
.content-card p, .notice-card p { margin: 0; color: #64748b; font-size: 14px; line-height: 21px; font-weight: 500; }
.notice-card { background: #eff6ff; border-color: #bfdbfe; }
.notice-card strong { display: block; margin-bottom: 6px; color: #1e40af; font-size: 14px; line-height: 18px; font-weight: 800; }
.detail-page.is-dark .page-header{background:transparent!important}
.detail-page.is-dark .page-header h1{color:#fff!important}
.detail-page.is-dark .page-header span{color:#94a3b8!important}
@media(max-width:360px){.detail-page{padding-inline:12px}.page-header{grid-template-columns:48px minmax(0,1fr) 48px;gap:8px}h1{font-size:18px;line-height:22px}.header-spacer{width:48px;height:48px}}
</style>
