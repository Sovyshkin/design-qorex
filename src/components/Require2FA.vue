<template>
  <div class="require-2fa">
    <div class="icon-container">
      <img src="/assets/safety.svg" alt="Security" class="security-icon" />
    </div>
    
    <h2>{{ t('require_2fa_title') }}</h2>
    <p class="description">{{ t('require_2fa_description') }}</p>
    
    <div class="actions">
      <button class="btn-primary" @click="goToSecurity">
        {{ t('enable_2fa') }}
      </button>
      <button class="btn-secondary" @click="goBack">
        {{ t('go_back') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const router = useRouter();

const goToSecurity = () => {
  router.push({ name: 'twoFactorAuth', query: { from: 'transfer' } });
};

const goBack = () => {
  router.back();
};
</script>

<style scoped>
.require-2fa {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 160px);
  padding: 32px 24px;
  text-align: center;
}

.icon-container {
  width: 120px;
  height: 120px;
  background: #262626;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32px;
}

.security-icon {
  width: 64px;
  height: 64px;
  filter: brightness(0) invert(1);
}

h2 {
  font-size: 24px;
  font-weight: 600;
  color: #141414;
  margin: 0 0 16px 0;
}

.description {
  font-size: 16px;
  color: #666;
  line-height: 1.5;
  margin: 0 0 40px 0;
  max-width: 320px;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 320px;
}

.btn-primary,
.btn-secondary {
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #deec51;
  color: #141414;
}

.btn-primary:active {
  transform: scale(0.98);
  background: #d0de49;
}

.btn-secondary {
  background: #f5f5f5;
  color: #141414;
}

.btn-secondary:active {
  transform: scale(0.98);
  background: #e5e5e5;
}
</style>
