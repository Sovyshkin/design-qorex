import { defineStore } from "pinia";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import i18n from "@/i18n";
import { useRouter } from "vue-router";
import Cookies from "js-cookie";
import axios from "axios";
import {
  isTransactionErrorStatus,
  normalizeTransactionStatus,
} from "@/utils/transactionStatus";
import { isCashbackTransaction } from "@/utils/cashbackTransaction";
import { normalizeTransactionType } from "@/utils/transactionType";
import { getSavedBrowserUser, getSavedTelegramData, normalizeTelegramUser } from "@/utils/auth";

// Вспомогательная функция для форматирования даты в локальном часовом поясе
const formatDateForTransaction = (date = new Date()) => {
  // Убеждаемся, что работаем с объектом Date в локальном часовом поясе
  const localDate = new Date(date.getTime());
  
  const day = String(localDate.getDate()).padStart(2, '0');
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const year = localDate.getFullYear();
  const hours = String(localDate.getHours()).padStart(2, '0');
  const minutes = String(localDate.getMinutes()).padStart(2, '0');
  const seconds = String(localDate.getSeconds()).padStart(2, '0');
  
  return `${day}.${month}.${year}-${hours}:${minutes}:${seconds}`;
};

const getBackendDateTimestamp = (value: unknown) => {
  const rawValue = String(value || "").trim();
  const match = rawValue.match(
    /^(\d{2})\.(\d{2})\.(\d{4})[-T ](\d{2}):(\d{2}):(\d{2})$/
  );

  if (match) {
    const [, day, month, year, hours, minutes, seconds] = match;
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes),
      Number(seconds)
    ).getTime();
  }

  const fallbackTimestamp = new Date(rawValue).getTime();
  return Number.isNaN(fallbackTimestamp) ? 0 : fallbackTimestamp;
};

const extractQrParam = (rawLink: string, key: string) => {
  if (!rawLink || typeof rawLink !== "string") {
    return "";
  }

  try {
    const normalizedLink = /^[a-z][a-z0-9+.-]*:/i.test(rawLink)
      ? rawLink
      : rawLink.includes("?")
      ? `https://peekpay.local/${rawLink.replace(/^\/+/, "")}`
      : `https://peekpay.local/?${rawLink.replace(/^[?&]+/, "")}`;

    const parsedUrl = new URL(normalizedLink);
    return parsedUrl.searchParams.get(key) || "";
  } catch (_error) {
    const match = rawLink.match(
      new RegExp(`(?:[?&]|^)${key}=([^&#]*)`, "i")
    );

    if (!match) {
      return "";
    }

    try {
      return decodeURIComponent(match[1].replace(/\+/g, " "));
    } catch (_decodeError) {
      return match[1];
    }
  }
};

const safeQueryValue = (value: unknown, fallback = "") => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
};

const safeAmountRub = (amountUsdt: unknown, usdtPrice: unknown) => {
  const parsedAmount = Number(amountUsdt);
  const parsedPrice = Number(usdtPrice);

  if (!Number.isFinite(parsedAmount) || !Number.isFinite(parsedPrice)) {
    return "0";
  }

  return String(parsedAmount * parsedPrice);
};

const normalizeTransferResponseType = (type: unknown) => {
  const normalizedType = normalizeTransactionType(type);

  return normalizedType === "transfer" || normalizedType === "receiving"
    ? normalizedType
    : "transfer";
};

