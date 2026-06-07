<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const pages = {
  aml: {
    eyebrow: "Compliance",
    title: "AML и безопасность операций",
    lead: "PeekPay использует риск-ориентированный подход, чтобы платежи и переводы оставались безопасными для пользователей.",
    highlights: ["Мониторинг подозрительных операций", "Проверка источников риска", "Защита пользователей от блокировок"],
    sections: [
      {
        title: "Что такое AML",
        text: "AML означает меры против отмывания средств. Для криптокошелька это набор правил, которые помогают выявлять операции с повышенным риском и защищать пользователей от небезопасных переводов.",
      },
      {
        title: "Когда может потребоваться проверка",
        text: "Дополнительная проверка может понадобиться при необычной активности, крупных суммах, частых переводах или признаках связи адреса с рискованными источниками.",
      },
      {
        title: "Как действовать пользователю",
        text: "Проверяйте сеть и адрес перед отправкой, не принимайте средства от неизвестных отправителей и обращайтесь в поддержку, если операция выглядит подозрительно.",
      },
    ],
  },
  terms_of_use: {
    eyebrow: "Rules",
    title: "Условия использования",
    lead: "Эти правила описывают базовые условия работы с PeekPay: кошельком, пополнениями, переводами и функциями безопасности.",
    highlights: ["Ответственное использование сервиса", "Проверка реквизитов перед переводом", "Соблюдение лимитов и требований безопасности"],
    sections: [
      {
        title: "Назначение сервиса",
        text: "PeekPay предоставляет интерфейс для хранения, пополнения и перевода цифровых активов в Telegram Mini App. Пользователь отвечает за корректность введённых адресов, сетей и сумм.",
      },
      {
        title: "Операции и комиссии",
        text: "Перед подтверждением операции важно проверить сумму, валюту, сеть и адрес получателя. Комиссии и сроки обработки могут зависеть от выбранной сети и состояния блокчейна.",
      },
      {
        title: "Ограничения",
        text: "Сервис нельзя использовать для незаконных операций, обхода требований безопасности, мошенничества или действий, которые могут нарушать права других пользователей.",
      },
    ],
  },
  privacy_policy: {
    eyebrow: "Privacy",
    title: "Политика конфиденциальности",
    lead: "PeekPay стремится использовать только необходимые данные и защищать их на уровне, ожидаемом от финансового продукта.",
    highlights: ["Минимум необходимых данных", "Защита доступа к аккаунту", "Прозрачность использования информации"],
    sections: [
      {
        title: "Какие данные используются",
        text: "Для работы кошелька могут использоваться Telegram-идентификатор, имя пользователя, данные аккаунта, история операций и техническая информация, необходимая для безопасности.",
      },
      {
        title: "Зачем это нужно",
        text: "Данные помогают авторизовать пользователя, показывать баланс и историю, выполнять операции, защищать аккаунт и улучшать стабильность Mini App.",
      },
      {
        title: "Как повысить безопасность",
        text: "Используйте PIN-код и 2FA, не передавайте доступ к Telegram, проверяйте адреса переводов и обращайтесь в поддержку при подозрительной активности.",
      },
    ],
  },
};

const currentPage = computed(() => pages[route.params.slug] || pages.aml);
</script>

<template>
  <main class="detail-page">
    <header class="page-header">
      <button class="back-btn" type="button" @click="router.back()">‹</button>
      <div>
        <span>{{ currentPage.eyebrow }}</span>
        <h1>{{ currentPage.title }}</h1>
      </div>
    </header>

    <section class="intro-card">
      <p>{{ currentPage.lead }}</p>
      <div class="chips">
        <span v-for="item in currentPage.highlights" :key="item">{{ item }}</span>
      </div>
    </section>

    <section class="content-card" v-for="section in currentPage.sections" :key="section.title">
      <h2>{{ section.title }}</h2>
      <p>{{ section.text }}</p>
    </section>

    <section class="notice-card">
      <strong>Важно</strong>
      <p>Информация в приложении носит справочный характер. Если вопрос связан с конкретной операцией, лучше обратиться в поддержку PeekPay.</p>
    </section>
  </main>
</template>

<style scoped>
.detail-page { min-height: 100vh; padding: 16px 16px 124px; background: radial-gradient(820px 360px at 50% -18%, #dbeafe 0%, #f1f5f9 58%); display: grid; align-content: start; gap: 12px; }
.page-header { display: grid; grid-template-columns: 44px 1fr; align-items: center; gap: 12px; margin-bottom: 4px; }
.back-btn { width: 44px; height: 44px; border-radius: 16px; background: #fff; border: 1px solid #e2e8f0; color: #0f172a; font-size: 32px; line-height: 1; box-shadow: 0 10px 24px rgba(15,23,42,.06); }
.page-header div { min-width: 0; }
.page-header span { color: #2563eb; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; }
h1 { margin: 3px 0 0; color: #0f172a; font-size: 21px; line-height: 26px; font-weight: 750; }
.intro-card { border-radius: 24px; padding: 18px; color: #fff; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); box-shadow: 0 18px 34px rgba(37,99,235,.22); display: grid; gap: 14px; }
.intro-card p { margin: 0; color: rgba(255,255,255,.88); font-size: 15px; line-height: 22px; font-weight: 500; }
.chips { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 2px; scrollbar-width: none; }
.chips::-webkit-scrollbar { display: none; }
.chips span { flex: 0 0 auto; border-radius: 999px; padding: 8px 10px; background: rgba(255,255,255,.14); color: #fff; font-size: 12px; line-height: 14px; font-weight: 650; }
.content-card, .notice-card { border-radius: 22px; background: rgba(255,255,255,.94); border: 1px solid #e2e8f0; box-shadow: 0 10px 24px rgba(15,23,42,.06); padding: 16px; }
.content-card h2 { margin: 0 0 8px; color: #0f172a; font-size: 17px; line-height: 22px; font-weight: 750; }
.content-card p, .notice-card p { margin: 0; color: #64748b; font-size: 14px; line-height: 21px; font-weight: 500; }
.notice-card { background: #eff6ff; border-color: #bfdbfe; }
.notice-card strong { display: block; margin-bottom: 6px; color: #1e40af; font-size: 14px; line-height: 18px; font-weight: 800; }
</style>
