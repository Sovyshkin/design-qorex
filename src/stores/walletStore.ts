import { defineStore } from "pinia";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import i18n from "@/i18n";
import { useRouter } from "vue-router";
import Cookies from "js-cookie";
import axios from "axios";

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
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
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
  });
  const user = ref<any>({});
  const amount = ref("");
  const pay_link = ref("");
  const codePasswordActive = ref(false);
  const hideBalanceActive = ref(false);
  const pinCode = ref("");
  const pinVerified = ref(false); // Новое состояние для отслеживания верификации PIN
  const pinVerificationTime = ref(0); // Время последней верификации
  const referalId = ref(""); // Добавляем переменную для реферального ID
  const isCreatingUser = ref(false); // Флаг для предотвращения повторного создания пользователя
  const userWallet = ref(""); // Номер кошелька пользователя для переводов
  const has2FA = ref(false); // Статус 2FA пользователя

  const history = ref([]);

  const transaction = ref<any>({});

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
        message_status.value = "success";
        codePasswordActive.value = true;
        pinVerified.value = true; // Автоматически верифицируем после установки
        pinVerificationTime.value = Date.now();
        // Синхронизируем localStorage после успешного обновления
        syncSettingsWithLocalStorage();
        setTimeout(() => {
          message_status.value = "";
          router.push({ name: "safety" });
        }, 2500);
      }
    } catch (error) {
      message_status.value = "error";
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
        message_status.value = "success";
        setTimeout(() => {
          message_status.value = "";
        }, 2500);
      }
    } catch (error) {
      message_status.value = "error";
      setTimeout(() => {
        message_status.value = "";
      }, 2500);
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

  const showMessage = (
    message: string,
    status: string = "error",
    duration: number = 3000
  ) => {
    errMessage.value = message;
    message_status.value = status;

    setTimeout(() => {
      errMessage.value = "";
      message_status.value = "";
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
        }
      } else {
        console.log('No initData found');
      }
    } else {
      console.log('Telegram WebApp not available, using fallback data');
      // Fallback данные для разработки/тестирования вне Telegram
      if (!userTg.value.id) {
        // Используем тестовые данные, которые уже есть в коде
        console.log('Using fallback user data:', userTg.value);
      }
    }
  };

  const createUser = async () => {
    if (isCreatingUser.value) {
      return; // Если уже создаем пользователя, не делаем повторный запрос
    }

    // Проверяем, не создавался ли уже пользователь ранее
    const userCreatedFlag = localStorage.getItem(
      `user_created_${userTg.value.id}`
    );
    if (userCreatedFlag) {
      return; // Пользователь уже был создан
    }

    try {
      isCreatingUser.value = true;
      const userData: any = {
        first_name: userTg.value.first_name,
        last_name: userTg.value.last_name,
        username: userTg.value.username,
        tg_id: String(userTg.value.id),
      };

      // Добавляем поле whoreferal если есть реферальный ID
      if (referalId.value) {
        userData.whoreferal = referalId.value;
      }

      let response = await axios.post(`/new_user`, userData);

      if (response.status === 200 || response.status === 201) {
        // Помечаем что пользователь создан
        localStorage.setItem(`user_created_${userTg.value.id}`, "true");
        
        // Очищаем реферальный ID после использования
        if (referalId.value) {
          referalId.value = "";
        }
        
        // Пользователь создан, данные загрузятся при следующем обращении
        // НЕ ВЫЗЫВАЕМ getUser() здесь - это приведет к рекурсии!
      }
    } catch (err) {
      console.error('Error creating user:', err);
      if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
        showMessage(t('network_error') || 'Проблема с подключением к серверу', 'error');
      } else if (err.response?.status === 409) {
        // Пользователь уже существует
        localStorage.setItem(`user_created_${userTg.value.id}`, "true");
      } else if (err.response?.data?.detail) {
        showMessage(err.response.data.detail, 'error');
      }
    } finally {
      isCreatingUser.value = false;
    }
  };

  const getUser = async () => {
    try {
      isLoading.value = true;
      console.log('Getting user data for ID:', userTg.value.id);
      
      // Проверяем валидность ID пользователя
      if (!userTg.value?.id) {
        console.error('No user ID available');
        // Пытаемся создать пользователя если ID отсутствует
        await createUser();
        return;
      }
      
      let response = await axios.get(`/user/${userTg.value.id}`);

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
      
    } catch (err) {
      console.error('Error getting user:', err);
      
      if (err.response?.status === 404) {
        // Пользователь не найден, создаем его
        console.log('User not found, creating new user');
        await createUser();
      } else if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
        showMessage(t('network_error') || 'Проблема с подключением к серверу', 'error');
      } else {
        showMessage(t('error_occurred') || 'Произошла ошибка при загрузке данных', 'error');
      }
    } finally {
      isLoading.value = false;
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
      
      if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
        showMessage(t('network_error') || 'Не удалось получить курс валют', 'error');
      } else {
        showMessage(t('price_error') || 'Используется последний известный курс', 'warning');
      }
    }
  };

  const createInvoice = async (cryptocurrency = "USDT_TRC20") => {
    try {
      isLoading.value = true;
      let response = await axios.post(`/create_invoces`, {
        tg_id: user.value.tg_id,
        amount: amount.value,
        cryptocurrency: cryptocurrency,
      });

      if (response.data.result) {
        pay_link.value = response.data.result.link;
        working_invoice = response.data.result.uuid;
        await creatingInvoceDb();
        window.location.href = pay_link.value;
      } else {
        showMessage(t('invoice_creation_failed') || 'Не удалось создать счет для оплаты', 'error');
      }
    } catch (err) {
      console.error('Error creating invoice:', err);
      if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
        showMessage(t('network_error') || 'Проблема с подключением к серверу', 'error');
      } else if (err.response?.status === 400) {
        showMessage(t('invalid_amount') || 'Некорректная сумма', 'error');
      } else if (err.response?.data?.detail) {
        showMessage(err.response.data.detail, 'error');
      } else {
        showMessage(t('invoice_creation_failed') || 'Не удалось создать счет для оплаты', 'error');
      }
    } finally {
      isLoading.value = false;
    }
  };

  const creatingInvoceDb = async () => {
    try {
      let response = await axios.post("/creating_invoce_db", {
        datatime: new Date(),
        amount: String(amount.value),
        id_tg_user: user.value.tg_id,
        working_invoce: working_invoice,
      });
      
      if (response.status !== 200) {
        console.warn('Invoice DB creation returned non-200 status:', response.status);
      }
    } catch (err) {
      console.error('Error creating invoice in DB:', err);
      // Не показываем ошибку пользователю, так как это внутренняя операция
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
      if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
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
      if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
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
    try {
      isLoading.value = true;
      let response = await axios.patch(
        `/check_code?email=${email.value}&code=${code.value}&tg_id=${user.value.tg_id}`
      );
      code.value = "";

      if (response.status == 200) {
        message_status.value = "success";
        showMessage(t('email_verified') || 'Email успешно подтвержден', 'success');
        setTimeout(() => {
          message_status.value = "";
          router.push({ name: "profile" });
        }, 2500);
      }
    } catch (err) {
      console.error('Error checking code:', err);
      message_status.value = "error";
      
      if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
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
      transaction.value.amountRub = getRub(item.amount);

      router.push({ name: "transaction" });
    } catch (err) {
      console.error('Error going to transaction:', err);
      showMessage(t('transaction_load_failed') || 'Не удалось загрузить данные транзакции', 'error');
    }
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
    try {
      loaderScan.value = true;

      // Парсим URL и извлекаем параметры
      const url = new URL(link);
      const bank = url.searchParams.get("bank") || "";
      const sum = url.searchParams.get("sum") || "";
      const cur = url.searchParams.get("cur") || "";
      const crc = url.searchParams.get("crc") || "";

      // Отправляем данные как query параметры
      const params = new URLSearchParams({
        tg_id: String(userTg.value.id),
        qr_url: link,
        bank: bank,
        sum: sum,
        cur: cur,
        crc: crc,
      });

      let response = await axios.post(`/qr_take?${params.toString()}`, {});

      if (response.status == 200) {
        let { id, datatime } = response.data.more_detail;
        let { type_trans, bool_suecess } = response.data;
        let amount_usdt = response.data.more_detail.amount;
        
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
      
      if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
        errMessage.value = t('network_error') || 'Проблема с подключением к серверу';
        showMessage(t('network_error') || 'Проблема с подключением к серверу', 'error');
      } else if (err.response?.data?.detail == "Недостаточно средств") {
        errMessage.value = t("insufficient_funds");
      } else if (err.response?.status === 400) {
        errMessage.value = t('invalid_qr_code') || 'Некорректный QR-код';
      } else if (err.response?.status === 404) {
        errMessage.value = t('payment_not_found') || 'Платеж не найден';
      } else if (err.response?.data?.detail) {
        errMessage.value = err.response.data.detail;
      } else {
        errMessage.value = t('qr_processing_failed') || 'Не удалось обработать QR-код';
      }
      
      router.push({ name: "transaction_failed" });
    } finally {
      loaderScan.value = false;
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
      const params = new URLSearchParams({
        tg_id: String(userTg.value.id),
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
          // Успешный вывод, обновляем баланс (асинхронно)
          setTimeout(() => getUser(), 500);
          return true;
        } else if (response.data.more_detail) {
          // Стандартный ответ с деталями транзакции
          setTimeout(() => getUser(), 500);
          return true;
        } else {
          // Если структура ответа не распознана, но статус 200
          console.warn('Unexpected response structure:', response.data);
          setTimeout(() => getUser(), 500);
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('Withdraw error:', err.response?.status, err.response?.data);
      
      if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
        errMessage.value = t('network_error') || 'Проблема с подключением к серверу';
        showMessage(t('network_error') || 'Проблема с подключением к серверу', 'error');
      } else if (err.response?.data?.detail == "Недостаточно средств") {
        errMessage.value = t("insufficient_funds");
      } else if (err.response?.data?.detail === "Неверный код" || err.response?.data?.detail === "Invalid code") {
        errMessage.value = t("invalid_2fa_code");
      } else if (err.response?.status === 400) {
        errMessage.value = t('invalid_amount') || 'Некорректные данные';
      } else if (err.response?.data?.detail) {
        errMessage.value = err.response.data.detail;
      } else {
        errMessage.value = t("failed_text");
      }
      router.push({ name: "transaction_failed" });
      return false;
    } finally {
      loaderScan.value = false;
    }
  };

  const getMyReferrals = async () => {
    try {
      let response = await axios.get(`/my_ref/${userTg.value.id}`);

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

  const enable2FA = async () => {
    try {
      loaderScan.value = true;
      const tgId = String(userTg.value.id);
      let response = await axios.post(`/fa_take?tg_id=${tgId}`);

      if (response.status === 200 && response.data.status === "success") {
        return {
          success: true,
          qrImage: response.data.qr_image_base64,
          key: response.data.key,
        };
      }
      return { success: false };
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
      const tgId = String(userTg.value.id);
      const keyCode = String(code);
      let response = await axios.post(
        `/key_fa_check?tg_id=${tgId}&key=${keyCode}`,
        {}
      );

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

  const check2FAStatus = async () => {
    try {
      const tgId = String(userTg.value.id);
      // Пробуем получить статус 2FA через существующий endpoint
      let response = await axios.post(`/fa_take?tg_id=${tgId}`);

      if (response.data.detail == "Уже подключено") {
        has2FA.value = true;
      } else {
        has2FA.value = false;
      }
    } catch (err) {
      console.error('Error checking 2FA status:', err);
      has2FA.value = false;
      
      // Не показываем сообщение об ошибке для этого метода,
      // так как он используется для проверки статуса
    }
  };

  const getUserWallet = async () => {
    try {
      const tgId = String(userTg.value.id);
      let response = await axios.post(`/take_user_w?tg_id=${tgId}`, {});

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
      const tgId = String(userTg.value.id);

      // Сначала отправляем запрос на fa_take
      let faResponse = await axios.post(`/fa_take?tg_id=${tgId}`);

      // Если detail: 'Уже подключено', то получаем wallet через take_user_w
      if (faResponse.data && faResponse.data.detail === "Уже подключено") {
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

      const requestParams = {
        tg_id: String(userTg.value.id),
        key: String(twoFactorCode),
        amount: String(amount),
        wallet: String(recipientWallet)
      };

      console.log('Transfer request params:', requestParams);

      // Строим query строку вручную, чтобы избежать кодирования = в wallet
      const queryString = `tg_id=${requestParams.tg_id}&key=${requestParams.key}&amount=${requestParams.amount}&wallet=${requestParams.wallet}`;
      
      console.log('Query string:', queryString);

      let response = await axios.post(
        `/transfer_cash_wallet?${queryString}`,
        {}
      );

      if (response.status === 200) {
        console.log('Transfer response:', response.data);
        
        // Проверяем разные варианты успешного ответа
        if (response.data.message === "Balance updated successfully") {
          // Успешный перевод, обновляем баланс асинхронно
          setTimeout(() => getUser(), 500);

          let amount_rub = parseFloat(amount) * usdt_price.value;
          
          // Перенаправляем на страницу транзакции с данными перевода
          router.push({
            name: "transaction",
            query: {
              id: Date.now().toString(), // Временный ID если нет в ответе
              amount_rub: amount_rub.toString(),
              amount_usdt: amount,
              datatime: formatDateForTransaction(),
              type_trans: "transfer",
              bool_suecess: "1",
            },
          });
          return true;
        } else if (response.data.more_detail) {
          // Стандартный ответ с деталями транзакции
          let { id, datatime } = response.data.more_detail || {};
          let { type_trans, bool_suecess } = response.data;
          let amount_usdt = response.data.more_detail?.amount || amount;

          // Обновляем баланс асинхронно
          setTimeout(() => getUser(), 500);

          let amount_rub = parseFloat(amount_usdt) * usdt_price.value;

          // Перенаправляем на страницу транзакции
          router.push({
            name: "transaction",
            query: {
              id,
              amount_rub,
              amount_usdt,
              datatime,
              type_trans: type_trans || "transfer",
              bool_suecess,
            },
          });
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('Transfer error:', err.response?.status, err.response?.data);
      
      // Сначала проверяем сетевые ошибки
      if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
        transactionErrorMessage.value = t('network_error') || 'Проблема с подключением к серверу';
        showMessage(t('network_error') || 'Проблема с подключением к серверу', "error");
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
      router.push({ name: "transaction_failed" });
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



  // Вызываем инициализацию
  initializeStore();

  return {
    qrTake,
    withdrawFunds,
    getMyReferrals,
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
  };
});
