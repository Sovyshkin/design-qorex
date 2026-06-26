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

const openTwoFactorSetup = () => {
  router.push({ name: "twoFactorAuth", query: { from: "safety" } });
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
    // Проверяем 2FA без блокировки первого рендера страницы.
    if (walletStore.user?.tg_id || walletStore.userTg?.id) {
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

      <button class="list-item list-item--button" type="button" @click="openTwoFactorSetup">
        <div class="info">
          <div class="wrap-img">
            <img src="/assets/safety.svg" alt="2fa" />
          </div>
          <div class="two-factor-copy">
            <span class="list-value">{{ t("two_factor_auth") }}</span>
            <small class="two-factor-status">
              {{ twoFactorActive ? t("2fa_enabled") : t("setup_2fa") }}
            </small>
          </div>
        </div>
        <span class="row-arrow">›</span>
      </button>

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
  width: 100%;
  min-height: 64px;
  padding: 16px;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 44px;
  align-items: center;
  gap: 8px;
  background: #f1f5f9;
}

h1 {
  margin: 0;
  color: #0f172a;
  font-size: 24px;
  line-height: 28px;
  font-weight: 750;
  letter-spacing: -0.03em;
  text-align: center;
}

.safety {
  min-height: calc(100vh - 64px);
  min-height: calc(100dvh - 64px);
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 0 16px calc(176px + env(safe-area-inset-bottom));
  overflow-y: auto;
  background:
    radial-gradient(820px 360px at 50% -18%, #dbeafe 0%, transparent 62%),
    #f1f5f9;
}

.profile-item {
  width: 100%;
  display: grid;
  gap: 10px;
  margin-bottom: 18px;
}

.profile-value {
  margin: 0 2px 2px;
  color: #64748b;
  font-size: 13px;
  line-height: 18px;
  font-weight: 750;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.list-item {
  width: 100%;
  min-height: 74px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border-radius: 22px;
  border: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
  transition: transform 0.18s ease, border-color 0.18s ease;
}

.list-item--button {
  text-align: left;
}

.list-item:active {
  transform: scale(0.99);
  border-color: #bfdbfe;
}

.list-value {
  min-width: 0;
  color: #0f172a;
  font-size: 16px;
  line-height: 20px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
}

.two-factor-copy {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.two-factor-status {
  color: #64748b;
  font-size: 12px;
  line-height: 16px;
  font-weight: 650;
}

.wrap-img {
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
  padding: 12px;
  border-radius: 17px;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  display: flex;
  align-items: center;
  justify-content: center;
}

.wrap-img img {
  width: 24px;
  height: 24px;
  filter: invert(34%) sepia(98%) saturate(1817%) hue-rotate(211deg) brightness(95%) contrast(95%);
}

.arrow {
  width: 44px;
  height: 44px;
  padding: 13px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  object-fit: contain;
  transition: transform 0.18s ease;
}

.arrow:active {
  transform: scale(0.96);
}

.tg-name {
  max-width: 132px;
  overflow: hidden;
  color: #64748b;
  font-size: 14px;
  line-height: 18px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-arrow {
  color: #94a3b8;
  font-size: 26px;
  line-height: 1;
  font-weight: 500;
}

.emp {
  width: 44px;
  height: 44px;
}

:global(.dark-theme) .header,
:global(.dark-theme) .safety {
  background: #0d1b2a !important;
}

:global(.dark-theme) h1,
:global(.dark-theme) .list-value {
  color: #ffffff !important;
}

:global(.dark-theme) .profile-value,
:global(.dark-theme) .tg-name,
:global(.dark-theme) .two-factor-status,
:global(.dark-theme) .row-arrow {
  color: #94a3b8 !important;
}

:global(.dark-theme) .arrow {
  background: rgba(30, 39, 59, 0.96) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  filter: brightness(0) invert(1);
  box-shadow: 0 16px 30px rgba(0, 0, 0, 0.28) !important;
}

:global(.dark-theme) .list-item {
  background: rgba(30, 39, 59, 0.96) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.34) !important;
}

:global(.dark-theme) .info {
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
}

:global(.dark-theme) .wrap-img {
  background: rgba(37, 98, 235, 0.18) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
}

:global(.dark-theme) .wrap-img img {
  filter: brightness(0) invert(1) opacity(0.92) !important;
}
</style>
