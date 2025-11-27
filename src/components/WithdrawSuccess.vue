<template>
  <div class="withdraw-success-overlay" @click="closeModal">
    <div class="withdraw-success-modal" @click.stop>
      <div class="success-animation">
        <!-- Анимированная галочка -->
        <div class="checkmark-container">
          <svg class="checkmark" viewBox="0 0 52 52">
            <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
            <path class="checkmark-check" fill="none" d="m14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
        </div>
        
        <!-- Анимированные частицы -->
        <div class="particles">
          <div class="particle" v-for="n in 8" :key="n" :style="getParticleStyle(n)"></div>
        </div>
      </div>

      <div class="success-content">
        <h2 class="success-title">{{ t('withdraw_request_sent') }}</h2>
        <p class="success-description">{{ t('withdraw_processing_message') }}</p>
        
        <div class="transaction-info">
          <div class="info-item">
            <span class="info-label">{{ t('withdraw_amount') }}</span>
            <span class="info-value">{{ amount }} USDT</span>
          </div>
          <div class="info-item">
            <span class="info-label">{{ t('select_network') }}</span>
            <span class="info-value">{{ network }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">{{ t('wallet_address') }}</span>
            <span class="info-value">{{ truncateAddress(walletAddress) }}</span>
          </div>
        </div>

        <div class="action-buttons">
          <button class="btn-secondary" @click="goToHistory">
            {{ t('view_history') }}
          </button>
          <button class="btn-primary" @click="closeModal">
            {{ t('continue') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { onMounted, onUnmounted } from 'vue';

const { t } = useI18n();
const router = useRouter();

const props = defineProps({
  amount: {
    type: String,
    required: true
  },
  network: {
    type: String,
    required: true
  },
  walletAddress: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['close']);

const closeModal = () => {
  emit('close');
};

const goToHistory = () => {
  router.push({ name: 'history' });
  closeModal();
};

const truncateAddress = (address) => {
  if (!address) return '';
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
};

const getParticleStyle = (index) => {
  const angle = (index - 1) * 45; // 360 / 8 = 45 degrees
  const distance = 80;
  const x = Math.cos(angle * Math.PI / 180) * distance;
  const y = Math.sin(angle * Math.PI / 180) * distance;
  
  return {
    '--x': `${x}px`,
    '--y': `${y}px`,
    '--delay': `${index * 0.1}s`
  };
};

const handleKeyDown = (event) => {
  if (event.key === 'Escape') {
    closeModal();
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.withdraw-success-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: overlayFadeIn 0.3s ease-out;
}

@keyframes overlayFadeIn {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(10px);
  }
}

.withdraw-success-modal {
  background: white;
  border-radius: 24px;
  padding: 40px 30px 30px;
  max-width: 90vw;
  width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 
    0 32px 64px -12px rgba(0, 0, 0, 0.25),
    0 20px 25px -5px rgba(0, 0, 0, 0.1);
  animation: modalSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(100px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.success-animation {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  margin-bottom: 30px;
}

.checkmark-container {
  position: relative;
  z-index: 2;
}

.checkmark {
  width: 80px;
  height: 80px;
  margin: 0 auto;
}

.checkmark-circle {
  stroke: #deec51;
  stroke-width: 2;
  stroke-miterlimit: 10;
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
  fill: none;
}

.checkmark-check {
  transform-origin: 50% 50%;
  stroke: #deec51;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-miterlimit: 10;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards;
}

@keyframes stroke {
  100% {
    stroke-dashoffset: 0;
  }
}

.particles {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: linear-gradient(45deg, #deec51, #f9f871);
  border-radius: 50%;
  animation: particleFloat 2s ease-out var(--delay) infinite;
  opacity: 0;
}

@keyframes particleFloat {
  0% {
    transform: translate(0, 0) scale(0);
    opacity: 1;
  }
  50% {
    opacity: 1;
    transform: translate(calc(var(--x) * 0.5), calc(var(--y) * 0.5)) scale(1);
  }
  100% {
    transform: translate(var(--x), var(--y)) scale(0);
    opacity: 0;
  }
}

.success-content {
  text-align: center;
}

.success-title {
  font-size: 24px;
  font-weight: 700;
  color: #141414;
  margin: 0 0 12px 0;
  animation: textSlideUp 0.5s ease-out 0.3s both;
}

.success-description {
  font-size: 16px;
  color: #666;
  line-height: 1.5;
  margin: 0 0 30px 0;
  animation: textSlideUp 0.5s ease-out 0.4s both;
}

@keyframes textSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.transaction-info {
  background: #f8f9fa;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 30px;
  animation: contentFadeIn 0.5s ease-out 0.5s both;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.info-item:not(:last-child) {
  border-bottom: 1px solid #e5e7eb;
}

.info-label {
  font-size: 14px;
  color: #666;
  font-weight: 400;
}

.info-value {
  font-size: 14px;
  color: #141414;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 12px;
  animation: contentFadeIn 0.5s ease-out 0.6s both;
}

@keyframes contentFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: 14px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #deec51;
  color: #141414;
}

.btn-primary:hover {
  background: #d5d946;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px -8px rgba(222, 236, 81, 0.5);
}

.btn-secondary {
  background: transparent;
  color: #666;
  border: 1px solid #e5e7eb;
}

.btn-secondary:hover {
  background: #f8f9fa;
  color: #141414;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px -8px rgba(0, 0, 0, 0.1);
}

.btn-primary:active,
.btn-secondary:active {
  transform: translateY(0);
}
</style>