<script setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import AutoScrollPills from "@/components/ui/AutoScrollPills.vue";
import BackButton from "@/components/ui/BackButton.vue";

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
      <BackButton @click="router.back()" />
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
.faq-page { width: 100%; max-width: 100%; min-height: 100vh; min-height: 100dvh; overflow-x: hidden; padding: 16px 16px calc(176px + env(safe-area-inset-bottom)); background: radial-gradient(820px 360px at 50% -18%, #dbeafe 0%, #f1f5f9 58%); display: grid; align-content: start; gap: 16px; }
.page-header { width: 100%; min-width: 0; display: grid; grid-template-columns: 44px minmax(0, 1fr) 44px; align-items: center; gap: 8px; margin-bottom: 2px; }
.page-header div:nth-child(2) { min-width: 0; max-width: 100%; text-align: center; overflow: hidden; }
.page-header span { color: #64748b; font-size: 12px; line-height: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; }
h1 { margin: 2px 0 0; color: #0f172a; font-size: 22px; line-height: 26px; font-weight: 750; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.header-spacer { width: 44px; height: 44px; }
.hero-card { width: 100%; min-width: 0; position: relative; overflow: hidden; border-radius: 24px; padding: 18px; color: #fff; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); box-shadow: 0 18px 34px rgba(37,99,235,.24); display: grid; grid-template-columns: minmax(0,1fr) 58px; gap: 10px; align-items: center; }
.hero-card::after { content: ""; position: absolute; width: 150px; height: 150px; right: -64px; bottom: -78px; border-radius: 50%; background: rgba(255,255,255,.14); }
.hero-copy { min-width: 0; position: relative; z-index: 1; }
.hero-copy span { color: rgba(255,255,255,.72); font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; }
.hero-copy h2 { max-width: 100%; margin: 8px 0 6px; font-size: 22px; line-height: 27px; font-weight: 750; overflow-wrap: anywhere; }
.hero-copy p { max-width: 100%; margin: 0; color: rgba(255,255,255,.82); font-size: 14px; line-height: 20px; font-weight: 500; overflow-wrap: anywhere; }
.hero-badge { position: relative; z-index: 1; width: 54px; height: 54px; border-radius: 20px; display: grid; place-items: center; background: rgba(255,255,255,.16); box-shadow: inset 0 1px 0 rgba(255,255,255,.22); font-size: 30px; line-height: 1; font-weight: 850; }
.tips { width: 100%; min-width: 0; overflow: hidden; }
.faq-list { width: 100%; min-width: 0; display: grid; gap: 10px; }
.faq-item { width: 100%; min-width: 0; border: 1px solid #e2e8f0; border-radius: 20px; background: rgba(255,255,255,.94); box-shadow: 0 10px 24px rgba(15,23,42,.06); padding: 16px; text-align: left; overflow: hidden; transition: border-color .18s ease, transform .18s ease; }
.faq-item:active { transform: scale(.99); }
.faq-item.active { border-color: #bfdbfe; background: #fff; }
.question { min-width: 0; display: grid; grid-template-columns: minmax(0,1fr) 28px; align-items: center; gap: 10px; }
.question strong { min-width: 0; color: #0f172a; font-size: 15px; line-height: 20px; font-weight: 750; white-space: normal; overflow-wrap: anywhere; }
.question b { width: 28px; height: 28px; border-radius: 10px; display: grid; place-items: center; color: #2563eb; background: #eff6ff; font-size: 20px; line-height: 1; font-weight: 700; }
.faq-item p { max-width: 100%; margin: 12px 0 0; padding-top: 12px; border-top: 1px solid #eef2f7; color: #64748b; font-size: 14px; line-height: 21px; font-weight: 500; white-space: normal; overflow-wrap: anywhere; }
.support-btn { min-height: 52px; border: 0; border-radius: 18px; color: #fff; background: linear-gradient(135deg, #2563eb, #1e40af); box-shadow: 0 14px 28px rgba(37,99,235,.24); font-size: 15px; font-weight: 750; }

:global(.dark-theme) .faq-page {
  background: #0d1b2a !important;
}

:global(.dark-theme) h1,
:global(.dark-theme) .question strong {
  color: #ffffff !important;
}

:global(.dark-theme) .page-header span,
:global(.dark-theme) .faq-item p {
  color: #94a3b8 !important;
}

:global(.dark-theme) .faq-item {
  background: rgba(30, 39, 59, 0.96) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.34) !important;
}

:global(.dark-theme) .faq-item.active {
  background: rgba(37, 98, 235, 0.18) !important;
  border-color: rgba(56, 130, 250, 0.42) !important;
}

:global(.dark-theme) .question b {
  background: rgba(37, 98, 235, 0.2) !important;
  color: #ffffff !important;
}

:global(.dark-theme) .faq-item p {
  border-top-color: rgba(255, 255, 255, 0.08) !important;
}

@media (max-width: 380px) {
  .faq-page {
    padding-inline: 12px;
  }

  h1 {
    font-size: 20px;
    line-height: 24px;
  }

  .hero-card {
    grid-template-columns: minmax(0, 1fr);
  }

  .hero-badge {
    display: none;
  }

  .hero-copy h2 {
    font-size: 20px;
    line-height: 25px;
  }
}
</style>
