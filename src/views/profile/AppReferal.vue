<script setup>
import { ref, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useWalletStore } from "@/stores/walletStore";
import { useRouter } from "vue-router";

const { t } = useI18n();
const showCopiedNotification = ref(false);
const walletStore = useWalletStore();
const router = useRouter();
const referralUserId = computed(() => walletStore.user?.tg_id || walletStore.userTg?.id || "");
const referralLink = computed(() => `https://t.me/peekpay_bot?startapp=referal_${referralUserId.value}`);
const hasReferals = computed(() => referals.value.length > 0);

const copy = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    showCopiedNotification.value = true;
    setTimeout(() => {
      showCopiedNotification.value = false;
    }, 2000);
  });
};

const goBack = () => {
  router.go(-1);
};

// Данные рефералов
const referals = ref([]);
const isLoadingReferrals = ref(false);

// Общая статистика
const stats = ref({
  totalreferals: 0,
  totalAmount: "0",
});

// Функция для загрузки рефералов
const loadReferrals = async () => {
  if (isLoadingReferrals.value) return; // Предотвращаем повторные запросы
  
  try {
    isLoadingReferrals.value = true;
    if (!referralUserId.value) return;
    const data = await walletStore.getMyReferrals();
    if (data && Array.isArray(data)) {
      referals.value = data;
      stats.value.totalreferals = data.length;
      
      // Подсчитываем общую сумму заработанных денег
      const totalEarned = data.reduce((sum, referal) => {
        return sum + parseFloat(referal.referral_only_pay || 0);
      }, 0);
      stats.value.totalAmount = walletStore.roundToHundredths(totalEarned);
    }
  } catch (error) {
    // Silently handle error
  } finally {
    isLoadingReferrals.value = false;
  }
};

// Форматирование даты
const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  } catch {
    return dateString;
  }
};

onMounted(() => {
  loadReferrals();
});
</script>

<template>
  <div class="referal-page">
    <header class="header">
      <img
        src="@/assets/arrow-left.svg"
        :alt="t('back')"
        class="back-arrow"
        @click="goBack()"
      />
      <h1>{{ t("referal") }}</h1>
      <div class="header-spacer"></div>
    </header>

    <div class="content">
      <div class="banner">
        <h2 v-html="t('earn_up_to_15')"></h2>
      </div>
      <div class="referal-section">

        <div class="referal-box">
          <h3>{{ t("referal_link") }}</h3>
          <div
            class="referal-box-value"
            @click="copy(referralLink)"
          >
            <span>{{ referralLink }}</span>
            <img src="@/assets/copy.svg" alt="copy" />
          </div>
        </div>
      </div>

      <div class="stats-section">
        <div class="stats-header">
          <div class="stats-info">
            <h2>{{ t("referals") }}</h2>
            <span class="stats-count">({{ stats.totalreferals }})</span>
          </div>
          <span class="stats-amount">{{ stats.totalAmount }} $</span>
        </div>
        
        <!-- Показываем список рефералов или пустое состояние -->
        <div class="referals-list">
          <template v-if="hasReferals">
            <div
              class="referal-item"
              v-for="(referal, index) in referals"
              :key="referal.id || referal.tg_id || index"
            >
              <div class="user-info">
                <div class="wrap-img">
                  <img src="@/assets/referal.svg" alt="referal">
                </div>
                <div class="user-info-more">
                    <span class="user-name">@{{ referal.username || referal.first_name || 'Пользователь' }}</span>
                    <span class="reg-date"
                      >{{ t("earned") }}: {{ walletStore.roundToHundredths(referal.referral_only_pay || 0) }} $</span
                    >
                </div>
              </div>
              <div class="user-amount">{{ walletStore.roundToHundredths(referal.referral_only_pay || 0) }} $</div>
            </div>
          </template>
          
          <div v-else class="empty-referals">
            <div class="empty-icon">
              <img src="@/assets/referal.svg" alt="">
            </div>
            <h3 class="empty-title">{{ t("no_referals_yet") }}</h3>
            <p class="empty-description">
              {{ t("no_referals_description") }}
            </p>
          </div>
        </div>
      </div>
    </div>
    <transition name="fade">
      <div v-if="showCopiedNotification" class="copied-notification">
        {{ t("copied") }}
      </div>
    </transition>
  </div>
  <!-- <div class="container">
        <img src="../../assets/cat-loader.svg" alt="">
        {{ t('in_development') }}...
    </div> -->
