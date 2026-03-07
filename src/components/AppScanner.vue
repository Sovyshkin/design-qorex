<template>
  <div class="app-scanner-container">
    <div class="wrap-load" v-if="walletStore.loaderScan">
      <LoaderScanner/>
    </div>
    <div class="qr-scanner-fullscreen">
      <!-- Кнопка закрытия -->
      <button class="close-btn" @click="goBack">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M18 6L6 18M6 6L18 18"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </button>

      <!-- Простое видео с камеры -->
      <video 
        ref="videoElement" 
        class="camera-video" 
        autoplay 
        playsinline 
        muted
        @loadedmetadata="onVideoLoaded"
      ></video>

      <!-- Оверлей с рамкой -->
      <div class="scanner-overlay">
        <div class="scan-frame">
          <span></span>
        </div>
        <div class="hint">
          <span v-if="cameraReady">Наведите камеру на QR-код для оплаты</span>
          <span v-else>Инициализация камеры...</span>
        </div>
      </div>

      <!-- Контролы -->
      <div class="controls">
        <!-- Левые кнопки -->
        <div class="controls-left">
          <!-- Кнопка выбора файла -->
          <label class="control-btn file-btn">
            <input type="file" accept="image/*" @change="handleFileUpload" hidden />
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 16L8.586 11.414C9.367 10.633 10.633 10.633 11.414 11.414L16 16M14 14L15.586 12.414C16.367 11.633 17.633 11.633 18.414 12.414L20 14M14 8H14.01M6 20H18C19.105 20 20 19.105 20 18V6C20 4.895 19.105 4 18 4H6C4.895 4 4 4.895 4 6V18C4 19.105 4.895 20 6 20Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </label>

          <!-- Кнопка вставки ссылки -->
          <button class="control-btn paste-btn" @click="openPasteLinkModal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5M12 12H15M12 16H15M9 12H9.01M9 16H9.01" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>

        <!-- Правая кнопка -->
        <div class="controls-right">
          <!-- Кнопка фонарика -->
          <button class="control-btn torch-btn" @click="toggleTorch">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.071 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.894-.353-1.75-.988-2.386l-.548-.547z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Основная кнопка сканирования (центрированная) -->
      <button class="scan-button" @click="captureAndScanManual" :disabled="!cameraReady || isManualScanning">
        <div class="scan-button-circle" :class="{ scanning: isManualScanning }"></div>
      </button>

      <!-- Красивое сообщение для пользователя -->
      <div v-if="showMessage" class="message-overlay" @click="hideMessage">
        <div class="message-container" :class="messageType" @click.stop>
          <div class="message-icon">
            <svg v-if="messageType === 'error'" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg v-else-if="messageType === 'success'" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" class="scan-icon">
              <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M10 12h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 10v4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="message-text">{{ messageText }}</div>
        </div>
      </div>

      <!-- Модальное окно для ввода суммы -->
      <div v-if="showAmountModal" class="amount-modal-overlay" @click="closeAmountModal">
        <div class="amount-modal" @click.stop>
          <div class="modal-header">
            <h3>Введите сумму платежа</h3>
            <p>QR-код не содержит сумму платежа. Укажите сумму для продолжения.</p>
          </div>
          
          <div class="amount-input-container">
            <input 
              v-model="amountInput" 
              type="text" 
              inputmode="decimal"
              placeholder="0.00"
              class="amount-input"
              :class="{ error: amountError }"
              @keyup.enter="confirmAmount"
              @input="amountError = ''"
              autofocus
            />
            <span class="currency-label">₽</span>
          </div>
          
          <div v-if="amountError" class="amount-error">
            {{ amountError }}
          </div>
          
          <div class="modal-buttons">
            <button class="cancel-btn" @click="closeAmountModal">
              Отмена
            </button>
            <button 
              class="confirm-btn" 
              @click="confirmAmount"
              :disabled="!amountInput.trim()"
            >
              Подтвердить
            </button>
          </div>
        </div>
      </div>

      <!-- Модальное окно подтверждения платежа -->
      <div v-if="showPaymentModal" class="payment-modal-overlay" @click="closePaymentModal">
        <div class="payment-modal" @click.stop>
          <div class="payment-header">
            <div class="payment-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" class="qr-payment-icon">
                <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" stroke-width="2" fill="currentColor" opacity="0.3"/>
              </svg>
            </div>
            <h3>Подтверждение платежа</h3>
            <p>Проверьте данные платежа перед подтверждением</p>
          </div>
          
          <div class="payment-details">
            <div class="amount-display">
              <div class="amount-label">Сумма к оплате</div>
              <div class="amount-value">
                <span class="amount-number">{{ paymentAmount }}</span>
                <span class="amount-currency">₽</span>
              </div>
            </div>
            
            <div class="payment-info">
              <div class="info-item">
                <div class="info-label">Способ оплаты</div>
                <div class="info-value">QR-код</div>
              </div>
            </div>
          </div>
          
          <div class="payment-buttons">
            <button class="payment-cancel-btn" @click="closePaymentModal" :disabled="isProcessingPayment">
              Отмена
            </button>
            <button 
              class="payment-confirm-btn" 
              @click="confirmPayment"
              :disabled="isProcessingPayment"
              :class="{ processing: isProcessingPayment }"
            >
              <div v-if="isProcessingPayment" class="processing-spinner"></div>
              <span v-if="!isProcessingPayment">Подтвердить оплату</span>
              <span v-else>Обработка...</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Модальное окно для вставки ссылки -->
      <div v-if="showPasteLinkModal" class="paste-link-modal-overlay" @click="closePasteLinkModal">
        <div class="paste-link-modal" @click.stop>
          <div class="modal-header">
            <h3>Вставить ссылку оплаты</h3>
            <p>Вставьте ссылку из QR-кода для быстрой оплаты</p>
          </div>
          
          <div class="paste-link-input-container">
            <textarea 
              v-model="pasteLink" 
              placeholder="https://..."
              class="paste-link-input"
              :class="{ error: pasteLinkError }"
              @keyup.enter="confirmPasteLink"
              @input="pasteLinkError = ''"
              rows="4"
              autofocus
            ></textarea>
          </div>
          
          <div v-if="pasteLinkError" class="paste-link-error">
            {{ pasteLinkError }}
          </div>
          
          <div class="modal-buttons">
            <button class="cancel-btn" @click="closePasteLinkModal">
              Отмена
            </button>
            <button 
              class="confirm-btn" 
              @click="confirmPasteLink"
              :disabled="!pasteLink.trim()"
            >
              Подтвердить
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useWalletStore } from '@/stores/walletStore';
import QrScanner from 'qr-scanner';
import LoaderScanner from './LoaderScanner.vue';

