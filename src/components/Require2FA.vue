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
  min-height: 100vh;
  padding: 32px 24px;
  text-align: center;
}

.icon-container {
  width: 120px;
  height: 120px;
  background: #deec51;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32px;
  box-shadow: 0 20px 40px rgba(222, 236, 81, 0.3), 0 0 0 8px rgba(222, 236, 81, 0.1);
  animation: float 3s ease-in-out infinite;
}

.security-icon {
  width: 64px;
  height: 64px;
  filter: brightness(0) invert(1);
}

h2 {
  font-size: 28px;
  font-weight: 700;
  color: #141414;
  margin: 0 0 16px 0;
  letter-spacing: -0.5px;
}

.description {
  font-size: 18px;
  color: #666;
  line-height: 1.6;
  margin: 0 0 40px 0;
  max-width: 380px;
  opacity: 0.9;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 320px;
}

.btn-primary,
.btn-secondary {
  width: 100%;
  padding: 18px;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.btn-primary {
  background: #deec51;
  color: #141414;
  box-shadow: 0 8px 25px rgba(222, 236, 81, 0.3);
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  transition: left 0.6s;
}

.btn-primary:hover::before {
  left: 100%;
}

.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 15px 35px rgba(222, 236, 81, 0.4);
}

.btn-primary:active {
  transform: translateY(-1px);
  box-shadow: 0 5px 15px rgba(222, 236, 81, 0.3);
}

.btn-secondary {
  background: #f5f5f5;
  color: #141414;
  border: 2px solid #e9ecef;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border-color: rgba(0, 0, 0, 0.2);
}

.btn-secondary:active {
  transform: translateY(0);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

/* Анимации */
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* Адаптивность */
@media (max-width: 480px) {
  .require-2fa {
    padding: 24px 16px;
  }
  
  h2 {
    font-size: 24px;
  }
  
  .description {
    font-size: 16px;
    max-width: 320px;
  }
  
  .icon-container {
    width: 100px;
    height: 100px;
    margin-bottom: 24px;
  }
  
  .security-icon {
    width: 50px;
    height: 50px;
  }
}
</style>
