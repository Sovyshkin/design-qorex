<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Способ оплаты</h3>
        <button class="close-btn" @click="closeModal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      
      <div class="modal-body">
        <p class="description">Выберите удобный способ оплаты:</p>
        
        <div class="choice-buttons">
          <button class="choice-btn copy-btn" @click="copyLink">
            <div class="btn-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="btn-content">
              <span class="btn-title">Скопировать ссылку</span>
              <span class="btn-subtitle">Открыть в браузере</span>
            </div>
          </button>
          
          <button class="choice-btn iframe-btn" @click="openInApp">
            <div class="btn-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 15l3-3-3-3m0 6l-3-3 3-3m0 6V9m9 3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="btn-content">
              <span class="btn-title">Открыть в приложении</span>
              <span class="btn-subtitle">Встроенный браузер</span>
            </div>
          </button>
        </div>
        
        <div class="payment-info">
          <div class="info-item">
            <span class="info-label">Сумма:</span>
            <span class="info-value">{{ amount }} USDT</span>
          </div>
          <div class="info-item">
            <span class="info-label">Сеть:</span>
            <span class="info-value">{{ networkName }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineEmits } from 'vue';

const props = defineProps({
  paymentUrl: {
    type: String,
    required: true
  },
  amount: {
    type: String,
    required: true
  },
  networkName: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['close', 'copy-link', 'open-in-app']);

const closeModal = () => {
  emit('close');
};

const copyLink = () => {
  emit('copy-link', props.paymentUrl);
};

const openInApp = () => {
  emit('open-in-app', props.paymentUrl);
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: calc(100% - 40px);
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.3),
    0 8px 24px rgba(0, 0, 0, 0.2);
  animation: modalSlideUp 0.3s ease-out;
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #141414;
}

.close-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #6b7280;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 24px;
}

.description {
  margin: 0 0 24px 0;
  color: #6b7280;
  font-size: 14px;
  text-align: center;
}

.choice-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.choice-btn {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  width: 100%;
}

.choice-btn:hover {
  border-color: #deec51;
  background: #fefce8;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(222, 236, 81, 0.2);
}

.copy-btn:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.copy-btn:hover .btn-icon {
  color: #3b82f6;
}

.iframe-btn:hover {
  border-color: #deec51;
  background: #fefce8;
}

.iframe-btn:hover .btn-icon {
  color: #84cc16;
}

.btn-icon {
  flex-shrink: 0;
  color: #6b7280;
  transition: color 0.3s ease;
}

.btn-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.btn-title {
  font-size: 16px;
  font-weight: 600;
  color: #141414;
}

.btn-subtitle {
  font-size: 12px;
  color: #6b7280;
}

.payment-info {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 14px;
  color: #6b7280;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: #141414;
}

/* Темная тема */
.dark-theme .modal-content {
  background: #2a2a2a !important;
}

.dark-theme .modal-header {
  border-bottom-color: #404040 !important;
}

.dark-theme .modal-header h3 {
  color: #ffffff !important;
}

.dark-theme .description {
  color: #cccccc !important;
}

.dark-theme .choice-btn {
  background: #2a2a2a !important;
  border-color: #404040 !important;
}

.dark-theme .choice-btn:hover {
  background: #3a3a3a !important;
}

.dark-theme .copy-btn:hover {
  background: #1e3a5f !important;
  border-color: #3b82f6 !important;
}

.dark-theme .iframe-btn:hover {
  background: #2d3a1a !important;
  border-color: #deec51 !important;
}

.dark-theme .btn-title {
  color: #ffffff !important;
}

.dark-theme .btn-subtitle,
.dark-theme .btn-icon {
  color: #cccccc !important;
}

.dark-theme .payment-info {
  background: #1a1a1a !important;
}

.dark-theme .info-label {
  color: #cccccc !important;
}

.dark-theme .info-value {
  color: #ffffff !important;
}

.dark-theme .close-btn {
  color: #cccccc !important;
}

.dark-theme .close-btn:hover {
  background: #404040 !important;
  color: #ffffff !important;
}
</style>