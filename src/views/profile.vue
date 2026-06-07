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
  { name: t("safety"), route: "safety", icon: "🛡" },
  { name: t("lang"), route: "select_lang", icon: "🌐" },
]);

const aboutUs = ref([
  { name: t("official_accounts"), route: "accounts", icon: "✦" },
  { name: t("faq"), route: "faq", icon: "?" },
  { name: t("support"), route: "support", icon: "↗" },
  { name: t("info"), route: "info", icon: "i" },
]);

const referal = computed(() => [
  { name: t("email_add_profile"), route: "email_add", show: !walletStore.user.email, icon: "@" },
  { name: t("referal"), route: "referal", show: true, icon: "↝" },
]);

const visibleReferal = computed(() => referal.value.filter((item) => item.show));

const goRoute = (route) => {
  if (route === "faq") window.location.href = "https://peekpay.com";
  else if (route === "support") window.location.href = "https://t.me/PeekPay_Support_bot";
  else router.push({ name: route });
};

onMounted(async () => {
  if (walletStore.user?.tg_id && !walletStore.isGettingUser) await walletStore.check2FAStatus();
});
</script>

<template>
  <main class="profile-page">
    <section class="profile-user">
      <div class="avatar">
        <img v-if="walletStore.userTg.photo_url" :src="walletStore.userTg.photo_url" alt="avatar" />
        <span v-else>{{ (walletStore.userTg.first_name || 'P').slice(0, 1) }}</span>
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
          <i>{{ item.icon }}</i><span>{{ item.name }}</span><b>›</b>
        </button>
      </div>
    </section>

    <section class="profile-section">
      <h2>{{ t("params") }}</h2>
      <div class="profile-list">
        <button class="profile-row" v-for="(item, i) in params" :key="i" @click="goRoute(item.route)">
          <i>{{ item.icon }}</i><span>{{ item.name }}</span><b>›</b>
        </button>
        <div class="theme-wrap"><ThemeToggle /></div>
      </div>
    </section>

    <section class="profile-section">
      <h2>{{ t("aboutUs") }}</h2>
      <div class="profile-list">
        <button class="profile-row" v-for="(item, i) in aboutUs" :key="i" @click="goRoute(item.route)">
          <i>{{ item.icon }}</i><span>{{ item.name }}</span><b>›</b>
        </button>
      </div>
    </section>

    <button class="logout-btn" @click="walletStore.logOut()">{{ t('exit') }}</button>
  </main>
</template>

<style scoped>
.profile-page { min-height: 100vh; background: radial-gradient(820px 360px at 50% -18%, #dbeafe 0%, #f1f5f9 58%); padding: 16px 16px 124px; display: grid; gap: 14px; align-content: start; }
.profile-user { background: linear-gradient(135deg, #ffffff 0%, #f8fbff 100%); border: 1px solid #e2e8f0; border-radius: 24px; padding: 18px; box-shadow: 0 12px 28px rgba(15,23,42,.08); display: flex; align-items: center; gap: 14px; }
.avatar { width: 58px; height: 58px; flex: 0 0 58px; border-radius: 50%; overflow: hidden; background: linear-gradient(135deg, #dbeafe, #eff6ff); display: grid; place-items: center; color: #2563eb; font-size: 22px; font-weight: 700; }
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.user-meta { min-width: 0; }
h1 { margin: 0; color: #0f172a; font-size: 20px; line-height: 24px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.profile-user p { margin: 3px 0 0; color: #2563eb; font-size: 13px; font-weight: 500; }

.profile-section { display: grid; gap: 8px; }
.profile-section h2 { margin: 0 4px; color: #64748b; font-size: 13px; line-height: 16px; font-weight: 600; text-align: left; }
.profile-list { background: #fff; border: 1px solid #e2e8f0; border-radius: 22px; box-shadow: 0 8px 22px rgba(15,23,42,.07); padding: 6px; display: grid; }
.profile-row { width: 100%; min-height: 52px; border-radius: 16px; display: grid; grid-template-columns: 34px minmax(0, 1fr) 18px; gap: 10px; align-items: center; padding: 0 10px; text-align: left; }
.profile-row i { width: 34px; height: 34px; border-radius: 50%; background: #eff6ff; color: #2563eb; display: grid; place-items: center; font-style: normal; font-size: 14px; font-weight: 700; }
.profile-row span { color: #0f172a; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.profile-row b { color: #94a3b8; font-size: 18px; }
.theme-wrap { padding: 8px 8px 4px; }
.logout-btn { min-height: 52px; border-radius: 18px; background: #fff; border: 1px solid #fecaca; color: #ef4444; font-weight: 600; box-shadow: 0 8px 20px rgba(239,68,68,.06); }
</style>