</template>

<style scoped>
.referal-page {
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 16px 16px calc(176px + env(safe-area-inset-bottom));
  background:
    radial-gradient(820px 360px at 50% -18%, #dbeafe 0%, transparent 62%),
    #f1f5f9;
  display: grid;
  align-content: start;
  gap: 18px;
  overflow-x: hidden;
}

.header {
  min-height: 54px;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 44px;
  align-items: center;
  gap: 8px;
}

.header h1 {
  margin: 0;
  color: #0f172a;
  font-size: 24px;
  line-height: 28px;
  font-weight: 750;
  text-align: center;
  letter-spacing: -0.03em;
}

.back-arrow {
  width: 44px;
  height: 44px;
  padding: 13px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  cursor: pointer;
  object-fit: contain;
}

.header-spacer {
  width: 44px;
  height: 44px;
}

.content {
  width: 100%;
  display: grid;
  gap: 18px;
}

.banner {
  position: relative;
  min-height: 178px;
  overflow: hidden;
  display: flex;
  align-items: end;
  padding: 22px;
  border-radius: 26px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background:
    radial-gradient(180px 140px at 90% 0%, rgba(255, 255, 255, 0.18), transparent 68%),
    radial-gradient(170px 130px at 0% 100%, rgba(59, 130, 246, 0.34), transparent 70%),
    linear-gradient(135deg, #3b82f6 0%, #2563eb 48%, #1e40af 100%);
  box-shadow: 0 20px 36px rgba(37, 99, 235, 0.26);
}

.banner::before,
.banner::after {
  content: "";
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
}

.banner::before {
  width: 148px;
  height: 148px;
  right: -42px;
  top: -42px;
  background: rgba(255, 255, 255, 0.15);
}

.banner::after {
  width: 210px;
  height: 84px;
  left: -42px;
  bottom: -36px;
  background: rgba(15, 23, 42, 0.12);
  transform: rotate(-10deg);
}

.banner h2 {
  position: relative;
  z-index: 1;
  max-width: 310px;
  margin: 0;
  color: #ffffff;
  font-size: 28px;
  line-height: 34px;
  font-weight: 800;
  letter-spacing: -0.035em;
}

.banner h2 :deep(span) {
  color: #ffffff !important;
  font-size: inherit !important;
  line-height: inherit !important;
  font-weight: 800 !important;
  text-shadow: 0 8px 18px rgba(15, 23, 42, 0.18);
}

.referal-section,
.referals-list {
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.referal-section {
  padding: 16px;
}

.referal-box {
  display: grid;
  gap: 10px;
}

.referal-section h3 {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  line-height: 16px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.referal-box-value {
  min-height: 68px;
  padding: 13px 14px;
  border-radius: 18px;
  border: 1px solid #dbeafe;
  background: linear-gradient(135deg, #f8fbff, #eff6ff);
  display: grid;
  grid-template-columns: minmax(0, 1fr) 38px;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.referal-box-value:active {
  transform: scale(0.99);
  border-color: #93c5fd;
}

.referal-box-value span {
  min-width: 0;
  color: #0f172a;
  font-size: 15px;
  line-height: 20px;
  font-weight: 600;
  word-break: break-word;
}

.referal-box-value img {
  width: 38px;
  height: 38px;
  padding: 9px;
  border-radius: 14px;
  background: #ffffff;
  filter: invert(34%) sepia(98%) saturate(1817%) hue-rotate(211deg) brightness(95%) contrast(95%);
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.14);
}

.stats-section {
  display: grid;
  gap: 12px;
}

.stats-header {
  min-height: 42px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.stats-info {
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.stats-info h2 {
  margin: 0;
  color: #0f172a;
  font-size: 20px;
  line-height: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.stats-count {
  color: #64748b;
  font-size: 13px;
  line-height: 18px;
  font-weight: 600;
}

.stats-amount,
.user-amount {
  flex: 0 0 auto;
  border-radius: 14px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #ffffff;
  font-size: 14px;
  line-height: 18px;
  font-weight: 700;
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.22);
}

.stats-amount {
  padding: 10px 12px;
}

.referals-list {
  display: grid;
  gap: 10px;
  padding: 12px;
  overflow: hidden;
}

.referal-item {
  min-height: 70px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid #eef2f7;
}

.user-info {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info-more {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name {
  overflow: hidden;
  color: #0f172a;
  font-size: 15px;
  line-height: 20px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reg-date {
  color: #64748b;
  font-size: 12px;
  line-height: 16px;
  font-weight: 600;
}

.user-amount {
  padding: 8px 10px;
}

.wrap-img,
.empty-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 11px;
  color: #2563eb;
}

.wrap-img img,
.empty-icon img {
  width: 24px;
  height: 24px;
  filter: invert(34%) sepia(98%) saturate(1817%) hue-rotate(211deg) brightness(95%) contrast(95%);
}

.empty-referals {
  min-height: 250px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 38px 20px;
  text-align: center;
  gap: 12px;
  border-radius: 22px;
  background:
    radial-gradient(170px 120px at 50% 18%, rgba(37, 99, 235, 0.12), transparent 72%),
    #f8fafc;
  animation: fadeIn 0.42s ease both;
}

.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 22px;
  padding: 16px;
  box-shadow: 0 14px 24px rgba(37, 99, 235, 0.14);
}

.empty-title {
  margin: 4px 0 0;
  color: #0f172a;
  font-size: 20px;
  line-height: 24px;
  font-weight: 750;
  letter-spacing: -0.02em;
}

.empty-description {
  max-width: 300px;
  margin: 0;
  color: #64748b;
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
}

.copied-notification {
  position: fixed;
  left: 50%;
  bottom: calc(104px + env(safe-area-inset-bottom));
  z-index: 6000;
  transform: translateX(-50%);
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(15, 23, 42, 0.92);
  color: #ffffff;
  padding: 11px 18px;
  font-size: 14px;
  line-height: 18px;
  font-weight: 700;
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.24);
  backdrop-filter: blur(14px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

:global(.dark-theme) .referal-page {
  background: #0d1b2a !important;
  color: #ffffff !important;
}

:global(.dark-theme) .header h1,
:global(.dark-theme) .stats-info h2,
:global(.dark-theme) .user-name,
:global(.dark-theme) .empty-title,
:global(.dark-theme) .referal-box-value span {
  color: #ffffff !important;
}

:global(.dark-theme) .back-arrow {
  background: rgba(30, 39, 59, 0.96) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  filter: brightness(0) invert(1);
  box-shadow: 0 16px 30px rgba(0, 0, 0, 0.28) !important;
}

:global(.dark-theme) .referal-section,
:global(.dark-theme) .referals-list {
  background: rgba(30, 39, 59, 0.96) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.34) !important;
}

:global(.dark-theme) .referal-box-value,
:global(.dark-theme) .referal-item,
:global(.dark-theme) .empty-referals {
  background: rgba(13, 27, 42, 0.58) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
}

:global(.dark-theme) .referal-section h3,
:global(.dark-theme) .stats-count,
:global(.dark-theme) .reg-date,
:global(.dark-theme) .empty-description {
  color: #94a3b8 !important;
}

:global(.dark-theme) .wrap-img,
:global(.dark-theme) .empty-icon,
:global(.dark-theme) .referal-box-value img {
  background: rgba(37, 98, 235, 0.18) !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
}

:global(.dark-theme) .wrap-img img,
:global(.dark-theme) .empty-icon img,
:global(.dark-theme) .referal-box-value img {
  filter: brightness(0) invert(1) opacity(0.92) !important;
}

@media (max-width: 380px) {
  .referal-page {
    padding-inline: 12px;
  }

  .header h1 {
    font-size: 22px;
  }

  .banner {
    min-height: 164px;
    padding: 20px;
  }

  .banner h2 {
    font-size: 25px;
    line-height: 31px;
  }
}
</style>