const router = useRouter();
const { t } = useI18n();
const walletStore = useWalletStore();

// Refs для работы с видео
const videoElement = ref(null);
const qrScanner = ref(null);
const scanInterval = ref(null);

// Состояние сканнера
const cameraReady = ref(false);
const isManualScanning = ref(false);
const showMessage = ref(false);
const messageText = ref('');
const messageType = ref('info');
const torchEnabled = ref(false);
const isProcessingQR = ref(false); // Флаг для предотвращения дублирования обработки

// Состояние модального окна для ввода суммы
const showAmountModal = ref(false);
const amountInput = ref('');
const pendingQrData = ref('');
const amountError = ref('');

// Состояние модального окна подтверждения платежа
const showPaymentModal = ref(false);
const paymentAmount = ref('');
const paymentUrl = ref('');
const isProcessingPayment = ref(false);

// Состояние модального окна для вставки ссылки
const showPasteLinkModal = ref(false);
const pasteLink = ref('');
const pasteLinkError = ref('');

// Функция для отображения сообщений
const showMessageWithType = (text, type = 'info', duration = 3000) => {
  messageText.value = text;
  messageType.value = type;
  showMessage.value = true;
  
  setTimeout(() => {
    hideMessage();
  }, duration);
};

const hideMessage = () => {
  showMessage.value = false;
};

// Инициализация камеры и сканнера
const initCamera = async () => {
  try {
    // Проверяем поддержку камеры
    const hasCamera = await QrScanner.hasCamera();
    
    if (!hasCamera) {
      throw new Error('Камера не найдена');
    }

    if (!videoElement.value) {
      throw new Error('Видео элемент не найден');
    }

    // Создаем QR-сканнер
    qrScanner.value = new QrScanner(
      videoElement.value,
      (result) => {
        handleQRDetected(result.data);
      },
      {
        returnDetailedScanResult: true,
        highlightScanRegion: false,
        highlightCodeOutline: false,
        preferredCamera: 'environment', // Задняя камера
        maxScansPerSecond: 3, // Увеличиваем частоту сканирования
        calculateScanRegion: (video) => {
          // Определяем область сканирования в центре экрана
          const smallerDimension = Math.min(video.videoWidth, video.videoHeight);
          const scanSize = Math.round(0.7 * smallerDimension);
          const x = Math.round((video.videoWidth - scanSize) / 2);
          const y = Math.round((video.videoHeight - scanSize) / 2);
          return {
            x: x,
            y: y,
            width: scanSize,
            height: scanSize,
          };
        },
      }
    );

    await qrScanner.value.start();
    
    cameraReady.value = true;
    
    // Запускаем дополнительное принудительное сканирование
    setTimeout(() => {
      if (cameraReady.value) {
        startContinuousScanning();
      }
    }, 1000);

  } catch (error) {
    let errorMessage = 'Не удалось запустить сканнер';
    
    if (error.name === 'NotAllowedError') {
      errorMessage = 'Доступ к камере запрещен. Разрешите доступ в настройках браузера';
    } else if (error.name === 'NotFoundError') {
      errorMessage = 'Камера не найдена';
    } else if (error.name === 'NotSupportedError') {
      errorMessage = 'Ваш браузер не поддерживает доступ к камере';
    } else if (error.name === 'NotReadableError') {
      errorMessage = 'Камера уже используется другим приложением';
    } else if (error.message.includes('Camera not found')) {
      errorMessage = 'Камера не найдена на устройстве';
    }
    
    showMessageWithType(errorMessage, 'error', 6000);
  }
};

// Тестовая функция для проверки работы QrScanner
const testQrScanner = async () => {
  try {
    // Проверяем поддержку камеры
    const hasCamera = await QrScanner.hasCamera();
    
    // Проверяем поддержку WebRTC
    const isWebRTCSupported = !!navigator.mediaDevices?.getUserMedia;
    
    return hasCamera && isWebRTCSupported;
  } catch (error) {
    return false;
  }
};
const onVideoLoaded = () => {
  // QrScanner управляет видео самостоятельно
};

// Сканирование из файла
const scanFromFile = async (file) => {
  try {
    const result = await QrScanner.scanImage(file, {
      returnDetailedScanResult: true,
    });
    
    return result.data;
  } catch (error) {
    return null;
  }
};

// Проверка, является ли строка корректной ссылкой для оплаты
const isValidPaymentUrl = (url) => {
  try {
    // Расширим критерии валидации
    if (!url || typeof url !== 'string') return false;
    
    // Проверяем различные форматы платежных QR-кодов
    const isValidUrl = url.startsWith('http://') || url.startsWith('https://');
    const hasCrypto = url.toLowerCase().includes('bitcoin:') || 
                     url.toLowerCase().includes('ethereum:') || 
                     url.toLowerCase().includes('ton:');
    const hasPaymentParams = url.includes('amount=') || 
                            url.includes('sum=') || 
                            url.includes('value=') ||
                            url.includes('pay') || 
                            url.includes('payment') ||
                            url.includes('invoice');
    
    // Принимаем любой QR-код длиннее 10 символов для тестирования
    const result = isValidUrl || hasCrypto || hasPaymentParams || url.length > 10;
    
    return result;
  } catch (error) {
    return false;
  }
};

// Проверка наличия суммы в URL
const hasAmountInUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    
    // Проверяем различные параметры суммы
    return params.has('amount') || 
           params.has('sum') || 
           params.has('value') ||
           url.includes('amount=') ||
           url.includes('sum=') ||
           url.includes('value=');
  } catch (error) {
    // Если не удается парсить как URL, проверяем строку напрямую
    return url.includes('amount=') || 
           url.includes('sum=') || 
           url.includes('value=');
  }
};