export const useWalletStore = defineStore("wallet", () => {
  const balance = ref(0);
  const balance_rub = ref(0);
  const usdt_price = ref(0);
  let working_invoice = "";
  const { t } = useI18n();
  const router = useRouter();
  const isLoading = ref(false);
  const loaderScan = ref(false);

  // Настройка интерсепторов axios
  axios.interceptors.request.use(
    (config) => {
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      // Логируем все ошибки для отладки
      console.error('API Error Details:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code,
        name: error.name,
        hasResponse: !!error.response,
        isNetworkError: !error.response && error.request,
        stack: error.stack
      });
      
      // Проверяем статус код 333 для технических работ
      if (error.response?.status === 333) {
        showMessage('Ведутся технические работы. Попробуйте позже.', 'warning');
      }
      
      // Добавляем флаг для определения типа ошибки
      if (error.response) {
        // Ошибка с ответом от сервера - это не сетевая ошибка
        error.isServerError = true;
      } else if (error.request) {
        // Запрос был отправлен, но ответа не получено - сетевая ошибка
        error.isNetworkError = true;
      } else {
        // Ошибка при настройке запроса
        error.isConfigError = true;
      }
      
      return Promise.reject(error);
    }
  );
  const email = ref("");
  const code = ref("");
  const errMessage = ref("");
  const transactionErrorMessage = ref(""); // Отдельная переменная для ошибок транзакций

  const message_status = ref("");
  // const userTg = ref({})
  const userTg = ref({
    // first_name: "Вадим",
    // last_name: "Заньков",
    // username: "zankov_22",
    // id: "978664527",
    first_name: "",
    last_name: "",
    username: "",
    id: "",
    photo_url: "",
  });
  const user = ref<any>({});
  const amount = ref("");
  const pay_link = ref("");
  const codePasswordActive = ref(false);
  const hideBalanceActive = ref(false);
  const isDarkTheme = ref(false); // Состояние темной темы
  const pinCode = ref("");
  const pinVerified = ref(false); // Новое состояние для отслеживания верификации PIN
  const pinVerificationTime = ref(0); // Время последней верификации
  const referalId = ref(""); // Добавляем переменную для реферального ID
  const isCreatingUser = ref(false); // Флаг для предотвращения повторного создания пользователя
  const lastInvoiceTime = ref(0); // Время последнего создания инвойса
  const remainingInvoiceTime = ref(0); // Оставшееся время до следующего инвойса в секундах
  const userWallet = ref(""); // Номер кошелька пользователя для переводов
  const has2FA = ref(false); // Статус 2FA пользователя
  let messageTimer: ReturnType<typeof setTimeout> | null = null;
  let createUserPromise: Promise<boolean> | null = null;
  let getUserPromise: Promise<void> | null = null;

  const history = ref([]);

  const transaction = ref<any>({});

  const getTelegramDataForRequest = () => {
    const webAppData = window.Telegram?.WebApp?.initDataUnsafe;

    if (webAppData && Object.keys(webAppData).length) {
      return webAppData;
    }

    return getSavedTelegramData();
  };

  const getCurrentTelegramId = () => {
    return String(user.value?.tg_id || userTg.value?.id || "");
  };

  const setHideBalanceActive = async (val: boolean) => {
    // Сначала обновляем локальное состояние
    hideBalanceActive.value = val;

    // Отправляем изменение на сервер
    try {
      if (user.value && user.value.tg_id) {
        await axios.patch(`/update_visibility_balance/${user.value.tg_id}`, {
          visibility_balance: val,
        });
        // После успешного обновления на сервере синхронизируем localStorage
        syncSettingsWithLocalStorage();
      } else {
        // Если пользователь не авторизован, сохраняем только в localStorage
        if (val) {
          localStorage.setItem("hideBalance", "true");
        } else {
          localStorage.removeItem("hideBalance");
        }
      }
    } catch (err) {
      // В случае ошибки возвращаем предыдущее состояние
      hideBalanceActive.value = !val;
    }
  };

  const setPinCode = async (pin: string) => {
    try {
      pinCode.value = pin;
      let response = await axios.patch(`/update_pincode/${user.value.tg_id}`, {
        pincode: pinCode.value,
      });
      if (response.status == 200) {
        codePasswordActive.value = true;
        pinVerified.value = true; // Автоматически верифицируем после установки
        pinVerificationTime.value = Date.now();
        showMessage(t("pincode_set_success") || "PIN-код успешно установлен", "success", 2500);
        // Синхронизируем localStorage после успешного обновления
        syncSettingsWithLocalStorage();
        setTimeout(() => {
          router.push({ name: "safety" });
        }, 2500);
      }
    } catch (error) {
      showMessage(t("pincode_set_failed") || "Не удалось установить PIN-код", "error", 3000);
    }
  };

  const disablePinCode = async () => {
    try {
      let response = await axios.patch(`/update_pincode/${user.value.tg_id}`, {
        pincode: "",
      });
      if (response.status == 200) {
        // Очищаем все данные PIN-кода
        clearAllPinData();
        // Синхронизируем localStorage после успешного обновления
        syncSettingsWithLocalStorage();
        showMessage(t("pincode_disabled_success") || "PIN-код отключен", "success", 2500);
      }
    } catch (error) {
      showMessage(t("pincode_disable_failed") || "Не удалось отключить PIN-код", "error", 3000);
    }
  };

  const clearPinSession = () => {
    pinVerified.value = false;
    pinVerificationTime.value = 0;
  };

  const clearAllPinData = () => {
    pinCode.value = "";
    codePasswordActive.value = false;
    pinVerified.value = false;
    pinVerificationTime.value = 0;
  };

  const initializePinState = () => {
    // Инициализация состояния PIN из сервера
    // Ничего не делаем с localStorage - все состояние в store
  };

  const verifyPin = (enteredPin: string) => {
    if (!codePasswordActive.value) {
      return false;
    }

    if (!pinCode.value) {
      return false;
    }

    const isValid = String(enteredPin) === String(pinCode.value);
    if (isValid) {
      pinVerified.value = true;
      pinVerificationTime.value = Date.now();
      // Сбрасываем состояние загрузки после успешной верификации
      isLoading.value = false;
      console.log('PIN верифицирован, сбрасываем isLoading');
    }

    return isValid;
  };

  const isPinRequired = () => {
    // PIN требуется если:
    // 1. PIN активен на сервере
    // 2. PIN не верифицирован в текущей сессии
    // 3. Прошло более 5 минут с момента последней верификации

    if (!codePasswordActive.value) {
      return false; // PIN не активен
    }

    if (!pinVerified.value) {
      return true; // PIN не верифицирован
    }

    // Проверяем таймаут сессии (5 минут)
    const sessionTimeout = 5 * 60 * 1000; // 5 минут
    if (Date.now() - pinVerificationTime.value > sessionTimeout) {
      pinVerified.value = false; // Сбрасываем верификацию
      return true;
    }

    return false;
  };

  const hasPinCode = () => {
    return codePasswordActive.value && !!pinCode.value;
  };

  // Функция для синхронизации localStorage с серверными данными
  const syncSettingsWithLocalStorage = () => {
    // Синхронизируем состояние скрытия баланса
    if (hideBalanceActive.value) {
      localStorage.setItem("hideBalance", "true");
    } else {
      localStorage.removeItem("hideBalance");
    }

    // Синхронизируем состояние PIN-кода
    if (codePasswordActive.value) {
      localStorage.setItem("hasPinCode", "true");
    } else {
      localStorage.removeItem("hasPinCode");
      localStorage.removeItem("pinVerified");
    }
  };

  const isNetworkError = (error: any) => {
    // Настоящая сетевая ошибка - когда запрос был отправлен, но ответа не получено
    return (
      error.isNetworkError ||
      (!error.response && error.request) ||
      error.code === "NETWORK_ERROR" ||
      error.code === "ECONNABORTED" ||
      /timeout/i.test(String(error.message || ""))
    );
  };

  const isTimeoutError = (error: any) =>
    error?.code === "ECONNABORTED" || /timeout/i.test(String(error?.message || ""));

  const clearAllMessages = () => {
    errMessage.value = "";
    message_status.value = "";
    transactionErrorMessage.value = "";
    if (messageTimer) {
      clearTimeout(messageTimer);
      messageTimer = null;
    }
  };

  const showMessage = (
    message: string,
    status: string = "error",
    duration: number = 3000
  ) => {
    if (messageTimer) {
      clearTimeout(messageTimer);
      messageTimer = null;
    }

    const safeMessage = typeof message === "string" ? message.trim() : "";
    const fallbackMessage =
      status === "success"
        ? t("success") || "Успешно"
        : status === "warning"
          ? "Обратите внимание"
          : status === "info"
            ? "Информация"
            : t("error_occurred") || "Произошла ошибка";

    errMessage.value = safeMessage || fallbackMessage;
    message_status.value = status;

    messageTimer = setTimeout(() => {
      errMessage.value = "";
      message_status.value = "";
      messageTimer = null;
    }, duration);
  };

  const savedLang = localStorage.getItem("lang") || "RU";
  i18n.global.locale = savedLang;
  const availableLanguages = [
    { name: "Русский", value: "RU" },
    { name: "English", value: "EN" },
  ];

  const langs = ref(
    availableLanguages.map((language) => ({
      ...language,
      active: language.value === savedLang, // Сравниваем с сохраненным языком
    }))
  );

  // Применение темы к документу
  const applyTheme = (dark: boolean) => {
    if (typeof document === "undefined") return;

    if (dark) {
      document.documentElement.classList.add("dark-theme");
      document.body.classList.add("dark-theme");
    } else {
      document.documentElement.classList.remove("dark-theme");
      document.body.classList.remove("dark-theme");
    }
  };

  const getTelegramDarkTheme = () => {
    const webApp = window.Telegram?.WebApp;
    const colorScheme = String(webApp?.colorScheme || "").toLowerCase();

    if (colorScheme === "dark") return true;
    if (colorScheme === "light") return false;

    const bgColor = String(webApp?.themeParams?.bg_color || "").toLowerCase();
    return ["#000000", "#0d1b2a", "#17212b", "#18222d", "#1c1c1d"].includes(bgColor);
  };

  const getPreferredDarkTheme = () => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") return true;
    if (savedTheme === "light") return false;

    if (window.Telegram?.WebApp) {
      return getTelegramDarkTheme();
    }

    return Boolean(window.matchMedia?.("(prefers-color-scheme: dark)")?.matches);
  };

  const setDarkTheme = (dark: boolean, persist = true) => {
    isDarkTheme.value = dark;
    if (persist) {
      localStorage.setItem("theme", dark ? "dark" : "light");
    }
    applyTheme(dark);
  };

  // Инициализация темы из localStorage, Telegram или системной темы
  const initTheme = () => {
    setDarkTheme(getPreferredDarkTheme(), Boolean(localStorage.getItem("theme")));

    const webApp = window.Telegram?.WebApp;
    if (webApp?.onEvent) {
      webApp.onEvent("themeChanged", () => {
        const savedTheme = localStorage.getItem("theme");
        if (!savedTheme) {
          setDarkTheme(getTelegramDarkTheme(), false);
        }
      });
    }
  };

  // Переключение темы
  const toggleTheme = () => {
    setDarkTheme(!isDarkTheme.value, true);
  };

  // Вызываем инициализацию темы
  initTheme();

  const changeLang = async (lang: string) => {
    try {
      // Проверяем, что язык существует
      const languageExists = availableLanguages.some((l) => l.value === lang);
      if (!languageExists) {
        return;
      }

      // Обновляем состояние
      langs.value = langs.value.map((language) => ({
        ...language,
        active: language.value === lang,
      }));

      // Устанавливаем язык
      i18n.global.locale = lang;
      localStorage.setItem("lang", lang);

      location.reload();
    } catch (err) {}
  };

  const goBack = () => {
    try {
      router.go(-1);
    } catch (err) {}
  };

  const getUserInfo = () => {
    console.log('getUserInfo called');
    console.log('Telegram object:', window.Telegram);
    console.log('WebApp object:', window.Telegram?.WebApp);
    
    if (window.Telegram && window.Telegram.WebApp) {
      const initData = window.Telegram.WebApp.initData;
      console.log('initData:', initData);

      if (initData) {
        const decodedInitData = decodeURIComponent(initData);
        const params = new URLSearchParams(decodedInitData);
        const userString = params.get("user");
        const start_param = params.get("start_param");

        // Извлекаем реферальный ID из start_param
        if (start_param) {
          // Новый формат: referal_ID
          let referalMatch = start_param.match(/referal_(\d+)/);
          if (referalMatch) {
            referalId.value = referalMatch[1];
          } else {
            // Старый формат: проверяем различные варианты
            referalMatch = start_param.match(/referal[=:](\d+)/);
            if (referalMatch) {
              referalId.value = referalMatch[1];
            } else if (start_param && /^\d+$/.test(start_param)) {
              // Если start_param содержит только цифры, то это может быть реферальный ID
              referalId.value = start_param;
            }
          }
        }

        // Также проверяем другие возможные источники реферальных данных
        try {
          // Проверяем URL параметры из самой реферальной ссылки
          const urlParams = new URLSearchParams(window.location.search);
          const referalFromUrl = urlParams.get("referal");

          if (referalFromUrl && !referalId.value) {
            referalId.value = referalFromUrl;
          }

          // Проверяем hash для случаев когда параметры передаются через #
          const hash = window.location.hash;
          if (hash && !referalId.value) {
            // Проверяем разные возможные форматы в hash
            if (hash.includes("referal")) {
              // Новый формат referal_ID
              let referalMatch = hash.match(/referal_(\d+)/);
              if (referalMatch) {
                referalId.value = referalMatch[1];
              } else {
                // Старый формат referal=ID
                referalMatch = hash.match(/referal[=](\d+)/);
                if (referalMatch) {
                  referalId.value = referalMatch[1];
                }
              }
            }

            // Также проверяем startapp в hash
            if (
              hash.includes("startapp") &&
              hash.includes("referal") &&
              !referalId.value
            ) {
              const startappMatch = hash.match(/startapp[=]?([^&]*)/);
              if (startappMatch) {
                const startappValue = decodeURIComponent(startappMatch[1]);

                let referalMatch = startappValue.match(/referal_(\d+)/);
                if (referalMatch) {
                  referalId.value = referalMatch[1];
                } else {
                  referalMatch = startappValue.match(/referal[=](\d+)/);
                  if (referalMatch) {
                    referalId.value = referalMatch[1];
                  }
                }
              }
            }
          }

          // Проверяем параметр startapp
          const startApp = urlParams.get("startapp");
          if (startApp && startApp.includes("referal") && !referalId.value) {
            let referalMatch = startApp.match(/referal_(\d+)/);
            if (referalMatch) {
              referalId.value = referalMatch[1];
            } else {
              referalMatch = startApp.match(/referal[=](\d+)/);
              if (referalMatch) {
                referalId.value = referalMatch[1];
              }
            }
          }
        } catch (error) {
          // Silently handle URL parsing errors
        }

        if (userString) {
          userTg.value = JSON.parse(userString);
          localStorage.setItem("user", JSON.stringify(userTg.value));
          if (start_param == "error_trasaction") {
            router.push({ name: "transaction_failed" });
          }
        } else {
          console.log('No userString found in initData');
          
          // Попробуем получить данные пользователя напрямую из Telegram WebApp
          if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
            console.log('Fallback: using initDataUnsafe.user');
            const telegramUser = window.Telegram.WebApp.initDataUnsafe.user;
            userTg.value = {
              first_name: telegramUser.first_name || "",
              last_name: telegramUser.last_name || "",
              username: telegramUser.username || "",
              id: String(telegramUser.id) || "",
              photo_url: telegramUser.photo_url || "",
            };
            localStorage.setItem("user", JSON.stringify(userTg.value));
            console.log('Set user data from initDataUnsafe:', userTg.value);
          }
        }
      } else {
        console.log('No initData found');
        
        // Попробуем получить данные из initDataUnsafe как fallback
        if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
          console.log('Fallback: using initDataUnsafe.user (no initData)');
          const telegramUser = window.Telegram.WebApp.initDataUnsafe.user;
          userTg.value = {
            first_name: telegramUser.first_name || "",
            last_name: telegramUser.last_name || "",
            username: telegramUser.username || "",
            id: String(telegramUser.id) || "",
            photo_url: telegramUser.photo_url || "",
          };
          localStorage.setItem("user", JSON.stringify(userTg.value));
          console.log('Set user data from initDataUnsafe (no initData):', userTg.value);
        }
      }
    } else {
      const savedBrowserUser = getSavedBrowserUser();

      if (savedBrowserUser) {
        userTg.value = normalizeTelegramUser(savedBrowserUser);
        localStorage.setItem("user", JSON.stringify(userTg.value));
        console.log('Set user data from browser auth:', userTg.value);
      } else {
        console.log('Telegram WebApp not available and browser auth user is empty');
      }
    }
  };

  const createUser = async (): Promise<boolean> => {
    if (createUserPromise) {
      console.log('createUser already running, reusing the same request');
      return createUserPromise;
    }

    const telegramId = String(userTg.value.id || "");
    if (!telegramId) {
      console.error('Cannot create user: no tg_id available', userTg.value);
      return false;
    }

    createUserPromise = (async () => {
      try {
        isCreatingUser.value = true;
        const userData: any = {
          first_name: userTg.value.first_name,
          last_name: userTg.value.last_name,
          username: userTg.value.username || "",
          tg_id: telegramId,
        };

        if (referalId.value) userData.whoreferal = referalId.value;

        console.log('Creating user with data:', userData);
        const response = await axios.post(`/new_user`, userData);

        if (response.status === 200 || response.status === 201) {
          localStorage.setItem(`user_created_${telegramId}`, "true");
          referalId.value = "";
          return true;
        }

        return false;
      } catch (err: any) {
        console.error('Error creating user:', err);
        if (err.response?.status === 409) {
          localStorage.setItem(`user_created_${telegramId}`, "true");
          return true;
        }
        if (err.isNetworkError || (!err.response && err.request)) {
          showMessage(t('network_error') || 'Проблема с подключением к серверу', 'error');
        } else if (err.response?.data?.detail) {
          showMessage(err.response.data.detail, 'error');
        }
        return false;
      } finally {
        isCreatingUser.value = false;
      }
    })();

    try {
      return await createUserPromise;
    } finally {
      createUserPromise = null;
    }
  };

  const getUser = async (): Promise<void> => {
    if (getUserPromise) {
      console.log('getUser already running, reusing the same request');
      return getUserPromise;
    }

    getUserPromise = (async () => {
      clearAllMessages();
      try {
        isLoading.value = true;
      console.log('Getting user data for ID:', userTg.value.id);
      console.log('Network status:', navigator.onLine ? 'online' : 'offline');
      console.log('Base URL:', axios.defaults.baseURL);
      console.log('Full userTg object:', userTg.value);
      
      // Проверяем валидность ID пользователя
      if (!userTg.value?.id) {
        console.error('No user ID available');
        console.error('userTg.value:', userTg.value);
        console.error('Telegram WebApp state:', {
          available: !!window.Telegram?.WebApp,
          initData: window.Telegram?.WebApp?.initData,
          initDataUnsafe: window.Telegram?.WebApp?.initDataUnsafe
        });
        return;
      }

      let response;
      try {
        response = await axios.get(`/user/${userTg.value.id}`);
      } catch (err: any) {
        if (err.response?.status !== 404) throw err;

        const created = await createUser();
        if (!created) return;
        response = await axios.get(`/user/${userTg.value.id}`);
      }

      console.log('Received user data from server:', response.data);
      user.value = response.data;
      balance.value = response.data.balance || 0;
      pinCode.value = response.data.pincode;

      // Устанавливаем состояние активности пин-кода на основе поля boolpin
      codePasswordActive.value = !!response.data.boolpin;

      // Устанавливаем состояние скрытия баланса на основе поля visibility_balance
      hideBalanceActive.value = !!response.data.visibility_balance;

      // Синхронизируем localStorage с серверными данными
      syncSettingsWithLocalStorage();

      history.value = response.data.list_transctions_replenished;

      // Обновляем рублевый баланс
      balance_rub.value = balance.value * (usdt_price.value || 95);
      
      console.log('User data loaded successfully:', { balance: balance.value, userId: user.value.tg_id });
      
      } catch (err: any) {
        console.error('Error getting user:', err);
        if (err.isNetworkError || (!err.response && err.request)) {
          showMessage(t('network_error') || 'Проблема с подключением к серверу', 'error');
        } else if (err.response?.data?.detail) {
          showMessage(err.response.data.detail, 'error');
        }
      } finally {
        isLoading.value = false;
      }
    })();

    try {
      await getUserPromise;
    } finally {
      getUserPromise = null;
    }
  };

  const getPrice = async () => {
    try {
      console.log('Getting price data...');
      let response = await axios.get("/last_price");

      usdt_price.value = response.data.last_price;
      // Сохраняем полученную цену
      localStorage.setItem('last_usdt_price', String(usdt_price.value));
      
      console.log('Price loaded successfully:', usdt_price.value);
      
      // Обновляем рублевый баланс если есть баланс
      if (balance.value !== undefined) {
        balance_rub.value = balance.value * usdt_price.value;
      }
      
    } catch (err) {
      console.error('Error getting price:', err);
      
      // Используем последнюю сохраненную цену или дефолтную
      const savedPrice = localStorage.getItem('last_usdt_price');
      if (savedPrice) {
        usdt_price.value = parseFloat(savedPrice);
        console.log('Using saved price:', usdt_price.value);
      } else {
        usdt_price.value = 95; // Дефолтная цена
        console.log('Using default price:', usdt_price.value);
      }
      
      if (err.isNetworkError || (!err.response && err.request)) {
        showMessage(t('network_error') || 'Не удалось получить курс валют', 'error');
      } else {
        showMessage(t('price_error') || 'Используется последний известный курс', 'warning');
      }
    }
  };

  // Функция для запуска таймера обратного отсчета
  const startInvoiceTimer = () => {
    const now = Date.now();
    const timeSinceLastInvoice = now - lastInvoiceTime.value;
    const oneMinute = 60 * 1000;
    
    if (timeSinceLastInvoice < oneMinute) {
      remainingInvoiceTime.value = Math.ceil((oneMinute - timeSinceLastInvoice) / 1000);
      
      const timer = setInterval(() => {
        const currentTime = Date.now();
        const currentTimeSince = currentTime - lastInvoiceTime.value;
        
        if (currentTimeSince >= oneMinute) {
          remainingInvoiceTime.value = 0;
          clearInterval(timer);
        } else {
          remainingInvoiceTime.value = Math.ceil((oneMinute - currentTimeSince) / 1000);
        }
      }, 1000);
    } else {
      remainingInvoiceTime.value = 0;
    }
  };

  const createInvoice = async (cryptocurrency = "USDT_TRC20") => {
    try {
      clearAllMessages();
      
      // Проверка ограничения по времени - только раз в минуту
      const now = Date.now();
      const timeSinceLastInvoice = now - lastInvoiceTime.value;
      const oneMinute = 60 * 1000; // 60 секунд в миллисекундах
      
      if (timeSinceLastInvoice < oneMinute) {
        const remainingSeconds = Math.ceil((oneMinute - timeSinceLastInvoice) / 1000);
        showMessage(`Подождите ${remainingSeconds} секунд перед созданием нового счета`, 'warning');
        startInvoiceTimer(); // Запускаем таймер для отображения оставшегося времени
        throw new Error('Rate limit exceeded');
      }
      
      // НЕ устанавливаем глобальный isLoading для createInvoice
      // isLoading.value = true;
      // Убеждаемся что используем правильный tg_id
      const tgId = user.value.tg_id || userTg.value.id;
      console.log('Using tg_id for invoice:', tgId);
      console.log('user.value.tg_id:', user.value.tg_id);
      console.log('userTg.value.id:', userTg.value.id);
      
      if (!tgId) {
        console.error('Нет tg_id для создания счета');
        showMessage('Не удалось определить пользователя', 'error');
        throw new Error('No tg_id available');
      }
      console.log('user.value.tg_id:', user.value.tg_id);
      console.log('userTg.value.id:', userTg.value.id);
      
      if (!tgId) {
        console.error('Нет tg_id для создания счета');
        showMessage('Не удалось определить пользователя', 'error');
        throw new Error('No tg_id available');
      }
      
      let response = await axios.post(`/create_invoces`, {
        tg_id: String(tgId),
        amount: amount.value,
        cryptocurrency: cryptocurrency,
      });

      const payload = response?.data ?? {};
      const result = payload?.result ?? {};
      const rawLink = typeof result?.link === "string" ? result.link.trim() : "";
      const legacyLink = typeof payload?.data === "string" && /^https?:\/\//i.test(payload.data.trim())
        ? payload.data.trim()
        : "";
      const invoiceLink = rawLink || legacyLink;
      const invoiceUuid = String(
        result?.uuid ||
        payload?.creating_invoce_db?.transaction_id ||
        (typeof payload?.data === "string" && !/^https?:\/\//i.test(payload.data.trim()) ? payload.data.trim() : "") ||
        ""
      );

      let isValidPaymentLink = false;
      try {
        const parsedLink = new URL(invoiceLink);
        isValidPaymentLink = parsedLink.protocol === "https:" || parsedLink.protocol === "http:";
      } catch (_error) {
        isValidPaymentLink = false;
      }

      if (payload?.ok !== false && isValidPaymentLink && invoiceUuid) {
        pay_link.value = invoiceLink;
        working_invoice = invoiceUuid;
        // creating_invoce_db уже приходит в этом ответе: повторный запрос не нужен.
        
        // Обновляем время последнего создания инвойса
        lastInvoiceTime.value = Date.now();
        
        console.log('Pay link set:', pay_link.value);
        console.log('Pay link type:', typeof pay_link.value);
        console.log('Invoice created:', {
          uuid: working_invoice,
          link: pay_link.value,
          transactionId: payload?.creating_invoce_db?.transaction_id,
          databaseId: payload?.creating_invoce_db?.id,
        });
        
        // Возвращаем ссылку для использования в модальном окне
        return pay_link.value;
      } else {
        console.error('Invalid create_invoces response:', {
          ok: payload?.ok,
          hasLink: Boolean(invoiceLink),
          validLink: isValidPaymentLink,
          hasUuid: Boolean(invoiceUuid),
          detail: payload?.detail,
        });
        showMessage(t('invoice_creation_failed') || 'Не удалось создать счет для оплаты', 'error');
        throw new Error(payload?.detail || 'Invoice creation failed');
      }
    } catch (err) {
      console.error('Error creating invoice:', err);
      if (isTimeoutError(err)) {
        showMessage(t('error_timer') || 'Истекло время запроса', 'error');
      } else if (isNetworkError(err)) {
        showMessage(t('network_error') || 'Проблема с подключением к серверу', 'error');
      } else if (err.response?.status === 400) {
        showMessage(t('invalid_amount') || 'Некорректная сумма', 'error');
      } else if (err.response?.data?.detail) {
        showMessage(err.response.data.detail, 'error');
      } else {
        showMessage(t('invoice_creation_failed') || 'Не удалось создать счет для оплаты', 'error');
      }
      throw err;
    } finally {
      // НЕ сбрасываем глобальный isLoading для createInvoice
      // isLoading.value = false;
    }
  };

  const creatingInvoceDb = async () => {
    try {
      const tgId = user.value.tg_id || userTg.value.id;
      console.log('Creating invoice DB with tg_id:', tgId);
      
      let response = await axios.post("/creating_invoce_db", {
        datatime: new Date(),
        amount: String(amount.value),
        id_tg_user: tgId,
        working_invoce: working_invoice,
        type_trans: 'input'
      });
      
      if (response.status !== 200) {
        console.warn('Invoice DB creation returned non-200 status:', response.status);
      }
    } catch (err) {
      console.error('Error creating invoice in DB:', err);
      
      // Пробрасываем ошибку 400 с сообщением "транзакция уже есть"
      if (err.response?.status === 400 && 
          err.response?.data?.detail === "транзакция уже есть") {
        throw err; // Пробрасываем ошибку дальше для обработки в deposit.vue
      }
      
      // Для других ошибок не показываем пользователю, так как это внутренняя операция
      // но логируем для отладки
    }
  };

  const logOut = () => {
    try {
      localStorage.clear();
      router.push("/");
    } catch (err) {}
  };

  const updateEmail = async () => {
    try {
      isLoading.value = true;
      let response = await axios.patch(`/update_email/${user.value.tg_id}`, {
        email: email.value,
      });
      
      if (response.status === 200) {
        showMessage(t('email_updated') || 'Email успешно обновлен', 'success');
      }
    } catch (err) {
      console.error('Error updating email:', err);
      if (isNetworkError(err)) {
        showMessage(t('network_error') || 'Проблема с подключением к серверу', 'error');
      } else if (err.response?.status === 400) {
        showMessage(t('invalid_email') || 'Некорректный email адрес', 'error');
      } else if (err.response?.data?.detail) {
        showMessage(err.response.data.detail, 'error');
      } else {
        showMessage(t('email_update_failed') || 'Не удалось обновить email', 'error');
      }
    } finally {
      isLoading.value = false;
    }
  };

  const sendCode = async () => {
    try {
      isLoading.value = true;
      let response = await axios.patch(`/send_code?email=${email.value}`);

      if (response.status == 200) {
        showMessage(t('code_sent') || 'Код отправлен на email', 'success');
        router.push({ name: "enter_code" });
      }
    } catch (err) {
      console.error('Error sending code:', err);
      if (isNetworkError(err)) {
        showMessage(t('network_error') || 'Проблема с подключением к серверу', 'error');
      } else if (err.response?.status === 400) {
        showMessage(t('invalid_email') || 'Некорректный email адрес', 'error');
      } else if (err.response?.status === 429) {
        showMessage(t('too_many_requests') || 'Слишком много запросов, попробуйте позже', 'error');
      } else if (err.response?.data?.detail) {
        showMessage(err.response.data.detail, 'error');
      } else {
        showMessage(t('code_send_failed') || 'Не удалось отправить код', 'error');
      }
    } finally {
      isLoading.value = false;
    }
  };

  const checkCode = async () => {
    // Проверяем наличие всех необходимых данных
    if (!code.value || String(code.value).trim() === '') {
      showMessage(t('invalid_code') || 'Введите код', 'error');
      return;
    }
    
    if (!email.value?.trim()) {
      showMessage('Email не указан', 'error');
      return;
    }
    
    if (!user.value?.tg_id) {
      showMessage('Ошибка авторизации', 'error');
      return;
    }

    try {
      isLoading.value = true;
      console.log('Checking code with data:', {
        email: email.value,
        code: code.value,
        tg_id: user.value.tg_id
      });
      
      let response = await axios.patch(
        `/check_code?email=${encodeURIComponent(email.value)}&code=${encodeURIComponent(code.value)}&tg_id=${encodeURIComponent(user.value.tg_id)}`
      );
      
      console.log('Check code response:', response.status, response.data);
      code.value = "";

      if (response.status == 200) {
        message_status.value = "success";
        showMessage(t('email_verified') || 'Email успешно подтвержден', 'success');
        
        // Обновляем данные пользователя чтобы убрать кнопку "Добавить email"
        await getUser();
        
        setTimeout(() => {
          message_status.value = "";
          router.push({ name: "profile" });
        }, 2500);
      }
    } catch (err) {
      console.error('Error checking code:', err);
      message_status.value = "error";
      
      if (isNetworkError(err)) {
        showMessage(t('network_error') || 'Проблема с подключением к серверу', 'error');
      } else if (err.response?.status === 400) {
        showMessage(t('invalid_code') || 'Неверный код', 'error');
      } else if (err.response?.data?.detail) {
        showMessage(err.response.data.detail, 'error');
      } else {
        showMessage(t('code_verification_failed') || 'Не удалось проверить код', 'error');
      }
      
      setTimeout(() => {
        message_status.value = "";
      }, 2500);
    } finally {
      isLoading.value = false;
    }
  };

  const goTransaction = async (item) => {
    try {
      // Загружаем цену только если её нет
      if (!usdt_price.value) {
        await getPrice();
      }
      transaction.value = { ...item };
      transaction.value.amountRub = isCashbackTransaction(item?.type_trans)
        ? item.amount
        : getRub(item.amount);

      router.push({ name: "transaction" });
    } catch (err) {
      console.error('Error going to transaction:', err);
      showMessage(t('transaction_load_failed') || 'Не удалось загрузить данные транзакции', 'error');
    }
  };

  const getHistorySignature = (item: any) =>
    [
      item?.id ?? "",
      item?.datatime ?? "",
      item?.amount ?? "",
      item?.type_trans ?? "",
      item?.bool_suecess ?? "",
      item?.working_invoce ?? "",
    ].join("|");

  const openLatestTransactionFromHistory = async (
    previousSignatures: Set<string> = new Set()
  ) => {
    try {
      await getUser();

      if (!history.value?.length) {
        return false;
      }

      const sortByNewest = (items: any[]) =>
        [...items].sort((a, b) => {
          const left = getBackendDateTimestamp(a?.datatime);
          const right = getBackendDateTimestamp(b?.datatime);
          return right - left;
        });

      const newItems = history.value.filter(
        (item) => !previousSignatures.has(getHistorySignature(item))
      );

      const successItems = sortByNewest(newItems).filter(
        (item) => normalizeTransactionStatus(item?.bool_suecess) === "success"
      );

      const fallbackSuccessItems = sortByNewest(history.value).filter(
        (item) => normalizeTransactionStatus(item?.bool_suecess) === "success"
      );

      const targetTransaction = successItems[0] || fallbackSuccessItems[0];

      if (!targetTransaction) {
        return false;
      }

      await goTransaction(targetTransaction);
      return true;
    } catch (openError) {
      console.error("Error opening latest transaction from history:", openError);
      return false;
    }
  };

  const wait = (ms: number) =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    });

  const openLatestTransactionFromHistoryWithRetry = async (
    previousSignatures: Set<string> = new Set(),
    retries = 4,
    delayMs = 900
  ) => {
    for (let attempt = 0; attempt < retries; attempt += 1) {
      const opened = await openLatestTransactionFromHistory(previousSignatures);
      if (opened) {
        return true;
      }

      if (attempt < retries - 1) {
        await wait(delayMs);
      }
    }

    return false;
  };

  const getRub = (amount) => {
    try {
      if (!amount || !usdt_price.value) {
        return '0.00';
      }
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      if (isNaN(numAmount)) {
        return '0.00';
      }
      return `${Math.round(numAmount * usdt_price.value * 100) / 100}`;
    } catch (err) {
      console.error('Error calculating rub amount:', err);
      return '0.00';
    }
  };

  const qrTake = async (link: string) => {
    let shouldShowFailedRoute = false;

    try {
      clearAllMessages();
      loaderScan.value = true;
      const previousHistorySignatures = new Set(
        (history.value || []).map((item) => getHistorySignature(item))
      );

      const rawLink = String(link || "").trim();

      if (!rawLink) {
        transactionErrorMessage.value =
          t("invalid_qr_code") || "Некорректный QR-код";
        shouldShowFailedRoute = true;
        return;
      }

      // Некоторые QR приходят не абсолютным URL, поэтому извлекаем параметры безопасно.
      const bank = extractQrParam(rawLink, "bank");
      const sum = extractQrParam(rawLink, "sum");
      const cur = extractQrParam(rawLink, "cur");
      const crc = extractQrParam(rawLink, "crc");

      // Отправляем данные как query параметры
      const tgId = user.value.tg_id || userTg.value.id;
      const params = new URLSearchParams({
        tg_id: String(tgId),
        qr_url: rawLink,
        bank: bank,
        sum: sum,
        cur: cur,
        crc: crc,
      });

      let response = await axios.post(
        `/qr_take?${params.toString()}`,
        {},
        { timeout: 70000 }
      );

      if (response.status == 200) {
        const hasMoreDetail = !!response.data?.more_detail;
        const { type_trans, bool_suecess } = response.data || {};

        if (!hasMoreDetail) {
          const messageText = String(response.data?.message || "").toLowerCase();
          const statusText = String(response.data?.status || "").toLowerCase();
          const looksSuccessful =
            statusText === "success" ||
            messageText.includes("processed") ||
            messageText.includes("success");

          if (looksSuccessful) {
            const opened = await openLatestTransactionFromHistoryWithRetry(
              previousHistorySignatures
            );

            if (!opened) {
              showMessage(
                t("payment_successful") || "Платеж успешно выполнен!",
                "success"
              );
              router.push({ name: "history" });
            }
            return;
          }

          transactionErrorMessage.value =
            response.data?.detail ||
            response.data?.message ||
            t("transaction_error");
          shouldShowFailedRoute = true;
          return;
        }

        let { id, datatime } = response.data.more_detail;
        let amount_usdt = response.data.more_detail.amount;

        if (isTransactionErrorStatus(bool_suecess)) {
          transactionErrorMessage.value =
            response.data?.detail ||
            response.data?.message ||
            t("transaction_error");
          shouldShowFailedRoute = true;
          return;
        }
        
        // Загружаем цену только если её нет
        if (!usdt_price.value) {
          await getPrice();
        }
        
        let amount_rub = amount_usdt * usdt_price.value;
        router.push({
          name: "transaction",
          query: {
            id,
            amount_rub,
            amount_usdt,
            datatime,
            type_trans,
            bool_suecess,
          },
        });
      }
    } catch (err) {
      console.error('Error processing QR code:', err);
      const detailMessage = err.response?.data?.detail;
      
      if (isTimeoutError(err)) {
        transactionErrorMessage.value = t("error_timer") || "Истекло время запроса";
        showMessage(t("error_timer") || "Истекло время запроса", "error");
      } else if (isNetworkError(err)) {
        transactionErrorMessage.value =
          t('network_error') || 'Проблема с подключением к серверу';
        showMessage(t('network_error') || 'Проблема с подключением к серверу', 'error');
      } else if (detailMessage == "Недостаточно средств") {
        transactionErrorMessage.value = t("insufficient_funds");
        errMessage.value = t("insufficient_funds");
        showMessage(t("insufficient_funds"), 'error');
      } else if (detailMessage) {
        transactionErrorMessage.value = detailMessage;
        errMessage.value = detailMessage;
        showMessage(detailMessage, 'error');
      } else if (err.response?.status === 400) {
        transactionErrorMessage.value =
          t('invalid_qr_code') || 'Некорректный QR-код';
        showMessage(t('invalid_qr_code') || 'Некорректный QR-код', 'error');
      } else if (err.response?.status === 404) {
        transactionErrorMessage.value =
          t('payment_not_found') || 'Платеж не найден';
        showMessage(t('payment_not_found') || 'Платеж не найден', 'error');
      } else {
        transactionErrorMessage.value =
          t('qr_processing_failed') || 'Не удалось обработать QR-код';
        showMessage(t('qr_processing_failed') || 'Не удалось обработать QR-код', 'error');
      }

      shouldShowFailedRoute = true;
    } finally {
      loaderScan.value = false;
      if (shouldShowFailedRoute) {
        router.replace({ name: "transaction_failed" });
      }
    }
  };

  const withdrawFunds = async (
    amount: string,
    network: string,
    wallet: string,
    memo?: string,
    twoFactorCode?: string
  ) => {
    try {
      loaderScan.value = true;

      // Отправляем данные как query параметры
      const tgId = user.value.tg_id || userTg.value.id;
      const params = new URLSearchParams({
        tg_id: String(tgId),
        amount: amount,
        network: network,
        wallet: wallet,
      });

      // Добавляем memo только если оно заполнено
      if (memo && memo.trim() !== "") {
        params.append("memo", memo);
      }

      // Добавляем 2FA код если передан
      if (twoFactorCode && twoFactorCode.trim() !== "") {
        params.append("key", twoFactorCode.trim());
      }

      let response = await axios.post(
        `/daddy_pleasу_output?${params.toString()}`,
        {}
      );

      if (response.status == 200) {
        console.log('Withdraw response:', response.data);
        
        // Проверяем разные варианты успешного ответа
        if (response.data.message === "Balance updated successfully") {
          // Успешный вывод - НЕ обновляем баланс автоматически
          return true;
        } else if (response.data.more_detail) {
          // Стандартный ответ с деталями транзакции
          return true;
        } else {
          // Если структура ответа не распознана, но статус 200
          console.warn('Unexpected response structure:', response.data);
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('Withdraw error:', err.response?.status, err.response?.data);
      
      if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
        showMessage(t('network_error') || 'Проблема с подключением к серверу', 'error');
      } else if (err.response?.data?.detail == "Недостаточно средств") {
        errMessage.value = t("insufficient_funds");
      } else if (err.response?.status === 404 && err.response?.data?.detail === "Не верный код!") {
        errMessage.value = t("invalid_2fa_code") || 'Неверный код двухфакторной аутентификации';
        // НЕ вызываем showMessage, чтобы сообщение не исчезало
      } else if (err.response?.data?.detail === "Неверный код" || err.response?.data?.detail === "Invalid code") {
        errMessage.value = t("invalid_2fa_code") || 'Неверный код двухфакторной аутентификации';
      } else if (err.response?.status === 400) {
        showMessage(t('invalid_amount') || 'Некорректные данные', 'error');
      } else if (err.response?.data?.detail) {
        errMessage.value = err.response.data.detail;
      } else {
        showMessage(t("failed_text"), 'error');
      }
      router.push({ name: "transaction_failed" });
      return false;
    } finally {
      loaderScan.value = false;
    }
  };

  const getMyReferrals = async () => {
    try {
      const tgId = user.value.tg_id || userTg.value.id;
      if (!tgId) return [];

      let response = await axios.get(`/my_ref/${tgId}`);

      if (response.status === 200) {
        return response.data; // Возвращаем массив напрямую
      }
      return [];
    } catch (err) {
      console.error('Error getting referrals:', err);
      
      if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
        showMessage(t('network_error') || 'Проблема с подключением к серверу', 'error');
      } else if (err.response?.status !== 404) {
        // Не показываем ошибку для 404, просто возвращаем пустой массив
        showMessage(t('referrals_load_failed') || 'Не удалось загрузить список рефералов', 'error');
      }
      
      return []; // Возвращаем пустой массив при ошибке
    }
  };

  const serializeAuthParams = (params: Record<string, unknown>) => {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      query.set(
        key,
        typeof value === "object" && value !== null
          ? JSON.stringify(value)
          : String(value || "")
      );
    });

    return query.toString();
  };

  const getMyCashback = async () => {
    try {
      const tgId = getCurrentTelegramId();
      if (!tgId) return null;

      const params = {
        tg_id: tgId,
        telegram_data: getTelegramDataForRequest(),
      };

      const response = await axios.get(
        `/my_cash_back?${serializeAuthParams(params)}`
      );

      if (response.status === 200) {
        return response.data;
      }

      return null;
    } catch (err: any) {
      console.error("Error getting cashback:", err);

      if (err.code === "NETWORK_ERROR" || err.message === "Network Error") {
        showMessage(t("network_error") || "Проблема с подключением к серверу", "error");
      }

      return null;
    }
  };

  const updateMyReferralCode = async (refCode: string) => {
    try {
      const tgId = getCurrentTelegramId();
      const normalizedCode = String(refCode || "").trim();

      if (!tgId || !normalizedCode) {
        showMessage("Введите реферальный код", "error");
        return false;
      }

      const params = {
        tg_id: tgId,
        ref_str: normalizedCode.startsWith("referal_")
          ? normalizedCode
          : `referal_${normalizedCode}`,
        telegram_data: getTelegramDataForRequest(),
      };

      const response = await axios.post(
        `/update_my_ref?${serializeAuthParams(params)}`,
        {}
      );

      if (response.status === 200) {
        showMessage("Реферальный код сохранён", "success");
        await getUser();
        return true;
      }

      return false;
    } catch (err: any) {
      console.error("Error updating referral code:", err);
      showMessage(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Не удалось сохранить реферальный код",
        "error"
      );
      return false;
    }
  };

  const is2FAEnabledResponse = (data: any): boolean => {
    const detail = String(data?.detail || data?.message || "")
      .toLowerCase()
      .replace(/[!.,]/g, "")
      .trim();

    return (
      data?.connected === true ||
      data?.enabled === true ||
      data?.has_2fa === true ||
      data?.has2FA === true ||
      String(data?.status || "").toLowerCase() === "enabled" ||
      detail.includes("уже подключ") ||
      detail.includes("already connected") ||
      detail.includes("already enabled")
    );
  };

  const enable2FA = async () => {
    try {
      loaderScan.value = true;
      const tgId = String(user.value.tg_id || userTg.value.id);
      
      // Формируем URL параметры
      const params = new URLSearchParams({
        tg_id: tgId
      });
      
      let response = await axios.post(`/fa_take?${params.toString()}`, {});

      if (is2FAEnabledResponse(response.data)) {
        has2FA.value = true;
        return {
          success: true,
          alreadyEnabled: true,
          detail: response.data?.detail,
        };
      }

      if ((response.status === 200 || response.status === 202) && response.data.status === "success") {
        return {
          success: true,
          detail: response.data.detail,
          qrImage: response.data.qr_image_base64,
          key: response.data.key,
        };
      }
      return { success: false, detail: response.data?.detail };
    } catch (err) {
      console.error('Error enabling 2FA:', err);
      
      if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
        showMessage(t('network_error') || 'Проблема с подключением к серверу', "error");
      } else if (err.response?.data?.detail) {
        showMessage(err.response.data.detail, "error");
      } else {
        showMessage(t('2fa_setup_failed') || 'Не удалось настроить 2FA', "error");
      }
      
      return { success: false };
    } finally {
      loaderScan.value = false;
    }
  };

  const verify2FACode = async (code: string) => {
    try {
      loaderScan.value = true;
      const tgId = String(user.value.tg_id || userTg.value.id);
      const keyCode = String(code);
      
      // Формируем URL параметры
      const params = new URLSearchParams({
        tg_id: tgId,
        key: keyCode
      });
      
      let response = await axios.post(`/key_fa_check?${params.toString()}`, {});

      if (response.status === 200 && response.data.status === "success") {
        has2FA.value = true; // Обновляем статус 2FA
        showMessage(t("2fa_enabled_success"), "success");
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error verifying 2FA code:', err);
      
      if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
        showMessage(t('network_error') || 'Проблема с подключением к серверу', "error");
      } else if (err.response?.status === 400 || err.response?.status === 404) {
        showMessage(t("invalid_2fa_code") || 'Неверный код двухфакторной аутентификации', "error");
      } else if (err.response?.data?.detail) {
        showMessage(err.response.data.detail, "error");
      } else {
        showMessage(t('2fa_verification_failed') || 'Не удалось проверить код 2FA', "error");
      }
      return false;
    } finally {
      loaderScan.value = false;
    }
  };

  const is2FAChecking = ref(false);
  let check2FAPromise: Promise<boolean> | null = null;

  const check2FAStatus = async (): Promise<boolean> => {
    if (check2FAPromise) return check2FAPromise;

    check2FAPromise = (async () => {
      try {
      is2FAChecking.value = true;
      const tgId = String(user.value.tg_id || userTg.value.id);
      
      if (!tgId || tgId === 'undefined') {
        console.log('No valid user ID for 2FA check');
        return false;
      }

      // Пробуем получить статус 2FA через существующий endpoint
      
      // Формируем URL параметры
      const params = new URLSearchParams({
        tg_id: tgId
      });
      
      let response = await axios.post(`/fa_take?${params.toString()}`, {});

        has2FA.value = is2FAEnabledResponse(response.data);
        return has2FA.value;
      } catch (err) {
        console.error('Error checking 2FA status:', err);
        return has2FA.value;
      } finally {
        is2FAChecking.value = false;
      }
    })();

    try {
      return await check2FAPromise;
    } finally {
      check2FAPromise = null;
    }
  };

  const getUserWallet = async () => {
    try {
      const tgId = String(user.value.tg_id || userTg.value.id);
      
      // Формируем URL параметры
      const params = new URLSearchParams({
        tg_id: tgId
      });
      
      let response = await axios.post(`/take_user_w?${params.toString()}`, {});

      if (response.status === 200 && response.data.wallet) {
        userWallet.value = response.data.wallet;
        return response.data.wallet;
      }
      return null;
    } catch (err) {
      console.error('Error getting user wallet:', err);
      
      if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
        showMessage(t('network_error') || 'Проблема с подключением к серверу', "error");
      } else if (err.response?.status === 404) {
        showMessage(t('wallet_not_found') || 'Кошелек не найден', "error");
      } else if (err.response?.data?.detail) {
        showMessage(err.response.data.detail, "error");
      } else {
        showMessage(t('wallet_load_failed') || 'Не удалось загрузить кошелек', "error");
      }
      
      return null;
    }
  };

  const getUserWalletWith2FACheck = async () => {
    try {
      const tgId = String(user.value.tg_id || userTg.value.id);

      // Сначала отправляем запрос на fa_take
      
      // Формируем URL параметры
      const params = new URLSearchParams({
        tg_id: tgId
      });
      
      let faResponse = await axios.post(`/fa_take?${params.toString()}`, {});

      // Если detail: 'Уже подключено', то получаем wallet через take_user_w
      if (is2FAEnabledResponse(faResponse.data)) {
        // Обновляем статус 2FA, так как он уже подключен
        has2FA.value = true;
        return await getUserWallet();
      }

      // Если есть ключ, возвращаем его для отображения
      if (faResponse.data && faResponse.data.key) {
        return { key: faResponse.data.key };
      }

      return null;
    } catch (err) {
      showMessage(t("error_occurred"), "error");
      return null;
    }
  };

  const transferFunds = async (
    recipientWallet: string,
    amount: string,
    twoFactorCode: string
  ) => {
    try {
      loaderScan.value = true;

      const tgId = user.value.tg_id || userTg.value.id;
      const queryString = new URLSearchParams({
        tg_id: String(tgId),
        key: String(twoFactorCode),
        amount: String(amount),
        wallet: String(recipientWallet),
      }).toString();

      let response = await axios.post(
        `/transfer_cash_wallet?${queryString}`,
        {}
      );

      if (response.status === 200) {
        if (response.data.message === "Balance updated successfully") {
          setTimeout(() => getUser(), 500);

          loaderScan.value = false;
          router.push({
            name: "transaction",
            query: {
              id: String(Date.now()),
              amount_rub: safeAmountRub(amount, usdt_price.value),
              amount_usdt: safeQueryValue(amount, "0"),
              datatime: formatDateForTransaction(),
              type_trans: "transfer",
              bool_suecess: "1",
            },
          });
          return true;
        } else if (response.data.more_detail) {
          const details = response.data.more_detail || {};
          const id = safeQueryValue(details.id, String(Date.now()));
          const datatime = safeQueryValue(details.datatime, formatDateForTransaction());
          const bool_suecess = safeQueryValue(
            response.data?.bool_suecess ?? response.data?.success ?? "1",
            "1"
          );
          const amount_usdt = safeQueryValue(details.amount, amount);
          const type_trans = normalizeTransferResponseType(response.data?.type_trans);

          if (normalizeTransactionStatus(bool_suecess) === "error") {
            transactionErrorMessage.value =
              response.data?.detail ||
              response.data?.message ||
              t("transfer_failed");
            loaderScan.value = false;
            router.replace({ name: "transaction_failed" });
            return false;
          }

          setTimeout(() => getUser(), 500);

          loaderScan.value = false;
          router.push({
            name: "transaction",
            query: {
              id,
              amount_rub: safeAmountRub(amount_usdt, usdt_price.value),
              amount_usdt,
              datatime,
              type_trans,
              bool_suecess,
            },
          });
          return true;
        }
      }
      transactionErrorMessage.value =
        response.data?.detail ||
        response.data?.message ||
        t("transfer_failed");
      loaderScan.value = false;
      router.replace({ name: "transaction_failed" });
      return false;
    } catch (err) {
      if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
        transactionErrorMessage.value = t('network_error') || 'Проблема с подключением к серверу';
      } else if (
        err.response?.data?.detail === "Пользователь не найден" ||
        err.response?.data?.detail === "User not found"
      ) {
        transactionErrorMessage.value = t("user_not_found");
        showMessage(t("user_not_found"), "error");
      } else if (err.response?.data?.detail === "Недостаточно средств") {
        transactionErrorMessage.value = t("insufficient_funds");
        showMessage(t("insufficient_funds"), "error");
      } else if (err.response?.data?.detail === "Неверный код" || err.response?.data?.detail === "Invalid code") {
        transactionErrorMessage.value = t("invalid_2fa_code");
        showMessage(t("invalid_2fa_code"), "error");
      } else if (err.response?.status === 404) {
        transactionErrorMessage.value = t("invalid_2fa_code");
        showMessage(t("invalid_2fa_code"), "error");
      } else if (err.response?.status === 400) {
        transactionErrorMessage.value = t('invalid_amount') || 'Некорректная сумма';
        showMessage(t('invalid_amount') || 'Некорректная сумма', "error");
      } else if (err.response?.data?.detail) {
        transactionErrorMessage.value = err.response.data.detail;
        showMessage(err.response.data.detail, "error");
      } else {
        transactionErrorMessage.value = t("transfer_failed");
        showMessage(t("transfer_failed"), "error");
      }
      loaderScan.value = false;
      router.replace({ name: "transaction_failed" });
      return false;
    } finally {
      loaderScan.value = false;
    }
  };

  const roundToHundredths = (
    value: number | string | null | undefined
  ): string => {
    if (value === null || value === undefined || value === "") return "0.00";
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue)) return "0.00";
    const truncatedValue = Math.floor(numValue * 100) / 100;
    return truncatedValue.toFixed(2);
  };

  // Инициализация - загружаем сохраненную цену
  const initializeStore = () => {
    const savedPrice = localStorage.getItem('last_usdt_price');
    if (savedPrice) {
      usdt_price.value = parseFloat(savedPrice);
    }
  };



  const testConnection = async () => {
    try {
      console.log('Testing connection to server...');
      const response = await axios.get('/health', { timeout: 5000 });
      console.log('Connection test successful:', response.status);
      return true;
    } catch (err) {
      console.error('Connection test failed:', {
        code: err.code,
        message: err.message,
        status: err.response?.status,
        baseURL: axios.defaults.baseURL
      });
      return false;
    }
  };

  // Вызываем инициализацию
  initializeStore();

  return {
    qrTake,
    withdrawFunds,
    getMyReferrals,
    getMyCashback,
    updateMyReferralCode,
    enable2FA,
    verify2FACode,
    check2FAStatus,
    getUserWallet,
    getUserWalletWith2FACheck,
    transferFunds,
    getRub,
    goTransaction,
    transaction,
    history,
    code,
    checkCode,
    sendCode,
    updateEmail,
    email,
    isLoading,
    loaderScan,
    logOut,
    balance_rub,
    pay_link,
    amount,
    createInvoice,
    creatingInvoceDb,
    message_status,
    usdt_price,
    getPrice,
    getUserInfo,
    user,
    userTg,
    getUser,
    balance,
    changeLang,
    goBack,
    langs,
    codePasswordActive,
    hideBalanceActive,
    isDarkTheme,
    toggleTheme,
    pinCode,
    verifyPin,
    hasPinCode,
    setHideBalanceActive,
    setPinCode,
    disablePinCode,
    clearPinSession,
    clearAllPinData,
    initializePinState,
    syncSettingsWithLocalStorage,
    createUser,
    roundToHundredths,
    errMessage,
    transactionErrorMessage,
    referalId,
    showMessage,
    userWallet,
    has2FA,
    isPinRequired,
    initializeStore,
    lastInvoiceTime,
    remainingInvoiceTime,
    startInvoiceTimer,
  };
});
