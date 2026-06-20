<script setup>
import { ref, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useWalletStore } from "@/stores/walletStore";
import ThemeToggle from "@/components/ui/ThemeToggle.vue";

const walletStore = useWalletStore();
const { t } = useI18n();
const router = useRouter();

const params = ref([
  { name: t("safety"), route: "safety", icon: "shield" },
  { name: t("lang"), route: "select_lang", icon: "globe" },
]);

const aboutUs = ref([
  { name: t("official_accounts"), route: "accounts", icon: "sparkle" },
  { name: t("faq"), route: "faq", icon: "question" },
  { name: t("support"), route: "support", icon: "send" },
  { name: t("info"), route: "info", icon: "info" },
]);

const referal = computed(() => [
  { name: t("email_add_profile"), route: "email_add", show: !walletStore.user.email, icon: "mail" },
  { name: t("referal"), route: "referal", show: true, icon: "referral" },
]);

const visibleReferal = computed(() => referal.value.filter((item) => item.show));

const goRoute = (route) => {
  if (route === "support") window.location.href = "https://t.me/PeekPay_Support_bot";
  else router.push({ name: route });
};

const iconPaths = {
  mail: '<path d="M4.75 6.75h14.5v10.5H4.75z"/><path d="m5.5 7.5 6.5 5 6.5-5"/>',
  referral: '<path d="M7 17.25v-1.1a3.4 3.4 0 0 1 3.4-3.4h3.2a3.4 3.4 0 0 1 3.4 3.4v1.1"/><circle cx="12" cy="7.75" r="3"/><path d="M18.25 8.25h2.25m-1.12-1.12v2.25"/>',
  shield: '<path d="M12 4.25 18.25 7v4.8c0 3.2-2.55 5.9-6.25 7.95-3.7-2.05-6.25-4.75-6.25-7.95V7z"/><path d="m9.25 12.2 1.8 1.8 3.95-4.2"/>',
  globe: '<circle cx="12" cy="12" r="7.25"/><path d="M4.75 12h14.5M12 4.75c2 2.1 3 4.5 3 7.25s-1 5.15-3 7.25c-2-2.1-3-4.5-3-7.25s1-5.15 3-7.25z"/>',
  sparkle: '<path d="M12 4.75 13.7 9.8l5.05 1.7-5.05 1.7L12 18.25l-1.7-5.05-5.05-1.7 5.05-1.7z"/><path d="M18.5 4.5v3M20 6h-3"/>',
  question: '<path d="M9.15 8.65a3.15 3.15 0 0 1 5.95 1.45c0 2.35-2.9 2.45-2.9 4.35"/><path d="M12.18 18h.01"/>',
  send: '<path d="M4.75 12.7 19.25 5.5l-4.05 13-3.05-5.15-5.5-1.05z"/><path d="m12.15 13.35 3.45-3.65"/>',
  info: '<circle cx="12" cy="12" r="7.25"/><path d="M12 11.25v4.75"/><path d="M12 8h.01"/>',
};

onMounted(async () => {
  if (walletStore.user?.tg_id && !walletStore.isGettingUser) await walletStore.check2FAStatus();
});
</script>

<template>
  <main class="profile-page">
    <section class="profile-user">
      <div class="avatar" :class="{ 'logo-avatar': !walletStore.userTg.photo_url }">
        <img v-if="walletStore.userTg.photo_url" :src="walletStore.userTg.photo_url" alt="avatar" />
        <img v-else src="/assets/peekpay-logo-150.png" alt="PeekPay" />
      </div>
      <div class="user-meta">
        <h1>
          <span v-if="walletStore.user.username">@{{ walletStore.user.username }}</span>
          <span v-else-if="walletStore.userTg.username">@{{ walletStore.userTg.username }}</span>
          <span v-else>{{ walletStore.userTg.first_name }} {{ walletStore.userTg.last_name }}</span>
        </h1>
        <p>PeekPay Account</p>
      </div>
    </section>

    <section v-if="visibleReferal.length" class="profile-section">
      <h2>{{ t("profile") }}</h2>
      <div class="profile-list">
        <button class="profile-row" v-for="(item, i) in visibleReferal" :key="i" @click="goRoute(item.route)">
          <i><svg viewBox="0 0 24 24" aria-hidden="true" v-html="iconPaths[item.icon]"></svg></i><span>{{ item.name }}</span><b>›</b>
        </button>
      </div>
    </section>

    <section class="profile-section">
      <h2>{{ t("params") }}</h2>
      <div class="profile-list">
        <button class="profile-row" v-for="(item, i) in params" :key="i" @click="goRoute(item.route)">
          <i><svg viewBox="0 0 24 24" aria-hidden="true" v-html="iconPaths[item.icon]"></svg></i><span>{{ item.name }}</span><b>›</b>
        </button>
        <div class="theme-wrap"><ThemeToggle /></div>
      </div>
    </section>

    <section class="profile-section">
      <h2>{{ t("aboutUs") }}</h2>
      <div class="profile-list">
        <button class="profile-row" v-for="(item, i) in aboutUs" :key="i" @click="goRoute(item.route)">
          <i><svg viewBox="0 0 24 24" aria-hidden="true" v-html="iconPaths[item.icon]"></svg></i><span>{{ item.name }}</span><b>›</b>
        </button>
      </div>
    </section>

    <button class="logout-btn" @click="walletStore.logOut()">{{ t('exit') }}</button>
  </main>
