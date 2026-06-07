<script setup>
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useWalletStore } from "../../stores/walletStore.ts";
import { useRouter, useRoute } from 'vue-router';

const { t } = useI18n();
const walletStore = useWalletStore();
const router = useRouter();
const route = useRoute()

const pin = ref("");
const pressedButton = ref(null);
const errorMessage = ref("");

// Определяем режим работы на основе маршрута и параметров
const isCreateMode = route.name === 'createPin' || route.query.createMode || false

const isProcessing = ref(false);

const handleNumberClick = async (num) => {
  if (isProcessing.value) return;
  
  if (pin.value.length < 4) {
    pin.value += num.toString();
    errorMessage.value = ""; // Сбрасываем ошибку при новом вводе
  }

  if (pin.value.length === 4) {
    isProcessing.value = true;
    
    try {
      if (isCreateMode) {
        await walletStore.setPinCode(pin.value);
      } else {
        if (walletStore.verifyPin(pin.value)) {
          console.log('PIN верный, устанавливаем статус и перенаправляем');
          // Устанавливаем статус верификации PIN в localStorage
          localStorage.setItem('pinVerified', Date.now().toString());
          
          // Сбрасываем isLoading для корректного отображения
          walletStore.isLoading = false;
          
          // Возвращаемся назад или на главную страницу
          const returnTo = route.query.returnTo || '/';
          console.log('Перенаправляем на:', returnTo);
          console.log('Состояние walletStore:', {
            isLoading: walletStore.isLoading,
            user: walletStore.user ? 'loaded' : 'not loaded',
            balance: walletStore.balance
          });
          
          router.push(returnTo);
        } else {
          errorMessage.value = t('wrong_pin');
          pin.value = "";
        }
      }
    } finally {
      setTimeout(() => {
        isProcessing.value = false;
      }, 1000);
    }
  }
};

const handleDeleteClick = () => {
  if (pin.value.length > 0) {
    pin.value = pin.value.slice(0, -1);
    errorMessage.value = ""; // Сбрасываем ошибку при удалении
  }
};

const startPress = (num) => {
  pressedButton.value = num;
};

const endPress = () => {
  pressedButton.value = null;
};

// Если пользователь пытается уйти без ввода PIN, блокируем навигацию
onMounted(async () => {
  console.log('PinCode onMounted:', {
    isCreateMode,
    routeName: route.name,
    codePasswordActive: walletStore.codePasswordActive,
    pinCode: walletStore.pinCode ? '***' : null
  });

  // Если это не режим создания, проверяем статус PIN
  if (!isCreateMode) {
    // Просто проверяем статус PIN без дополнительных запросов
    walletStore.getUserInfo(); // Синхронный вызов без await

    // Проверяем статус PIN-кода из сервера
    if (!walletStore.codePasswordActive) {
      console.log('PIN-код не активен на сервере, перенаправляем на главную');
      // Пин-код не активен на сервере, очищаем локальные данные
      walletStore.clearAllPinData();

      // Перенаправляем на главную страницу
      router.push('/');
      return;
    }

    // Запрещаем возврат без ввода PIN только если пин-код активен
    window.history.pushState(null, null, window.location.href);
    window.onpopstate = function() {
      window.history.pushState(null, null, window.location.href);
    };
  }
});
</script>

<template>
  <header class="header">
    <div class="emp"></div> <!-- Убираем кнопку назад при вводе PIN -->
    <h1>{{ isCreateMode ? t('create_pincode') : t('enter_pincode') }}</h1>
    <div class="emp"></div>
  </header>
  <main class="pin-code-container">
    <div class="pin-dots">
      <div
        v-for="i in 4"
        :key="i"
        class="pin-dot"
        :class="{ active: pin.length >= i }"
      ></div>
    </div>

    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <div class="pin-grid">
      <button
        v-for="num in [1, 2, 3, 4, 5, 6, 7, 8, 9]"
        :key="num"
        class="pin-button"
        @click="handleNumberClick(num)"
        @touchstart.prevent="startPress(num)"
        @touchend.prevent="endPress(); handleNumberClick(num)"
        @mousedown="startPress(num)"
        @mouseup="endPress()"
        @mouseleave="endPress()"
        :class="{ pressed: pressedButton === num }"
      >
        {{ num }}
      </button>
      
      <div class="empty-cell"></div>
      
      <button
        class="pin-button"
        @click="handleNumberClick(0)"
        @touchstart.prevent="startPress(0)"
        @touchend.prevent="endPress(); handleNumberClick(0)"
        @mousedown="startPress(0)"
        @mouseup="endPress()"
        @mouseleave="endPress()"
        :class="{ pressed: pressedButton === 0 }"
      >
        0
      </button>
      
      <button
        class="pin-button delete-button"
        @click="handleDeleteClick"
        @touchstart.prevent="startPress('delete')"
        @touchend.prevent="endPress(); handleDeleteClick()"
        @mousedown="startPress('delete')"
        @mouseup="endPress()"
        @mouseleave="endPress()"
        :class="{ pressed: pressedButton === 'delete' }"
      >
        <img src="@/assets/delete.png" alt="Delete" class="delete-icon" />
      </button>
    </div>
  </main>
</template>

<style scoped>
.error-message {
  color: #ff4444;
  margin-bottom: 20px;
  font-size: 14px;
}

.pin-code-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  gap: 30px;
  touch-action: manipulation;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
}

.pin-dots {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-bottom: 20px;
}

.pin-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #ddd;
  background-color: transparent;
  transition: all 0.3s ease;
}

.pin-dot.active {
  background-color: #2563EB;
  border-color: #2563EB;
}

.pin-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  max-width: 280px;
  width: 100%;
}

.pin-button {
  width: 100%;
  height: 80px;
  border: none;
  border-radius: 30px;
  background-color: #fff;
  font-size: 24px;
  font-weight: bold;
  color: #333;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  touch-action: manipulation;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.pin-button:active,
.pin-button.pressed {
  background-color: #e0e0e0;
  transform: scale(0.95);
}

.pin-button::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.5);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1, 1) translate(-50%, -50%);
  transform-origin: 50% 50%;
}

.pin-button:active::after,
.pin-button.pressed::after {
  animation: ripple 0.6s ease-out;
}

.empty-cell {
  visibility: hidden;
}

.delete-button {
  background-color: #F1F5F9;
  color: #666;
}

.delete-icon {
  width: 24px;
  height: 24px;
}

@keyframes ripple {
  0% {
    transform: scale(0, 0);
    opacity: 1;
  }
  100% {
    transform: scale(20, 20);
    opacity: 0;
  }
}
</style>