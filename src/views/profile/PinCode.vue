<script setup>
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useWalletStore } from "../../stores/walletStore.ts";
import { useRouter, useRoute } from 'vue-router';
import Cookies from "js-cookie";

const { t } = useI18n();
const walletStore = useWalletStore();
const router = useRouter();
const route = useRoute()

const pin = ref("");
const pressedButton = ref(null);
const errorMessage = ref("");

// Определяем режим работы на основе маршрута и параметров
const isCreateMode = route.name === 'createPin' || route.query.createMode || false

console.log('PinCode режим:', {
  routeName: route.name,
  createMode: route.query.createMode,
  isCreateMode
});

const handleNumberClick = (num) => {
  if (pin.value.length < 4) {
    pin.value += num.toString();
    errorMessage.value = ""; // Сбрасываем ошибку при новом вводе
  }

  if (pin.value.length === 4) {
    if (isCreateMode) {
      walletStore.setPinCode(pin.value);
    } else {
      // Проверяем, активен ли пин-код в системе (на основе данных сервера)
      if (!walletStore.codePasswordActive) {
        // Пин-код не активен на сервере, очищаем локальные данные
        walletStore.clearAllPinData();
        errorMessage.value = 'PIN-код не активен на сервере';
        console.error('PIN-код не активен на сервере');
        return;
      }
      
      console.log('Проверяем PIN в PinCode.vue:', {
        enteredPin: pin.value,
        enteredPinType: typeof pin.value,
        codePasswordActive: walletStore.codePasswordActive,
        storedPin: walletStore.pinCode,
        storedPinType: typeof walletStore.pinCode
      });

      if (walletStore.verifyPin(pin.value)) {
        console.log('PIN верный, перенаправляем');
        // Сохраняем время успешного ввода PIN
        localStorage.setItem('pinVerified', Date.now().toString());
        // Возвращаемся назад или на главную страницу
        const returnTo = route.query.returnTo || '/';
        router.push(returnTo);
      } else {
        // Проверяем, загружен ли PIN-код из сервера
        if (walletStore.pinCode === undefined || walletStore.pinCode === null || walletStore.pinCode === "") {
          errorMessage.value = 'PIN-код не загружен из сервера';
          console.error('PIN-код не загружен из сервера:', walletStore.pinCode);
        } else {
          console.log('PIN неверный, показываем ошибку');
          errorMessage.value = t('wrong_pin');
        }
        pin.value = "";
      }
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

  // Если это не режим создания, убеждаемся что данные загружены
  if (!isCreateMode) {
    // Загружаем актуальные данные пользователя если нужно
    if (!walletStore.user.tg_id) {
      await walletStore.getUserInfo();
      if (walletStore.userTg && walletStore.userTg.id) {
        await walletStore.getUser();
      }
    }

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
        @mousedown="startPress('delete')"
        @mouseup="endPress()"
        @mouseleave="endPress()"
        :class="{ pressed: pressedButton === 'delete' }"
      >
        <img src="@/assets/delete.png" alt="Delete" class="delete-icon" />
      </button>
    </div>
  </main>
  <header class="header">
    <div class="emp"></div> <!-- Убираем кнопку назад при вводе PIN -->
    <h1>{{ isCreateMode ? t('create_pincode') : t('enter_pincode') }}</h1>
    <div class="emp"></div>
  </header>
  <main class="pin-code-container">
    <!-- DEBUG BLOCK -->
    <div style="background: #222; color: #fff; font-size: 12px; padding: 10px; border-radius: 8px; margin-bottom: 12px;">
      <strong>DEBUG:</strong>
      <div>route.name: {{ $route.name }}</div>
      <div>isCreateMode: {{ isCreateMode }}</div>
      <div>codePasswordActive: {{ walletStore.codePasswordActive }}</div>
      <div>pinCode (store): {{ walletStore.pinCode }}</div>
      <div>typeof pinCode: {{ typeof walletStore.pinCode }}</div>
      <div>enteredPin: {{ pin }}</div>
      <div>typeof enteredPin: {{ typeof pin }}</div>
      <div>user.tg_id: {{ walletStore.user?.tg_id }}</div>
      <div>user.id: {{ walletStore.user?.id }}</div>
      <div>userTg.id: {{ walletStore.userTg?.id }}</div>
      <div>getUser loaded: {{ !!walletStore.user }}</div>
      <div>errorMessage: {{ errorMessage }}</div>
      <div>pinVerified (localStorage): {{ localStorage.getItem('pinVerified') }}</div>
      <div>hasPinCode: {{ walletStore.hasPinCode() }}</div>
    </div>
    <!-- END DEBUG BLOCK -->

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
        @mousedown="startPress(0)"
        @mouseup="endPress()"
        @mouseleave="endPress()"
        :class="{ pressed: pressedButton === 0 }"
      >
        0
      </button>
      
      <button class="pin-button del" @click="deleteLast">
        ←
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

.pin-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
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
  background-color: #f5f5f5;
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