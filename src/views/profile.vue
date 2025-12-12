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
  {
    name: t("safety"),
    icon: "safety",
    route: "safety",
  },
  {
    name: t("lang"),
    icon: "lang",
    route: "select_lang",
  },
]);

const aboutUs = ref([
  {
    name: t("official_accounts"),
    icon: "telegram",
    route: "accounts",
  },
  {
    name: t("faq"),
    icon: "faq",
    route: "faq",
  },
  {
    name: t("support"),
    icon: "support",
    route: "support",
  },
  {
    name: t("info"),
    icon: "info",
    route: "info",
  },
]);


// Делаем реактивный computed для элементов профиля
const referal = computed(() => [
  {
    name: t("email_add_profile"),
    icon: "email",
    route: "email_add",
    show: walletStore.user.email ? false : true,
  },
  {
    name: t("referal"),
    icon: "referal",
    route: "referal",
    show: true,
  },
]);


const support = ref([
  {
    name: t("support"),
    icon: "support",
    route: "support",
  },
]);

const goRoute = (route) => {
  try {
    if (route == "faq") {
      window.location.href = "https://gardawallet.com";
    } else if (route == "support") {
      window.location.href = "https://t.me/Gardawallet_Support_bot";
    } else {
      router.push({ name: route });
    }
  } catch (err) {

  }
};

onMounted(async () => {
  try {
    // НЕ вызываем getUser() здесь - это может вызвать рекурсию!
    // Данные пользователя должны быть уже загружены в main.vue
    
    // Проверяем статус 2FA только если есть данные пользователя
    if (walletStore.user?.tg_id && !walletStore.isGettingUser) {
      await walletStore.check2FAStatus();
    }
  } catch (err) {
    console.error('Error in profile onMounted:', err);
  }
});
</script>

<template>
  <main class="profile">
    <transition name="user-appear" appear>
      <div class="user profile-item">
        <div class="wrap-avatar">
          <img :src="walletStore.userTg.photo_url" alt="" />
        </div>
        <span class="name">@{{ walletStore.user.username }}</span>
      </div>
    </transition>
    <transition name="referal-appear" appear>
      <div class="referal profile-item">
        <template v-for="(item, i) in referal" :key="i">
          <div class="list-item" v-if="item.show" @click="goRoute(item.route)">
            <div class="info">
              <div class="wrap-img">
                <img :src="`/assets/${item.icon}.svg`" :alt="item.icon" />
              </div>
              <span class="list-value">{{ item.name }}</span>
            </div>
            <img
              v-if="item.isEnabled"
              class="arrow"
              src="../assets/check.svg"
              alt="enabled"
            />
            <img
              v-else
              class="arrow"
              src="../assets/arrow-right.svg"
              alt="arrow-right"
            />
          </div>
        </template>
      </div>
    </transition>
    <transition name="params-title-appear" appear>
      <h2 class="profile-value">{{ t("params") }}</h2>
    </transition>
    <transition name="params-appear" appear>
      <div class="params profile-item">
        <div
          class="list-item"
          v-for="(item, i) in params"
          :key="i"
          @click="goRoute(item.route)"
        >
          <div class="info">
            <div class="wrap-img">
              <img :src="`/assets/${item.icon}.svg`" :alt="item.icon" />
            </div>
            <span class="list-value">{{ item.name }}</span>
          </div>
          <img class="arrow" src="../assets/arrow-right.svg" alt="arrow-right" />
        </div>
        
        <!-- Переключатель темы -->
        <div class="theme-toggle-wrapper">
          <ThemeToggle />
        </div>
      </div>
    </transition>
    <transition name="about-title-appear" appear>
      <h2 class="profile-value">{{ t("aboutUs") }}</h2>
    </transition>
    <transition name="about-appear" appear>
      <div class="about-us profile-item">
        <div
          class="list-item"
          v-for="(item, i) in aboutUs"
          :key="i"
          @click="goRoute(item.route)"
        >
          <div class="info">
            <div class="wrap-img">
              <img :src="`/assets/${item.icon}.svg`" :alt="item.icon" />
            </div>
            <span class="list-value">{{ item.name }}</span>
          </div>
          <img class="arrow" src="../assets/arrow-right.svg" alt="arrow-right" />
        </div>
      </div>
    </transition>
    <!-- <div class="about-us profile-item">
      <div
        class="list-item"
        v-for="(item, i) in support"
        :key="i"
        @click="goRoute(item.route)"
      >
        <div class="info">
          <div class="wrap-img">
            <img :src="`/assets/${item.icon}.svg`" :alt="item.icon" />
          </div>
          <span class="list-value">{{ item.name }}</span>
        </div>
        <img class="arrow" src="../assets/arrow-right.svg" alt="arrow-right" />
      </div>
    </div> -->
    <transition name="exit-appear" appear>
      <button class="btn exit profile-item" @click="walletStore.logOut()">
        {{ t("exit") }}
      </button>
    </transition>
  </main>
</template>

<style scoped>
.profile {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px 15px 100px 15px;
}

.profile-item {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.profile-value {
  color: #141414;
  font-weight: 300;
}

.list-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  transition: all 0.3s ease;
  padding: 16px;
  border-radius: 16px;
}

.list-value {
  font-size: 14px;
}

.info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.wrap-img {
  background-color: #deec51;
  padding: 8px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wrap-img img {
  height: 24px;
  width: 24px;
}

.arrow {
  height: 24px;
  width: 24px;
  transition: transform 0.3s ease;
}

.list-item:hover .arrow {
  transform: translateX(5px);
  transition: transform 0.3s ease;
}

/* Стили для переключателя темы */
.theme-toggle-wrapper {
  padding: 0 16px;
  margin-top: 8px;
}

.exit {
  color: rgb(244, 44, 44);
  font-weight: 600;
  font-size: 16px;
}

.user {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  background-color: #fff;
  padding: 16px;
  border-radius: 16px;
}

.wrap-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wrap-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.name {
  font-size: 20px;
  color: #141414;
}

/* Анимации появления профиля */
.user-appear-enter-active {
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: 0.1s;
}
.user-appear-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(-20px);
}

.referal-appear-enter-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: 0.3s;
}
.referal-appear-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.params-title-appear-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: 0.5s;
}
.params-title-appear-enter-from {
  opacity: 0;
  transform: translateY(-15px);
}

.params-appear-enter-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: 0.6s;
}
.params-appear-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.about-title-appear-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: 0.8s;
}
.about-title-appear-enter-from {
  opacity: 0;
  transform: translateY(-15px);
}

.about-appear-enter-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: 0.9s;
}
.about-appear-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.exit-appear-enter-active {
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: 1.1s;
}
.exit-appear-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}
</style>
