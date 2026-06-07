<script setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import AutoScrollPills from "@/components/ui/AutoScrollPills.vue";

const { t } = useI18n();
const router = useRouter();
const active = ref(0);

const faq = computed(() => [
  {
    question: t("faq_deposit_question"),
    answer: t("faq_deposit_answer"),
  },
  {
    question: t("faq_balance_question"),
    answer: t("faq_balance_answer"),
  },
  {
    question: t("faq_network_question"),
    answer: t("faq_network_answer"),
  },
  {
    question: t("faq_security_question"),
    answer: t("faq_security_answer"),
  },
  {
    question: t("faq_history_question"),
    answer: t("faq_history_answer"),
  },
  {
    question: t("faq_support_question"),
    answer: t("faq_support_answer"),
  },
]);

const quickTips = computed(() => [t("faq_tip_network"), t("faq_tip_hash"), t("faq_tip_2fa")]);

const openSupport = () => {
  window.location.href = "https://t.me/PeekPay_Support_bot";
};
</script>

<template>
  <main class="faq-page">
    <header class="page-header">
      <button class="back-btn" type="button" @click="router.back()">‹</button>
      <div>
        <span>FAQ</span>
        <h1>{{ t("faq") }}</h1>
      </div>
      <div class="header-spacer"></div>
    </header>

    <section class="hero-card">
      <div class="hero-copy">
        <span>{{ t("faq_hero_label") }}</span>
        <h2>{{ t("faq_hero_title") }}</h2>
        <p>{{ t("faq_hero_text") }}</p>
      </div>
      <div class="hero-badge">?</div>
    </section>

    <section class="tips">
      <AutoScrollPills :items="quickTips" :duration="20" />
    </section>

    <section class="faq-list" aria-label="FAQ">
      <button
        v-for="(item, index) in faq"
        :key="item.question"
        class="faq-item"
        :class="{ active: active === index }"
        type="button"
        @click="active = active === index ? -1 : index"
      >
        <span class="question">
          <strong>{{ item.question }}</strong>
          <b>{{ active === index ? "−" : "+" }}</b>
        </span>
        <p v-if="active === index">{{ item.answer }}</p>
      </button>
    </section>

    <button class="support-btn" type="button" @click="openSupport">
      {{ t("faq_support_button") }}
    </button>
  </main>
</template>

<style scoped>
.faq-page { min-height: 100vh; padding: 16px 16px 124px; background: radial-gradient(820px 360px at 50% -18%, #dbeafe 0%, #f1f5f9 58%); display: grid; align-content: start; gap: 14px; }
.page-header { display: grid; grid-template-columns: 44px 1fr 44px; align-items: center; gap: 8px; }
.back-btn { width: 44px; height: 44px; border-radius: 16px; background: #fff; border: 1px solid #e2e8f0; color: #0f172a; font-size: 32px; line-height: 1; box-shadow: 0 10px 24px rgba(15,23,42,.06); }
.page-header div:nth-child(2) { min-width: 0; text-align: center; }
.page-header span { color: #64748b; font-size: 12px; line-height: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; }
h1 { margin: 2px 0 0; color: #0f172a; font-size: 20px; line-height: 24px; font-weight: 750; }
.header-spacer { width: 44px; height: 44px; }
.hero-card { position: relative; overflow: hidden; border-radius: 24px; padding: 20px; color: #fff; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); box-shadow: 0 18px 34px rgba(37,99,235,.24); display: grid; grid-template-columns: minmax(0,1fr) 70px; gap: 12px; align-items: center; }
.hero-card::after { content: ""; position: absolute; width: 150px; height: 150px; right: -64px; bottom: -78px; border-radius: 50%; background: rgba(255,255,255,.14); }
.hero-copy { position: relative; z-index: 1; }
.hero-copy span { color: rgba(255,255,255,.72); font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; }
.hero-copy h2 { margin: 8px 0 6px; font-size: 22px; line-height: 26px; font-weight: 750; }
.hero-copy p { margin: 0; color: rgba(255,255,255,.82); font-size: 14px; line-height: 20px; font-weight: 500; }
.hero-badge { position: relative; z-index: 1; width: 64px; height: 64px; border-radius: 22px; display: grid; place-items: center; background: rgba(255,255,255,.16); box-shadow: inset 0 1px 0 rgba(255,255,255,.22); font-size: 34px; line-height: 1; font-weight: 850; }
.faq-list { display: grid; gap: 10px; }
.faq-item { width: 100%; border: 1px solid #e2e8f0; border-radius: 20px; background: rgba(255,255,255,.94); box-shadow: 0 10px 24px rgba(15,23,42,.06); padding: 16px; text-align: left; transition: border-color .18s ease, transform .18s ease; }
.faq-item:active { transform: scale(.99); }
.faq-item.active { border-color: #bfdbfe; background: #fff; }
.question { display: grid; grid-template-columns: minmax(0,1fr) 28px; align-items: center; gap: 10px; }
.question strong { color: #0f172a; font-size: 15px; line-height: 20px; font-weight: 750; }
.question b { width: 28px; height: 28px; border-radius: 10px; display: grid; place-items: center; color: #2563eb; background: #eff6ff; font-size: 20px; line-height: 1; font-weight: 700; }
.faq-item p { margin: 12px 0 0; padding-top: 12px; border-top: 1px solid #eef2f7; color: #64748b; font-size: 14px; line-height: 21px; font-weight: 500; }
.support-btn { min-height: 52px; border: 0; border-radius: 18px; color: #fff; background: linear-gradient(135deg, #2563eb, #1e40af); box-shadow: 0 14px 28px rgba(37,99,235,.24); font-size: 15px; font-weight: 750; }
</style>
