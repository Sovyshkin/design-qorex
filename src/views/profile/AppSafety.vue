<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { useWalletStore } from "../../stores/walletStore.ts";
import { useRouter } from "vue-router";
import InputCheck from "@/components/ui/inputs/InputCheck.vue";
import BackButton from "@/components/ui/BackButton.vue";
import { getElementSnapshot, logThemeSnapshot } from "@/utils/pageDebug";

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
    await nextTick();
    logThemeSnapshot("AppSafety mounted", {
      page: getElementSnapshot(".safety-page"),
      header: getElementSnapshot(".safety-header"),
      body: getElementSnapshot(".safety-body"),
      firstItem: getElementSnapshot(".safety-item"),
      storeFlags: {
        codePasswordActive: codePasswordActive.value,
        hideBalanceActive: hideBalanceActive.value,
        twoFactorActive: twoFactorActive.value,
      },
    });

    // Проверяем 2FA без блокировки первого рендера страницы.
    if (walletStore.user?.tg_id || walletStore.userTg?.id) {
      await walletStore.check2FAStatus();
      await nextTick();
      logThemeSnapshot("AppSafety after check2FAStatus", {
        page: getElementSnapshot(".safety-page"),
        body: getElementSnapshot(".safety-body"),
        firstItem: getElementSnapshot(".safety-item"),
        has2FA: walletStore.has2FA,
      });
    }
  } catch (error) {
    console.error('Ошибка загрузки данных пользователя:', error);
  }
});
</script>

<template>
  <div class="safety-page">
    <header class="safety-header">
      <BackButton @click="goBack()" />
      <h1 class="safety-title">{{ t("safety") }}</h1>
      <div class="safety-header-spacer"></div>
    </header>

    <main class="safety-body">
      <h2 class="safety-section-title">{{ t("auth") }}</h2>
      <div class="safety-group">
        <div class="safety-item" v-for="(item, i) in auth" :key="i">
          <div class="safety-item__info">
            <div class="safety-item__icon-wrap">
              <img :src="`/assets/${item.icon}.svg`" :alt="item.icon" />
            </div>
            <span class="safety-item__label">{{ item.name }}</span>
          </div>
          <span class="safety-item__hint">@{{ walletStore.user.username }}</span>
        </div>
      </div>

      <h2 class="safety-section-title">{{ t("logIn") }}</h2>
      <div class="safety-group">
        <div class="safety-item">
          <div class="safety-item__info">
            <div class="safety-item__icon-wrap">
              <img src="/assets/pin-code.svg" alt="pin-code" />
            </div>
            <span class="safety-item__label">{{ t("code_password") }}</span>
          </div>
          <InputCheck
            :modelValue="codePasswordActive"
            @update:modelValue="toggleCodePassword"
          />
        </div>

        <button class="safety-item safety-item--button" type="button" @click="openTwoFactorSetup">
          <div class="safety-item__info">
            <div class="safety-item__icon-wrap">
              <img src="/assets/safety.svg" alt="2fa" />
            </div>
            <div class="safety-two-factor">
              <span class="safety-item__label">{{ t("two_factor_auth") }}</span>
              <small class="safety-two-factor__status">
                {{ twoFactorActive ? t("2fa_enabled") : t("setup_2fa") }}
              </small>
            </div>
          </div>
          <span class="safety-item__arrow">›</span>
        </button>

        <div class="safety-item">
          <div class="safety-item__info">
            <div class="safety-item__icon-wrap">
              <img src="/assets/hide-balance.svg" alt="hide" />
            </div>
            <span class="safety-item__label">{{ t("hide_balance") }}</span>
          </div>
          <InputCheck
            :modelValue="hideBalanceActive"
            @update:modelValue="toggleHideBalance"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.safety-page {
  min-height: 100vh;
  min-height: 100dvh;
  background:
    radial-gradient(820px 360px at 50% -18%, #dbeafe 0%, transparent 62%),
    #f1f5f9;
}

.safety-header {
  width: 100%;
  min-height: 64px;
  padding: 16px;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 44px;
  align-items: center;
  gap: 8px;
  background: transparent;
}

.safety-title {
  margin: 0;
  color: #0f172a;
  font-size: 24px;
  line-height: 28px;
  font-weight: 750;
  letter-spacing: -0.03em;
  text-align: center;
}

.safety-body {
  min-height: calc(100vh - 64px);
  min-height: calc(100dvh - 64px);
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 0 16px calc(176px + env(safe-area-inset-bottom));
  overflow-y: auto;
  background: transparent;
}

.safety-group {
  width: 100%;
  display: grid;
  gap: 10px;
  margin-bottom: 18px;
}

.safety-section-title {
  margin: 0 2px 2px;
  color: #64748b;
  font-size: 13px;
  line-height: 18px;
  font-weight: 750;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.safety-item {
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

.safety-item--button {
  text-align: left;
}

.safety-item:active {
  transform: scale(0.99);
  border-color: #bfdbfe;
}

.safety-item__label {
  min-width: 0;
  color: #0f172a;
  font-size: 16px;
  line-height: 20px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.safety-item__info {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
}

.safety-two-factor {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.safety-two-factor__status {
  color: #64748b;
  font-size: 12px;
  line-height: 16px;
  font-weight: 650;
}

.safety-item__icon-wrap {
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

.safety-item__icon-wrap img {
  width: 24px;
  height: 24px;
  filter: invert(34%) sepia(98%) saturate(1817%) hue-rotate(211deg) brightness(95%) contrast(95%);
}

.safety-item__hint {
  max-width: 132px;
  overflow: hidden;
  color: #64748b;
  font-size: 14px;
  line-height: 18px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.safety-item__arrow {
  color: #94a3b8;
  font-size: 26px;
  line-height: 1;
  font-weight: 500;
}

.safety-header-spacer {
  width: 44px;
  height: 44px;
}

:global(.dark-theme) .safety-page {
  background:
    radial-gradient(720px 320px at 50% -18%, rgba(37, 98, 235, 0.18), transparent 62%),
    linear-gradient(180deg, #07111f 0%, #0d1b2a 100%) !important;
}

:global(.dark-theme) .safety-header,
:global(.dark-theme) .safety-body {
  background: transparent !important;
}

:global(.dark-theme) .safety-title,
:global(.dark-theme) .safety-item__label {
  color: #ffffff !important;
}

:global(.dark-theme) .safety-section-title,
:global(.dark-theme) .safety-item__hint,
:global(.dark-theme) .safety-two-factor__status,
:global(.dark-theme) .safety-item__arrow {
  color: #94a3b8 !important;
}

:global(.dark-theme) .safety-item {
  background: rgba(30, 39, 59, 0.96) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.34) !important;
}

:global(.dark-theme) .safety-item__info {
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
}

:global(.dark-theme) .safety-item__icon-wrap {
  background: rgba(37, 98, 235, 0.18) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
}

:global(.dark-theme) .safety-item__icon-wrap img {
  filter: brightness(0) invert(1) opacity(0.92) !important;
}
</style>