// Парсинг суммы из QR-кода
const parseAmountFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    
    // Проверяем amount (точная сумма в рублях)
    if (params.has('amount')) {
      const amount = parseFloat(params.get('amount'));
      if (!isNaN(amount) && amount > 0) {
        return amount.toFixed(2);
      }
    }
    
    // Проверяем sum (сумма в копейках)
    if (params.has('sum')) {
      const sum = parseInt(params.get('sum'));
      if (!isNaN(sum) && sum > 0) {
        // Конвертируем копейки в рубли (делим на 100)
        return (sum / 100).toFixed(2);
      }
    }
    
    // Проверяем value
    if (params.has('value')) {
      const value = parseFloat(params.get('value'));
      if (!isNaN(value) && value > 0) {
        return value.toFixed(2);
      }
    }
    
    return null;
  } catch (error) {
    // Если не удается парсить как URL, проверяем строку напрямую
    const amountMatch = url.match(/amount=([0-9]+\.?[0-9]*)/i);
    if (amountMatch) {
      const amount = parseFloat(amountMatch[1]);
      if (!isNaN(amount) && amount > 0) {
        return amount.toFixed(2);
      }
    }
    
    const sumMatch = url.match(/sum=([0-9]+)/i);
    if (sumMatch) {
      const sum = parseInt(sumMatch[1]);
      if (!isNaN(sum) && sum > 0) {
        return (sum / 100).toFixed(2);
      }
    }
    
    const valueMatch = url.match(/value=([0-9]+\.?[0-9]*)/i);
    if (valueMatch) {
      const value = parseFloat(valueMatch[1]);
      if (!isNaN(value) && value > 0) {
        return value.toFixed(2);
      }
    }
    
    return null;
  }
};

