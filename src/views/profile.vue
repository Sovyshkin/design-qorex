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
  { name: t("safety"), route: "safety" },
  { name: t("lang"), route: "select_lang" },
]);

const aboutUs = ref([
  { name: t("official_accounts"), route: "accounts" },
  { name: t("faq"), route: "faq" },
  { name: t("support"), route: "support" },
  { name: t("info"), route: "info" },
]);

const referal = computed(() => [
  { name: t("email_add_profile"), route: "email_add", show: !walletStore.user.email },
  { name: t("referal"), route: "referal", show: true },
]);

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
      <div class="avatar"><img v-if="walletStore.userTg.photo_url" :src="walletStore.userTg.photo_url" alt="avatar" /></div>
      <div>
        <h1>
          <span v-if="walletStore.user.username">@{{ walletStore.user.username }}</span>
          <span v-else-if="walletStore.userTg.username">@{{ walletStore.userTg.username }}</span>
          <span v-else>{{ walletStore.userTg.first_name }} {{ walletStore.userTg.last_name }}</span>
        </h1>
        <p>Premium Account</p>
      </div>
    </section>

    <section class="profile-list">
      <button class="profile-row" v-for="(item, i) in referal" :key="i" v-if="item.show" @click="goRoute(item.route)"><span>{{ item.name }}</span><b>›</b></button>
    </section>

    <section class="profile-list">
      <button class="profile-row" v-for="(item, i) in params" :key="i" @click="goRoute(item.route)"><span>{{ item.name }}</span><b>›</b></button>
      <div class="theme-wrap"><ThemeToggle /></div>
    </section>

    <button class="support-btn" @click="goRoute('donate')">Поддержать проект</button>

    <section class="profile-list">
      <button class="profile-row" v-for="(item, i) in aboutUs" :key="i" @click="goRoute(item.route)"><span>{{ item.name }}</span><b>›</b></button>
    </section>

    <button class="logout-btn" @click="walletStore.logOut()">{{ t('exit') }}</button>
  </main>
</template>

<style scoped>
.profile-page { min-height: 100vh; background: #f1f5f9; padding: 16px 16px 124px; display: grid; gap: 12px; }
.profile-user { background: #fff; border: 1px solid #e2e8f0; border-radius: 22px; padding: 16px; box-shadow: 0 10px 24px rgba(15,23,42,.08); display: flex; align-items: center; gap: 12px; }
.avatar { width: 52px; height: 52px; border-radius: 50%; overflow: hidden; background: #eff6ff; }
.avatar img { width: 100%; height: 100%; object-fit: cover; }
h1 { margin: 0; color: #0f172a; font-size: 20px; font-weight: 600; }
.profile-user p { margin: 2px 0 0; color: #2563eb; font-size: 13px; }

.profile-list { background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; box-shadow: 0 8px 22px rgba(15,23,42,.07); padding: 6px; display: grid; }
.profile-row { min-height: 50px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; padding: 0 10px; }
.profile-row span { color: #0f172a; font-weight: 500; }
.profile-row b { color: #94a3b8; font-size: 18px; }
.theme-wrap { padding: 8px 8px 2px; }
.support-btn, .logout-btn { min-height: 52px; border-radius: 16px; font-weight: 600; }
.support-btn { background: linear-gradient(135deg, #2563eb, #1e40af); color: #fff; box-shadow: 0 12px 24px rgba(37,99,235,.25); }
.logout-btn { background: #fff; border: 1px solid #fecaca; color: #ef4444; }
</style>
