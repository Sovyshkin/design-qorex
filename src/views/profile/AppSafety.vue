<
<script setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useWalletStore } from "../../stores/walletStore.ts";
import { useRouter } from "vue-router";
import InputCheck from "@/components/ui/inputs/InputCheck.vue";

const { t } = useI18n();
const walletStore = useWalletStore();
const router = useRouter();

const auth = ref([
  {
    name: t("telegram"),
    icon: "telegram",
  },
]);

// Используем computed для синхронизации с store
const codePasswordActive = computed(() => walletStore.codePasswordActive);
const hideBalanceActive = computed(() => walletStore.hideBalanceActive);
const twoFactorActive = computed(() => walletStore.has2FA);

// Обработчик изменения защиты PIN-кодом
const toggleCodePassword = async (val) => {
  if (!val) {
    // Отключаем PIN-код через API
    await walletStore.disablePinCode();
  } else {
    // Перенаправляем на страницу установки PIN-кода при первом включении
    router.push({ name: 'createPin', query: { createMode: true } });
  }
};

const isTogglingBalance = ref(false);

const toggleHideBalance = async (val) => {
  if (isTogglingBalance.value) return;
  
  isTogglingBalance.value = true;
  try {
    await walletStore.setHideBalanceActive(val);
  } finally {
    setTimeout(() => {
      isTogglingBalance.value = false;
    }, 1000);
  }
};

const toggleTwoFactor = (val) => {
  if (val) {
    // Перенаправляем на страницу настройки 2FA
    router.push({ name: 'twoFactorAuth' });
  } else {
    // 2FA нельзя отключить, когда включено
    // Просто не делаем ничего, статус остается неизменным
  }
};

const goBack = () => {
  try {
    router.push({ name: "profile" })
  } catch (err) {
    
  }
}

// Загружаем актуальные данные пользователя при монтировании компонента
onMounted(async () => {
  try {
    // Проверяем есть ли уже данные пользователя
    if (!walletStore.user?.tg_id) {
      await walletStore.getUser();
    }
    // Также проверяем статус 2FA только если есть пользователь
    if (walletStore.user?.tg_id) {
      await walletStore.check2FAStatus();
    }
  } catch (error) {
    console.error('Ошибка загрузки данных пользователя:', error);
  }
});
</script>

<template>
  <header class="header">
    <img
      class="arrow"
      src="../../assets/arrow-left.svg"
      alt=""
      @click="goBack()"
    />
    <h1>{{ t("safety") }}</h1>
    <div class="emp"></div>
  </header>
  <main class="safety">
    <h2 class="profile-value">{{ t("auth") }}</h2>
    <div class="auth profile-item">
      <div class="list-item" v-for="(item, i) in auth" :key="i">
        <div class="info">
          <div class="wrap-img">
            <img :src="`/assets/${item.icon}.svg`" :alt="item.icon" />
          </div>
          <span class="list-value">{{ item.name }}</span>
        </div>
        <span class="tg-name">@{{ walletStore.user.username }}</span>
      </div>
    </div>
    <h2 class="profile-value">{{ t("logIn") }}</h2>
    <div class="logIn profile-item">
      <div class="list-item">
        <div class="info">
          <div class="wrap-img">
            <img src="/assets/pin-code.svg" alt="pin-code" />
          </div>
          <span class="list-value">{{ t("code_password") }}</span>
        </div>
        <InputCheck
          :modelValue="codePasswordActive"
          @update:modelValue="toggleCodePassword"
        />
      </div>

      <!-- <div class="list-item">
        <div class="info">
          <div class="wrap-img">
            <img src="/assets/safety.svg" alt="2fa" />
          </div>
          <span class="list-value">{{ t("two_factor_auth") }}</span>
        </div>
        <InputCheck
          :modelValue="twoFactorActive"
          @update:modelValue="toggleTwoFactor"
        />
      </div> -->

      <div class="list-item">
        <div class="info">
          <div class="wrap-img">
            <img src="/assets/hide-balance.svg" alt="hide" />
          </div>
          <span class="list-value">{{ t("hide_balance") }}</span>
        </div>
        <InputCheck
          :modelValue="hideBalanceActive"
          @update:modelValue="toggleHideBalance"
        />
      </div>
    </div>
  </main>
</template>

<style scoped>
.header {
  padding: 20px 15px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

h1 {
  color: #0F172A;
}
.safety {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 15px 120px 15px;
  overflow-y: auto;
}

.profile-item {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.profile-value {
  color: #0F172A;
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
  background-color: #2563EB;
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
  height: 32px;
  width: 32px;
  transition: transform 0.3s ease;
}

.list-item:hover .arrow {
  transform: translateX(5px);
  transition: transform 0.3s ease;
}

.tg-name {
  opacity: 0.4;
  font-size: 12px;
  color: #262626;
}

.emp {
  width: 32px;
}
</style>
