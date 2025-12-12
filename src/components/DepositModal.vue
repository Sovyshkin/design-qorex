<template>
  <div class="deposit-modal-overlay" @click="closeModal">
    <div class="deposit-modal" @click.stop>
      <div class="modal-header">
        <h3>{{ t('deposit_payment') }}</h3>
        <button class="close-btn" @click="closeModal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      
      <div class="modal-content">
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>{{ t('loading_payment_page') }}</p>
        </div>
        
        <iframe
          v-if="paymentUrl && !loading"
          ref="paymentFrame"
          src="https://pay.cryptocloud.plus/3004J5FJ?lang=ru"
          class="payment-iframe"
          @load="onIframeLoad"
          title="Payment Page"
        ></iframe>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  paymentUrl: {
    type: String,
    required: true
  },
  show: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'payment-success']);

const loading = ref(true);
const paymentFrame = ref(null);

const closeModal = () => {
  emit('close');
};

const onIframeLoad = () => {
  loading.value = false;
  
  // Пытаемся отслеживать изменения URL в iframe для определения успешной оплаты
  try {
    const iframe = paymentFrame.value;
    if (iframe && iframe.contentWindow) {
      // Проверяем URL на успешные паттерны
      const checkPaymentSuccess = () => {
        try {
          const iframeUrl = iframe.contentWindow.location.href;
          if (iframeUrl.includes('success') || iframeUrl.includes('completed') || iframeUrl.includes('paid')) {
            emit('payment-success');
          }
        } catch (error) {
          // Кросс-доменные ограничения - это нормально
        }
      };
      
      // Проверяем каждые 2 секунды
      const checkInterval = setInterval(checkPaymentSuccess, 2000);
      
      // Останавливаем проверку через 10 минут
      setTimeout(() => {
        clearInterval(checkInterval);
      }, 600000);
    }
  } catch (error) {
    // Кросс-доменные ограничения
    console.log('Cannot access iframe content due to CORS policy');
  }
};

const handleKeyDown = (event) => {
  if (event.key === 'Escape') {
    closeModal();
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
  // Блокируем скролл body
  document.body.style.overflow = 'hidden';
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
  // Восстанавливаем скролл body
  document.body.style.overflow = '';
});
</script>

<style scoped>
.deposit-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
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

.deposit-modal {
  background: white;
  border-radius: 20px;
  width: 95vw;
  height: 90vh;
  max-width: 800px;
  max-height: 600px;
  display: flex;
  flex-direction: column;
  box-shadow: 
    0 32px 64px -12px rgba(0, 0, 0, 0.25),
    0 20px 25px -5px rgba(0, 0, 0, 0.1);
  animation: modalSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
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

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #141414;
}

.close-btn {
  background: none;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #666;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #141414;
}

.modal-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #deec51;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-container p {
  margin: 0;
  color: #666;
  font-size: 16px;
}

.payment-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
}

/* Темная тема */
.dark-theme .deposit-modal {
  background: #2a2a2a !important;
}

.dark-theme .modal-header {
  border-bottom-color: #404040 !important;
}

.dark-theme .modal-header h3 {
  color: #ffffff !important;
}

.dark-theme .close-btn {
  color: #cccccc !important;
}

.dark-theme .close-btn:hover {
  background: #404040 !important;
  color: #ffffff !important;
}

.dark-theme .loading-container p {
  color: #cccccc !important;
}

.dark-theme .loading-spinner {
  border-color: #404040 !important;
  border-top-color: #deec51 !important;
}

/* Адаптивность */
@media (max-width: 768px) {
  .deposit-modal {
    width: 98vw;
    height: 95vh;
    border-radius: 16px;
  }
  
  .modal-header {
    padding: 16px 20px;
  }
  
  .modal-header h3 {
    font-size: 18px;
  }
}
</style>