// Добавление суммы в URL
const addAmountToUrl = (url, amount) => {
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set('amount', amount);
    return urlObj.toString();
  } catch (error) {
    // Если не удается парсить как URL, добавляем параметр как строку
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}amount=${amount}`;
  }
};

// Обработка найденного QR-кода
const handleQRDetected = async (qrData) => {
  // Предотвращаем дублирование обработки
  if (isProcessingQR.value) {
    return;
  }
  
  try {
    isProcessingQR.value = true;
    
    if (!isValidPaymentUrl(qrData)) {
      showMessageWithType('QR-код найден, но не содержит данных для оплаты: ' + qrData.substring(0, 50), 'error', 5000);
      return;
    }
    
    // Останавливаем сканирование
    stopContinuousScanning();
    
    // Проверяем наличие суммы в URL
    if (!hasAmountInUrl(qrData)) {
      // Если суммы нет, показываем модальное окно для ввода
      pendingQrData.value = qrData;
      showAmountModal.value = true;
      isProcessingQR.value = false; // Сбрасываем флаг для возможности дальнейшей обработки
      return;
    }
    
    // Парсим сумму из QR-кода
    const amount = parseAmountFromUrl(qrData);
    if (amount) {
      // Показываем модальное окно подтверждения платежа
      paymentAmount.value = amount;
      paymentUrl.value = qrData;
      showPaymentModal.value = true;
      isProcessingQR.value = false; // Сбрасываем флаг для возможности дальнейшей обработки
    } else {
      showMessageWithType('Не удалось определить сумму платежа', 'error', 3000);
      // Перезапускаем сканирование через 3 секунды
      setTimeout(() => {
        if (qrScanner.value && cameraReady.value) {
          qrScanner.value.start();
          startContinuousScanning();
        }
      }, 3000);
    }
    
  } catch (error) {
    showMessageWithType('Ошибка обработки QR-кода', 'error');
    
    // Перезапускаем сканирование через 3 секунды
    setTimeout(() => {
      if (qrScanner.value && cameraReady.value) {
        qrScanner.value.start();
        startContinuousScanning();
      }
    }, 3000);
  } finally {
    // Сбрасываем флаг через 2 секунды только если не показываем модальное окно
    if (!showAmountModal.value) {
      setTimeout(() => {
        isProcessingQR.value = false;
      }, 2000);
    }
  }
};
// Непрерывное сканирование управляется самим QrScanner
const startContinuousScanning = () => {
  // QrScanner уже сканирует автоматически при запуске
  
  // Добавляем дополнительный механизм принудительного сканирования
  if (scanInterval.value) {
    clearInterval(scanInterval.value);
  }
  
  scanInterval.value = setInterval(async () => {
    if (!cameraReady.value || walletStore.loaderScan || isManualScanning.value || !qrScanner.value || isProcessingQR.value) {
      return;
    }
    
    try {
      // Принудительно пытаемся сканировать текущий кадр
      const video = videoElement.value;
      if (video && video.videoWidth > 0 && video.videoHeight > 0) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        const blob = await new Promise(resolve => {
          canvas.toBlob(resolve, 'image/jpeg', 0.9);
        });
        
        if (blob) {
          try {
            const result = await QrScanner.scanImage(blob, { returnDetailedScanResult: true });
            if (result && result.data) {
              handleQRDetected(result.data);
            }
          } catch (err) {
            // QR-код не найден, это нормально
          }
        }
      }
    } catch (error) {
      // Ошибки принудительного сканирования игнорируем
    }
  }, 2000); // Каждые 2 секунды
};

// Остановка сканирования
const stopContinuousScanning = () => {
  if (qrScanner.value) {
    qrScanner.value.stop();
  }
  
  if (scanInterval.value) {
    clearInterval(scanInterval.value);
    scanInterval.value = null;
  }
};

// Ручное сканирование (по кнопке) - делаем моментальный снимок
const captureAndScanManual = async () => {
  if (!cameraReady.value || isManualScanning.value || !qrScanner.value) {
    return;
  }

  isManualScanning.value = true;
  showMessageWithType('Сканирование...', 'info', 0);

  try {
    // Используем встроенную функцию QrScanner для захвата кадра
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const video = videoElement.value;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    // Конвертируем в blob
    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'image/jpeg', 0.8);
    });
    
    const qrData = await QrScanner.scanImage(blob, { returnDetailedScanResult: true });
    
    if (qrData && qrData.data) {
      if (isValidPaymentUrl(qrData.data)) {
        showMessageWithType('QR-код распознан!', 'success', 1000);
        setTimeout(() => {
          handleQRDetected(qrData.data);
        }, 500);
      } else {
        showMessageWithType('QR-код найден, но не содержит данных для оплаты: ' + qrData.data.substring(0, 50), 'error', 5000);
      }
    } else {
      showMessageWithType('QR-код не найден. Попробуйте еще раз', 'error', 3000);
    }
  } catch (error) {
    showMessageWithType('QR-код не найден в кадре', 'error', 3000);
  } finally {
    isManualScanning.value = false;
  }
};

// Переключение фонарика
const toggleTorch = async () => {
  if (!qrScanner.value) return;

  try {
    const hasFlash = await qrScanner.value.hasFlash();
    
    if (hasFlash) {
      torchEnabled.value = !torchEnabled.value;
      await qrScanner.value.toggleFlash();
      showMessageWithType(torchEnabled.value ? 'Фонарик включен' : 'Фонарик выключен', 'info', 1000);
    } else {
      showMessageWithType('Фонарик не поддерживается', 'error');
    }
  } catch (error) {
    showMessageWithType('Ошибка фонарика', 'error');
  }
};

// Загрузка файла изображения
const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Проверяем тип файла
  if (!file.type.startsWith('image/')) {
    showMessageWithType('Пожалуйста, выберите изображение', 'error', 3000);
    event.target.value = ''; // Сбрасываем input
    return;
  }

  // Проверяем размер файла (максимум 10MB)
  if (file.size > 10 * 1024 * 1024) {
    showMessageWithType('Файл слишком большой. Максимальный размер 10MB', 'error', 3000);
    event.target.value = ''; // Сбрасываем input
    return;
  }

  // Сразу сканируем файл без показа превью
  showMessageWithType('Анализируем изображение...', 'info', 0);
  
  try {
    const qrData = await scanFromFile(file);
    
    if (qrData) {
      if (isValidPaymentUrl(qrData)) {
        showMessageWithType('QR-код распознан из изображения!', 'success', 1000);
        setTimeout(() => {
          handleQRDetected(qrData);
        }, 500);
      } else {
        showMessageWithType('QR-код найден, но не содержит данных для оплаты: ' + qrData.substring(0, 50), 'error', 5000);
      }
    } else {
      showMessageWithType('QR-код не найден в изображении', 'error', 3000);
    }
  } catch (error) {
    showMessageWithType('Ошибка анализа изображения: ' + error.message, 'error', 3000);
  }
  
  // Сбрасываем input для возможности повторной загрузки того же файла
  event.target.value = '';
};

// Остановка камеры и сканнера
const stopCamera = () => {
  stopContinuousScanning();
  
  if (qrScanner.value) {
    qrScanner.value.destroy();
    qrScanner.value = null;
  }
  
  cameraReady.value = false;
};

// Возврат назад
const goBack = () => {
  // Восстанавливаем навбар при закрытии сканера
  document.body.classList.remove('scanner-active');
  stopCamera();
  router.back();
};

// Функции для модального окна ввода суммы
const closeAmountModal = () => {
  showAmountModal.value = false;
  amountInput.value = '';
  amountError.value = '';
  pendingQrData.value = '';
  isProcessingQR.value = false;
  
  // Перезапускаем сканирование
  if (qrScanner.value && cameraReady.value) {
    qrScanner.value.start();
    startContinuousScanning();
  }
};

const validateAmount = (amount) => {
  // Проверяем что сумма не пустая
  if (!amount || amount.trim() === '') {
    return 'Введите сумму';
  }
  
  // Заменяем запятую на точку для корректного парсинга
  const normalizedAmount = amount.replace(',', '.');
  
  // Проверяем что это число
  const numAmount = parseFloat(normalizedAmount);
  if (isNaN(numAmount)) {
    return 'Введите корректную сумму';
  }
  
  // Проверяем что сумма больше 0
  if (numAmount <= 0) {
    return 'Сумма должна быть больше 0';
  }
  
  // Проверяем что сумма не слишком большая
  if (numAmount > 1000000) {
    return 'Сумма слишком большая';
  }
  
  // Проверяем количество знаков после запятой (максимум 2)
  const decimalParts = normalizedAmount.split('.');
  if (decimalParts.length > 1 && decimalParts[1].length > 2) {
    return 'Максимум 2 знака после запятой';
  }
  
  return null;
};

const confirmAmount = async () => {
  amountError.value = '';
  
  // Валидируем введенную сумму
  const error = validateAmount(amountInput.value);
  if (error) {
    amountError.value = error;
    return;
  }
  
  try {
    // Нормализуем сумму
    const normalizedAmount = amountInput.value.replace(',', '.');
    const amount = parseFloat(normalizedAmount).toFixed(2);
    
    // Показываем модальное окно подтверждения с введенной суммой
    paymentAmount.value = amount;
    paymentUrl.value = addAmountToUrl(pendingQrData.value, amount);
    
    // Закрываем модальное окно ввода суммы
    showAmountModal.value = false;
    
    // Показываем модальное окно подтверждения
    showPaymentModal.value = true;
    
    // Очищаем состояние ввода суммы
    amountInput.value = '';
    pendingQrData.value = '';
    
  } catch (error) {
    amountError.value = 'Ошибка обработки платежа';
    
    // Перезапускаем сканирование через 3 секунды
    setTimeout(() => {
      closeAmountModal();
    }, 3000);
  } finally {
    isProcessingQR.value = false;
  }
};

// Функции для модального окна подтверждения платежа
const closePaymentModal = () => {
  showPaymentModal.value = false;
  paymentAmount.value = '';
  paymentUrl.value = '';
  isProcessingPayment.value = false;
  isProcessingQR.value = false;
  
  // Перезапускаем сканирование
  if (qrScanner.value && cameraReady.value) {
    qrScanner.value.start();
    startContinuousScanning();
  }
};

const confirmPayment = async () => {
  if (isProcessingPayment.value) return;
  
  try {
    isProcessingPayment.value = true;
    
    showMessageWithType('Обрабатываем платеж...', 'info', 0);
    
    // Отправляем в store
    await walletStore.qrTake(paymentUrl.value);
    
    // Закрываем модальное окно
    showPaymentModal.value = false;
    
    // Очищаем состояние
    paymentAmount.value = '';
    paymentUrl.value = '';
    
  } catch (error) {
    showMessageWithType('Ошибка обработки платежа', 'error', 3000);
    
    // Перезапускаем сканирование через 3 секунды
    setTimeout(() => {
      closePaymentModal();
    }, 3000);
  } finally {
    isProcessingPayment.value = false;
    isProcessingQR.value = false;
  }
};

// Функции для модального окна вставки ссылки
const openPasteLinkModal = () => {
  // Останавливаем сканирование при открытии модального окна
  stopContinuousScanning();
  showPasteLinkModal.value = true;
  pasteLink.value = '';
  pasteLinkError.value = '';
  
  // Автоматическая вставка из буфера обмена (если доступно)
  if (navigator.clipboard && navigator.clipboard.readText) {
    navigator.clipboard.readText()
      .then(text => {
        if (text && text.trim()) {
          pasteLink.value = text.trim();
        }
      })
      .catch(() => {
        // Буфер обмена недоступен, ничего не делаем
      });
  }
};

const closePasteLinkModal = () => {
  showPasteLinkModal.value = false;
  pasteLink.value = '';
  pasteLinkError.value = '';
  
  // Перезапускаем сканирование
  if (qrScanner.value && cameraReady.value) {
    qrScanner.value.start();
    startContinuousScanning();
  }
};

const confirmPasteLink = async () => {
  pasteLinkError.value = '';
  
  // Проверяем что ссылка не пустая
  if (!pasteLink.value || pasteLink.value.trim() === '') {
    pasteLinkError.value = 'Вставьте ссылку';
    return;
  }
  
  const link = pasteLink.value.trim();
  
  // Проверяем валидность ссылки
  if (!isValidPaymentUrl(link)) {
    pasteLinkError.value = 'Ссылка не содержит данных для оплаты';
    return;
  }
  
  try {
    // Закрываем модальное окно вставки
    showPasteLinkModal.value = false;
    
    // Показываем сообщение об успешной вставке
    showMessageWithType('Ссылка успешно вставлена!', 'success', 1000);
    
    // Обрабатываем как обычный QR-код
    setTimeout(() => {
      handleQRDetected(link);
    }, 500);
    
    // Очищаем состояние
    pasteLink.value = '';
    pasteLinkError.value = '';
    
  } catch (error) {
    pasteLinkError.value = 'Ошибка обработки ссылки';
  }
};

// Lifecycle hooks
onMounted(async () => {
  // Скрываем навбар при открытии сканера
  document.body.classList.add('scanner-active');
  
  // Тестируем QrScanner
  const qrScannerWorks = await testQrScanner();
  
  if (!qrScannerWorks) {
    showMessageWithType('Проблема с доступом к камере', 'error', 5000);
  }
  
  walletStore.loaderScan = false;

  await nextTick();
  await initCamera();
});

onUnmounted(() => {
  // Восстанавливаем навбар при закрытии сканера
  document.body.classList.remove('scanner-active');
  stopCamera();
});
</script>

<style scoped>
.app-scanner-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.qr-scanner-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: black;
  z-index: 1000;
}

.camera-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
}

/* Оверлей с рамкой сканирования */
.scanner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 100;
  pointer-events: none;
  color: white;
}

.scan-frame {
  width: 70%;
  max-width: 300px;
  height: 300px;
  position: relative;
  pointer-events: none;
}

.scan-frame::before,
.scan-frame::after,
.scan-frame span::before,
.scan-frame span::after {
  content: '';
  position: absolute;
  width: 30px;
  height: 30px;
  border: 3px solid rgba(255, 255, 255, 0.9);
  z-index: 101;
}

.scan-frame::before {
  top: 0;
  left: 0;
  border-right: none;
  border-bottom: none;
  border-radius: 10px 0 0 0;
}

.scan-frame::after {
  top: 0;
  right: 0;
  border-left: none;
  border-bottom: none;
  border-radius: 0 10px 0 0;
}

.scan-frame span::before {
  bottom: 0;
  right: 0;
  border-left: none;
  border-top: none;
  border-radius: 0 0 10px 0;
}

.scan-frame span::after {
  bottom: 0;
  left: 0;
  border-right: none;
  border-top: none;
  border-radius: 0 0 0 10px;
}

.hint {
  width: fit-content;
  margin-top: 20px;
  color: white;
  text-align: center;
  padding: 15px 20px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(0, 0, 0, 0.6);
  z-index: 101;
  backdrop-filter: blur(10px);
  font-weight: 500;
  font-size: 16px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.hint span {
color: white;
}

.scanning-indicator {
  font-size: 12px;
  margin-top: 5px;
  opacity: 0.8;
  animation: scanPulse 2s ease-in-out infinite;
}

@keyframes scanPulse {
  0%, 100% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
  }
}

/* Контролы */
.controls {
  position: absolute;
  bottom: 30px;
  left: 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 200;
  pointer-events: none;
}

.controls-left,
.controls-right {
  display: flex;
  gap: 12px;
  align-items: center;
  pointer-events: auto;
}

.control-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.4);
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.control-btn:hover {
  background: rgba(0, 0, 0, 0.6);
  transform: scale(1.05);
}

.control-btn:active {
  transform: scale(0.95);
}

.control-btn img {
  height: 24px;
}

/* Основная кнопка сканирования - всегда по центру */
.scan-button {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  border: 2px solid #fff;
  border-radius: 100%;
  cursor: pointer;
  padding: 5px;
  background: transparent;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  z-index: 201;
}

.scan-button-circle {
  border-radius: 100%;
  height: 60px;
  width: 60px;
  background: #fff;
  transition: all 0.3s ease;
}

.scan-button-circle.scanning {
  background: #4caf50;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Кнопка закрытия */
.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.4);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 200;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.6);
}

.close-btn:active {
  transform: scale(0.95);
  background: rgba(0, 0, 0, 0.8);
}

/* Лоадер */
.wrap-load {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000000;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

/* Сообщения */
.message-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
  background: transparent;
  backdrop-filter: none;
  animation: overlayAppear 0.3s ease-out;
  pointer-events: none;
}

@keyframes overlayAppear {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(8px);
  }
}

.message-container {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 24px;
  padding: 20px 28px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 
    0 32px 64px -12px rgba(0, 0, 0, 0.15),
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.3);
  max-width: 300px;
  margin: 0 20px;
  animation: messageAppear 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  backdrop-filter: blur(20px);
  position: relative;
  overflow: hidden;
  pointer-events: auto;
}

.message-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  pointer-events: none;
}

.message-container.success {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.95) 0%, rgba(16, 185, 129, 0.95) 100%);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.message-container.error {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 127, 0.95) 100%);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.message-container.info {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(147, 51, 234, 0.95) 100%);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: messageAppear 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55), pulseScan 1.5s ease-in-out infinite;
}

@keyframes pulseScan {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.02);
  }
}

.scan-icon {
  animation: scanRotate 2s linear infinite;
}

@keyframes scanRotate {
  0% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(90deg);
  }
  50% {
    transform: rotate(180deg);
  }
  75% {
    transform: rotate(270deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.message-icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.message-text {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.01em;
}

@keyframes messageAppear {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(-30px);
    filter: blur(4px);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.02) translateY(-10px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
    filter: blur(0px);
  }
}

@media (max-width: 480px) {
  .message-container {
    padding: 16px 22px;
    max-width: 260px;
    border-radius: 20px;
  }
  
  .message-icon {
    width: 24px;
    height: 24px;
  }
  
  .message-text {
    font-size: 14px;
    font-weight: 600;
  }
}

/* Модальное окно для ввода суммы */
.amount-modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(12px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
  animation: modalOverlayAppear 0.3s ease-out;
}

@keyframes modalOverlayAppear {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(12px);
  }
}

.amount-modal {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 24px;
  padding: 32px 28px;
  width: 90%;
  max-width: 400px;
  margin: 0 20px;
  box-shadow: 
    0 32px 64px -12px rgba(0, 0, 0, 0.25),
    0 20px 25px -5px rgba(0, 0, 0, 0.15),
    0 10px 10px -5px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.3);
  animation: modalAppear 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  backdrop-filter: blur(20px);
  position: relative;
  overflow: hidden;
}

.amount-modal::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  pointer-events: none;
}

@keyframes modalAppear {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(-50px);
    filter: blur(4px);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.02) translateY(-20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
    filter: blur(0px);
  }
}

.modal-header {
  text-align: center;
  margin-bottom: 32px;
  position: relative;
  z-index: 1;
}

.modal-header h3 {
  margin: 0 0 12px 0;
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.02em;
}

.modal-header p {
  margin: 0;
  font-size: 16px;
  color: #666;
  line-height: 1.4;
  font-weight: 400;
}

.amount-input-container {
  position: relative;
  margin-bottom: 24px;
  z-index: 1;
}

.amount-input {
  width: 100%;
  background: rgba(248, 250, 252, 0.8);
  border: 2px solid rgba(226, 232, 240, 0.8);
  border-radius: 16px;
  padding: 20px 60px 20px 24px;
  font-size: 28px;
  font-weight: 600;
  color: #1a1a1a;
  text-align: center;
  transition: all 0.3s ease;
  outline: none;
  backdrop-filter: blur(10px);
  box-sizing: border-box;
  caret-color: #000000;
}

.amount-input:focus {
  border-color: #3b82f6;
  background: rgba(255, 255, 255, 0.95);
  transform: scale(1.01);
  box-shadow: 
    0 0 0 4px rgba(59, 130, 246, 0.1),
    0 8px 25px -5px rgba(0, 0, 0, 0.1);
}

.amount-input.error {
  border-color: #ef4444;
  background: rgba(254, 242, 242, 0.95);
  animation: inputError 0.3s ease;
}

@keyframes inputError {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}

.currency-label {
  position: absolute;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 24px;
  font-weight: 600;
  color: #6b7280;
  pointer-events: none;
}

.amount-error {
  color: #ef4444;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  margin-top: -16px;
  margin-bottom: 24px;
  animation: errorAppear 0.3s ease;
  position: relative;
  z-index: 1;
}

@keyframes errorAppear {
  0% {
    opacity: 0;
    transform: translateY(-10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-buttons {
  display: flex;
  gap: 16px;
  position: relative;
  z-index: 1;
}

.cancel-btn,
.confirm-btn {
  flex: 1;
  padding: 16px 24px;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: pointer;
  border: none;
  position: relative;
  overflow: hidden;
}

.cancel-btn {
  background: rgba(241, 245, 249, 0.8);
  color: #64748b;
  backdrop-filter: blur(10px);
}

.cancel-btn:hover {
  background: rgba(226, 232, 240, 0.9);
  color: #475569;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1);
}

.confirm-btn {
  background: #deec51;
  color: #141414;
  box-shadow: 0 4px 14px 0 rgba(222, 236, 81, 0.3);
}

.confirm-btn:hover:not(:disabled) {
  background: #d6e34a;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px -5px rgba(222, 236, 81, 0.4);
}

.confirm-btn:disabled {
  background: rgba(156, 163, 175, 0.5);
  color: rgba(255, 255, 255, 0.7);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.cancel-btn:active,
.confirm-btn:active:not(:disabled) {
  transform: scale(0.98);
}

@media (max-width: 480px) {
  .amount-modal {
    padding: 28px 24px;
    margin: 0 16px;
    border-radius: 20px;
  }
  
  .modal-header h3 {
    font-size: 22px;
  }
  
  .modal-header p {
    font-size: 15px;
  }
  
  .amount-input {
    font-size: 24px;
    padding: 18px 55px 18px 20px;
  }
  
  .currency-label {
    font-size: 20px;
    right: 20px;
  }
  
  .modal-buttons {
    gap: 12px;
  }
  
  .cancel-btn,
  .confirm-btn {
    padding: 14px 20px;
    font-size: 15px;
  }
}

/* Модальное окно подтверждения платежа */
.payment-modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(16px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1200;
  animation: paymentOverlayAppear 0.4s ease-out;
}

@keyframes paymentOverlayAppear {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(16px);
  }
}

.payment-modal {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 32px;
  padding: 40px 32px;
  width: 90%;
  max-width: 480px;
  margin: 0 20px;
  box-shadow: 
    0 40px 80px -20px rgba(0, 0, 0, 0.25),
    0 25px 50px -12px rgba(0, 0, 0, 0.15),
    0 12px 24px -8px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.3);
  animation: paymentModalAppear 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  backdrop-filter: blur(24px);
  position: relative;
  overflow: hidden;
}

.payment-modal::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  pointer-events: none;
  border-radius: 32px;
}

@keyframes paymentModalAppear {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(-60px);
    filter: blur(8px);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.03) translateY(-30px);
    filter: blur(2px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
    filter: blur(0px);
  }
}

.payment-header {
  text-align: center;
  margin-bottom: 40px;
  position: relative;
  z-index: 1;
}

.payment-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #deec51 0%, #d6e34a 100%);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #141414;
  box-shadow: 
    0 16px 32px -8px rgba(222, 236, 81, 0.3),
    0 8px 16px -4px rgba(222, 236, 81, 0.2);
  animation: paymentIconAppear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
}

@keyframes paymentIconAppear {
  0% {
    opacity: 0;
    transform: scale(0.5) rotate(-10deg);
  }
  50% {
    transform: scale(1.1) rotate(5deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

.qr-payment-icon {
  animation: qrIconPulse 2s ease-in-out infinite;
}

@keyframes qrIconPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.payment-header h3 {
  margin: 0 0 12px 0;
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.02em;
  animation: paymentTextAppear 0.5s ease-out 0.3s both;
}

.payment-header p {
  margin: 0;
  font-size: 16px;
  color: #666;
  line-height: 1.4;
  font-weight: 400;
  animation: paymentTextAppear 0.5s ease-out 0.4s both;
}

@keyframes paymentTextAppear {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.payment-details {
  margin-bottom: 40px;
  position: relative;
  z-index: 1;
}

.amount-display {
  background: linear-gradient(135deg, rgba(222, 236, 81, 0.1) 0%, rgba(214, 227, 74, 0.05) 100%);
  border: 2px solid rgba(222, 236, 81, 0.2);
  border-radius: 24px;
  padding: 32px 24px;
  text-align: center;
  margin-bottom: 24px;
  animation: amountAppear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both;
  position: relative;
  overflow: hidden;
}

.amount-display::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(222, 236, 81, 0.05) 0%, transparent 50%, rgba(222, 236, 81, 0.05) 100%);
  animation: amountShimmer 3s ease-in-out infinite;
}

@keyframes amountShimmer {
  0%, 100% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(100%);
  }
}

@keyframes amountAppear {
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  50% {
    transform: scale(1.05) translateY(-5px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.amount-label {
  font-size: 14px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.amount-value {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
}

.amount-number {
  font-size: 48px;
  font-weight: 800;
  color: #1a1a1a;
  letter-spacing: -0.02em;
  line-height: 1;
  animation: amountNumberAppear 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.6s both;
}

@keyframes amountNumberAppear {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
  60% {
    transform: scale(1.1) translateY(-5px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.amount-currency {
  font-size: 32px;
  font-weight: 700;
  color: #deec51;
  text-shadow: 0 2px 4px rgba(222, 236, 81, 0.3);
}

.payment-info {
  animation: paymentInfoAppear 0.5s ease-out 0.7s both;
}

@keyframes paymentInfoAppear {
  0% {
    opacity: 0;
    transform: translateY(15px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(248, 250, 252, 0.6);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(226, 232, 240, 0.5);
}

.info-label {
  font-size: 15px;
  font-weight: 500;
  color: #64748b;
}

.info-value {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
}

.payment-buttons {
  display: flex;
  gap: 16px;
  position: relative;
  z-index: 1;
  animation: buttonsAppear 0.5s ease-out 0.8s both;
}

@keyframes buttonsAppear {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.payment-cancel-btn,
.payment-confirm-btn {
  flex: 1;
  padding: 18px 24px;
  border-radius: 20px;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
  cursor: pointer;
  border: none;
  position: relative;
  overflow: hidden;
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.payment-cancel-btn {
  background: rgba(248, 250, 252, 0.8);
  color: #64748b;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(226, 232, 240, 0.5);
}

.payment-cancel-btn:hover:not(:disabled) {
  background: rgba(236, 241, 247, 0.9);
  color: #475569;
  transform: translateY(-2px);
  box-shadow: 0 12px 32px -8px rgba(0, 0, 0, 0.1);
}

.payment-confirm-btn {
  background: linear-gradient(135deg, #deec51 0%, #d6e34a 100%);
  color: #141414;
  box-shadow: 
    0 8px 24px -4px rgba(222, 236, 81, 0.4),
    0 4px 12px -2px rgba(222, 236, 81, 0.3);
  position: relative;
}

.payment-confirm-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.payment-confirm-btn:hover:not(:disabled)::before {
  left: 100%;
}

.payment-confirm-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #d6e34a 0%, #deec51 100%);
  transform: translateY(-3px);
  box-shadow: 
    0 16px 40px -8px rgba(222, 236, 81, 0.5),
    0 8px 20px -4px rgba(222, 236, 81, 0.4);
}

.payment-confirm-btn.processing {
  background: linear-gradient(135deg, rgba(222, 236, 81, 0.7) 0%, rgba(214, 227, 74, 0.7) 100%);
  cursor: not-allowed;
  transform: none;
}

.payment-confirm-btn:disabled {
  background: rgba(156, 163, 175, 0.5);
  color: rgba(255, 255, 255, 0.7);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.processing-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(20, 20, 20, 0.2);
  border-top: 2px solid #141414;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.payment-cancel-btn:active,
.payment-confirm-btn:active:not(:disabled) {
  transform: scale(0.98);
}

/* Адаптивность для модального окна подтверждения */
@media (max-width: 480px) {
  .payment-modal {
    padding: 32px 24px;
    margin: 0 16px;
    border-radius: 28px;
  }
  
  .payment-header h3 {
    font-size: 24px;
  }
  
  .payment-header p {
    font-size: 15px;
  }
  
  .payment-icon {
    width: 72px;
    height: 72px;
    border-radius: 20px;
  }
  
  .amount-display {
    padding: 28px 20px;
    border-radius: 20px;
  }
  
  .amount-number {
    font-size: 42px;
  }
  
  .amount-currency {
    font-size: 28px;
  }
  
  .payment-buttons {
    gap: 12px;
  }
  
  .payment-cancel-btn,
  .payment-confirm-btn {
    padding: 16px 20px;
    font-size: 15px;
    min-height: 52px;
    border-radius: 18px;
  }
}

/* Модальное окно для вставки ссылки */
.paste-link-modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(12px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
  animation: modalOverlayAppear 0.3s ease-out;
}

.paste-link-modal {
  background: rgba(42, 42, 42, 0.98);
  border-radius: 24px;
  padding: 32px 28px;
  width: 90%;
  max-width: 420px;
  margin: 0 20px;
  box-shadow: 
    0 32px 64px -12px rgba(0, 0, 0, 0.25),
    0 20px 25px -5px rgba(0, 0, 0, 0.15),
    0 10px 10px -5px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: modalAppear 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  backdrop-filter: blur(20px);
  position: relative;
  overflow: hidden;
}

.paste-link-modal::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
  pointer-events: none;
}

.paste-link-input-container {
  position: relative;
  margin-bottom: 24px;
  z-index: 1;
}

.paste-link-input {
  width: 100%;
  background: rgba(58, 58, 58, 0.8);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 16px 20px;
  font-size: 15px;
  font-weight: 500;
  color: #f5f5f5;
  transition: all 0.3s ease;
  outline: none;
  backdrop-filter: blur(10px);
  box-sizing: border-box;
  resize: vertical;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.5;
  min-height: 100px;
}

.paste-link-input::placeholder {
  color: #666666;
  font-weight: 400;
}

.paste-link-input:focus {
  border-color: #deec51;
  background: rgba(68, 68, 68, 0.95);
  transform: scale(1.01);
  box-shadow: 
    0 0 0 4px rgba(222, 236, 81, 0.2),
    0 8px 25px -5px rgba(0, 0, 0, 0.3);
}

.paste-link-input.error {
  border-color: #ef4444;
  background: rgba(80, 30, 30, 0.95);
  animation: inputError 0.3s ease;
}

.paste-link-error {
  color: #f87171;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  margin-top: -16px;
  margin-bottom: 24px;
  animation: errorAppear 0.3s ease;
  position: relative;
  z-index: 1;
}

@media (max-width: 480px) {
  .paste-link-modal {
    padding: 28px 24px;
    margin: 0 16px;
    border-radius: 20px;
  }
  
  .paste-link-input {
    font-size: 14px;
    padding: 14px 18px;
    min-height: 90px;
  }
  
  .controls {
    padding: 0 16px;
  }
  
  .controls-left,
  .controls-right {
    gap: 10px;
  }
  
  .control-btn {
    width: 50px;
    height: 50px;
  }
  
  .scan-button {
    bottom: 30px;
  }
  
  .scan-button-circle {
    height: 54px;
    width: 54px;
  }
}

/* Глобальные стили для скрытия навбара когда активен сканер */
:global(body.scanner-active) {
  overflow: hidden;
}

/* Скрываем навбар по всем возможным селекторам */
:global(body.scanner-active .navbar),
:global(body.scanner-active .navbar-fixed),
:global(body.scanner-active nav.navbar),
:global(body.scanner-active .nav-bar),
:global(body.scanner-active nav),
:global(body.scanner-active .bottom-nav) {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
  transform: translateY(100%) !important;
}
</style>

<!-- Глобальные стили для темной темы (без scoped) -->
<style>
/* Темная тема для модальных окон сканера - максимальная специфичность */
/* НЕ включаем paste-link-modal - оно всегда светлое */
body.dark-theme .app-scanner-container .qr-scanner-fullscreen .amount-modal,
body.dark-theme .app-scanner-container .qr-scanner-fullscreen .payment-modal,
body.dark-theme .qr-scanner-fullscreen .amount-modal,
body.dark-theme .qr-scanner-fullscreen .payment-modal,
body.dark-theme .amount-modal,
body.dark-theme .payment-modal {
  background: rgba(42, 42, 42, 0.98) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

body.dark-theme .app-scanner-container .qr-scanner-fullscreen .amount-modal::before,
body.dark-theme .app-scanner-container .qr-scanner-fullscreen .payment-modal::before,
body.dark-theme .qr-scanner-fullscreen .amount-modal::before,
body.dark-theme .qr-scanner-fullscreen .payment-modal::before,
body.dark-theme .amount-modal::before,
body.dark-theme .payment-modal::before {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%) !important;
}

/* Заголовки модальных окон - только для amount-modal и payment-modal */
body.dark-theme .amount-modal .modal-header h3,
body.dark-theme .payment-modal .payment-header h3,
body.dark-theme .payment-header h3 {
  color: #f5f5f5 !important;
}

body.dark-theme .amount-modal .modal-header p,
body.dark-theme .payment-modal .payment-header p,
body.dark-theme .payment-header p {
  color: #b0b0b0 !important;
}

/* Инпуты - только для amount-input, НЕ для paste-link-input */
body.dark-theme .amount-input {
  background: rgba(58, 58, 58, 0.8) !important;
  border: 2px solid rgba(255, 255, 255, 0.1) !important;
  color: #f5f5f5 !important;
}

body.dark-theme .amount-input::placeholder {
  color: #666666 !important;
}

body.dark-theme .amount-input:focus {
  border-color: #deec51 !important;
  background: rgba(68, 68, 68, 0.95) !important;
  box-shadow: 
    0 0 0 4px rgba(222, 236, 81, 0.2),
    0 8px 25px -5px rgba(0, 0, 0, 0.3) !important;
}

body.dark-theme .amount-input.error {
  border-color: #ef4444 !important;
  background: rgba(80, 30, 30, 0.95) !important;
}

body.dark-theme .currency-label {
  color: #b0b0b0 !important;
}

/* Ошибки - только amount-error, НЕ paste-link-error */
body.dark-theme .amount-error {
  color: #f87171 !important;
}

/* Кнопки в модальных окнах amount и payment */
body.dark-theme .amount-modal .cancel-btn,
body.dark-theme .payment-modal .cancel-btn,
body.dark-theme .payment-modal .payment-cancel-btn,
body.dark-theme .payment-cancel-btn {
  background: rgba(58, 58, 58, 0.8) !important;
  color: #b0b0b0 !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

body.dark-theme .amount-modal .cancel-btn:hover,
body.dark-theme .payment-modal .cancel-btn:hover,
body.dark-theme .payment-modal .payment-cancel-btn:hover:not(:disabled),
body.dark-theme .payment-cancel-btn:hover:not(:disabled) {
  background: rgba(68, 68, 68, 0.9) !important;
  color: #f5f5f5 !important;
}

body.dark-theme .amount-display {
  background: linear-gradient(135deg, rgba(222, 236, 81, 0.15) 0%, rgba(214, 227, 74, 0.08) 100%) !important;
  border: 2px solid rgba(222, 236, 81, 0.3) !important;
}

body.dark-theme .amount-label {
  color: #b0b0b0 !important;
}

body.dark-theme .amount-number {
  color: #f5f5f5 !important;
}

body.dark-theme .info-item {
  background: rgba(58, 58, 58, 0.6) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

body.dark-theme .info-label {
  color: #b0b0b0 !important;
}

body.dark-theme .info-value {
  color: #f5f5f5 !important;
}

/* Статично темное окно вставки ссылки - переопределяем заголовки */
.paste-link-modal .modal-header h3 {
  color: #f5f5f5 !important;
}

.paste-link-modal .modal-header p {
  color: #b0b0b0 !important;
}

.paste-link-modal .cancel-btn {
  background: rgba(58, 58, 58, 0.8) !important;
  color: #b0b0b0 !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.paste-link-modal .cancel-btn:hover {
  background: rgba(68, 68, 68, 0.9) !important;
  color: #f5f5f5 !important;
}
</style>