</template>

<style scoped>
.profile-page { position: relative; min-height: 100vh; min-height: 100dvh; overflow-x: hidden; background: radial-gradient(820px 360px at 50% -18%, #dbeafe 0%, #f1f5f9 58%); padding: 16px 16px calc(180px + env(safe-area-inset-bottom)); display: grid; gap: 18px; align-content: start; }
.profile-user { background: linear-gradient(135deg, #ffffff 0%, #f8fbff 100%); border: 1px solid #e2e8f0; border-radius: 24px; padding: 18px; box-shadow: 0 12px 28px rgba(15,23,42,.08); display: flex; align-items: center; gap: 14px; }
.avatar { width: 58px; height: 58px; flex: 0 0 58px; border-radius: 50%; overflow: hidden; background: linear-gradient(135deg, #dbeafe, #eff6ff); display: grid; place-items: center; color: #2563eb; font-size: 22px; font-weight: 700; }
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.avatar.logo-avatar img { object-fit: contain; padding: 8px; }
.user-meta { min-width: 0; }
h1 { margin: 0; color: #0f172a; font-size: 20px; line-height: 24px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.profile-user p { margin: 3px 0 0; color: #2563eb; font-size: 13px; font-weight: 500; }

.profile-section { display: grid; gap: 8px; }
.profile-section h2 { margin: 0 2px; color: #64748b; font-size: 12px; line-height: 16px; font-weight: 700; text-align: left; text-transform: uppercase; letter-spacing: .04em; }
.profile-list { background: rgba(255, 255, 255, 0.92); border: 1px solid #e2e8f0; border-radius: 20px; box-shadow: 0 10px 24px rgba(15,23,42,.06); padding: 0; display: grid; overflow: hidden; }
.profile-row { width: 100%; min-height: 56px; border-radius: 0; display: grid; grid-template-columns: 38px minmax(0, 1fr) 18px; gap: 12px; align-items: center; padding: 0 14px; text-align: left; transition: background-color .18s ease, transform .18s ease; }
.profile-row + .profile-row { border-top: 1px solid #eef2f7; }
.profile-row:active { background: #f8fafc; transform: scale(.995); }
.profile-row i { width: 38px; height: 38px; border-radius: 14px; background: linear-gradient(135deg, #eff6ff, #dbeafe); color: #2563eb; display: grid; place-items: center; font-style: normal; box-shadow: inset 0 1px 0 rgba(255,255,255,.85); }
.profile-row svg { width: 21px; height: 21px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; color: currentColor; filter: none; }
.profile-row svg * { fill: none !important; stroke: currentColor !important; color: currentColor !important; filter: none !important; }
.profile-row span { color: #0f172a; font-size: 16px; line-height: 20px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.profile-row b { color: #94a3b8; font-size: 24px; line-height: 1; font-weight: 500; }
.theme-wrap { padding: 10px; border-top: 1px solid #eef2f7; }
.logout-btn { min-height: 52px; border-radius: 18px; background: #fff; border: 1px solid #fecaca; color: #ef4444; font-weight: 600; box-shadow: 0 8px 20px rgba(239,68,68,.06); }

:global(.dark-theme) .profile-page {
  background:
    radial-gradient(720px 320px at 50% -16%, rgba(37, 98, 235, 0.22), transparent 62%),
    linear-gradient(180deg, #07111f 0%, #0d1b2a 100%) !important;
  min-height: 100dvh !important;
  padding-bottom: calc(180px + env(safe-area-inset-bottom)) !important;
}

:global(.dark-theme) .profile-user {
  background: linear-gradient(135deg, rgba(30, 39, 59, 0.96), rgba(17, 28, 46, 0.96)) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.34) !important;
}

:global(.dark-theme) .avatar {
  background: linear-gradient(135deg, rgba(37, 98, 235, 0.24), rgba(56, 130, 250, 0.14)) !important;
  color: #ffffff !important;
}

:global(.dark-theme) .profile-page h1,
:global(.dark-theme) .profile-row span {
  color: #ffffff !important;
}

:global(.dark-theme) .profile-user p {
  color: #3882fa !important;
}

:global(.dark-theme) .profile-section h2 {
  color: #94a3b8 !important;
}

:global(.dark-theme) .profile-list {
  background: rgba(30, 39, 59, 0.9) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.28) !important;
}

:global(.dark-theme) .profile-row {
  background: rgba(30, 39, 59, 0.72) !important;
}

:global(.dark-theme) .profile-row + .profile-row,
:global(.dark-theme) .theme-wrap {
  border-top-color: rgba(255, 255, 255, 0.06) !important;
}

:global(.dark-theme) .profile-row:active {
  background: rgba(37, 98, 235, 0.14) !important;
}

:global(.dark-theme) .profile-row i {
  background: rgba(37, 98, 235, 0.16) !important;
  color: #dbeafe !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
}

:global(.dark-theme) .profile-row svg,
:global(.dark-theme) .profile-row svg * {
  color: #dbeafe !important;
  fill: none !important;
  stroke: #dbeafe !important;
  filter: none !important;
}

:global(.dark-theme) .profile-row b {
  color: #94a3b8 !important;
}

:global(.dark-theme) .logout-btn {
  background: rgba(239, 68, 68, 0.1) !important;
  border-color: rgba(239, 68, 68, 0.22) !important;
  color: #ef4444 !important;
  box-shadow: none !important;
}
</style>
