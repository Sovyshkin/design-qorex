import { defineStore } from "pinia";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import i18n from "@/i18n";
import { useRouter } from "vue-router";
import Cookies from "js-cookie";
import axios from "axios";

export const useWalletStore = defineStore("wallet", () => {
  const balance = ref(0);
  const balance_rub = ref(0);
  const usdt_price = ref(0);
  let working_invoice = "";
  const { t } = useI18n();
  const router = useRouter();
  const isLoading = ref(false);
  const loaderScan = ref(false);
  const email = ref("");
  const code = ref("");
  const errMessage = ref('');

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
  const user = ref({});
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

  const transaction = ref({});

  const setHideBalanceActive = async (val: boolean) => {
    hideBalanceActive.value = val;
    
    // Сохраняем состояние в localStorage
    if (val) {
      localStorage.setItem('hideBalance', 'true');
    } else {
      localStorage.removeItem('hideBalance');
    }
    
    // Отправляем изменение на сервер (если пользователь авторизован)
    try {
      if (user.value && user.value.tg_id) {
        await axios.patch(`/update_visibility_balance/${user.value.tg_id}`, {
          visibility_balance: val
        });
      }
    } catch (err) {
      console.error('Failed to update balance visibility on server:', err);
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
        setTimeout(() => {
          message_status.value = "";
          router.push({ name: "safety" })
        }, 2500);
      }
    } catch (error) {
      console.error('Failed to set PIN code:', error);
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
        message_status.value = "success";
        setTimeout(() => {
          message_status.value = "";
        }, 2500);
      }
    } catch (error) {
      console.error('Ошибка отключения PIN-кода:', error);
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
    console.log('PIN не активен на сервере');
    return false;
  }

  if (!pinCode.value) {
    console.warn('PIN-код не загружен из сервера');
    return false;
  }

  const isValid = String(enteredPin) === String(pinCode.value);
  if (isValid) {
    pinVerified.value = true;
    pinVerificationTime.value = Date.now();
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

// Инициализируем состояние скрытия баланса из localStorage
const savedHideBalance = localStorage.getItem('hideBalance');
if (savedHideBalance === 'true') {
  hideBalanceActive.value = true;
}

const showMessage = (message: string, status: string = 'error', duration: number = 3000) => {
  errMessage.value = message;
  message_status.value = status;

  setTimeout(() => {
    errMessage.value = '';
    message_status.value = '';
  }, duration);
};

const savedLang = localStorage.getItem("lang") || "RU";
i18n.global.locale = savedLang;
const availableLanguages = [
  { name: "Русский", value: "RU" },
  { name: "English", value: "EN" },
];

const langs = ref(
  availableLanguages.map(language => ({
    ...language,
    active: language.value === savedLang // Сравниваем с сохраненным языком
  }))
);

const changeLang = async (lang: string) => {
  try {
    // Проверяем, что язык существует
    const languageExists = availableLanguages.some(l => l.value === lang);
    if (!languageExists) {
      
      return;
    }

    // Обновляем состояние
    langs.value = langs.value.map(language => ({
      ...language,
      active: language.value === lang
    }));
    
    // Устанавливаем язык
    i18n.global.locale = lang;
    localStorage.setItem("lang", lang);
    
    location.reload();
    
  } catch (err) {
    
  }
};

  const goBack = () => {
    try {
      router.go(-1);
    } catch (err) {
      
    }
  };

  const getUserInfo = () => {
    if (window.Telegram && window.Telegram.WebApp) {
      const initData = window.Telegram.WebApp.initData;
      
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
          const referalFromUrl = urlParams.get('referal');
          
          if (referalFromUrl && !referalId.value) {
            referalId.value = referalFromUrl;
          }
          
          // Проверяем hash для случаев когда параметры передаются через #
          const hash = window.location.hash;
          if (hash && !referalId.value) {
            // Проверяем разные возможные форматы в hash
            if (hash.includes('referal')) {
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
            if (hash.includes('startapp') && hash.includes('referal') && !referalId.value) {
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
          const startApp = urlParams.get('startapp');
          if (startApp && startApp.includes('referal') && !referalId.value) {
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
          if (start_param == 'error_trasaction') {
            router.push({ name: 'transaction_failed' })
          }
        }
      }
    }
  };

  const createUser = async () => {
    if (isCreatingUser.value) {
      return; // Если уже создаем пользователя, не делаем повторный запрос
    }
    
    // Проверяем, не создавался ли уже пользователь ранее
    const userCreatedFlag = localStorage.getItem(`user_created_${userTg.value.id}`);
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
      
      // Помечаем что пользователь создан
      localStorage.setItem(`user_created_${userTg.value.id}`, 'true');
      
      // Очищаем реферальный ID после использования
      if (referalId.value) {
        referalId.value = "";
      }
      
    } catch (err) {
      // Silently handle errors
    } finally {
      isCreatingUser.value = false;
    }
  };

  const getUser = async () => {
    try {
      let response = await axios.get(`/user/${userTg.value.id}`);
      
      user.value = response.data;
      balance.value = response.data.balance || 0;
      pinCode.value = response.data.pin_code;
      
      // Отладочная информация при загрузке PIN
      console.log('PIN загружен из сервера:', {
        pin_code: response.data.pin_code,
        pin_code_type: typeof response.data.pin_code,
        boolpin: response.data.boolpin,
        boolpin_type: typeof response.data.boolpin
      });
      
      // Устанавливаем состояние активности пин-кода на основе поля boolpin
      codePasswordActive.value = !!response.data.boolpin;
      
      // Устанавливаем состояние скрытия баланса на основе поля visibility_balance
      hideBalanceActive.value = !!response.data.visibility_balance;
      
      // Загружаем статус 2FA из ответа сервера
      has2FA.value = !!response.data.two_factor_enabled || !!response.data.tfa_enabled || !!response.data.has_2fa;
      
      // Инициализируем состояние PIN-кода в localStorage на основе boolpin
      if (codePasswordActive.value) {
        localStorage.setItem('hasPinCode', 'true');
      } else {
        localStorage.removeItem('hasPinCode');
        localStorage.removeItem('pinVerified');
      }
      
      // Сохраняем состояние скрытия баланса в localStorage
      if (hideBalanceActive.value) {
        localStorage.setItem('hideBalance', 'true');
      } else {
        localStorage.removeItem('hideBalance');
      }
      
      history.value = response.data.list_transctions_replenished;
      
      
      if (history.value && history.value.length > 0) {
        
        
      }
      
      if (usdt_price.value) {
        balance_rub.value = balance.value * usdt_price.value;
      } else {
        await getPrice();
        balance_rub.value = balance.value * usdt_price.value;
      }
      
      // Проверяем статус 2FA
      await check2FAStatus();
      
    } catch (err) {
      
      if ((err.status == 404 || err.status == 500) && !isCreatingUser.value) {
        await createUser();
      }
    }
  };

  const getPrice = async () => {
    try {
      let response = await axios.get("/last_price");
      
      usdt_price.value = response.data.last_price;
    } catch (err) {
      
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
      }
    } catch (err) {
      
    } finally {
      isLoading.value = false;
    }
  };

  const creatingInvoceDb = async () => {
    try {
      isLoading.value = true;
      let response = await axios.post("/creating_invoce_db", {
        datatime: new Date(),
        amount: String(amount.value),
        id_tg_user: user.value.tg_id,
        working_invoce: working_invoice,
      });
      
    } catch (err) {
      
    } finally {
      isLoading.value = false;
    }
  };

  const logOut = () => {
    try {
      localStorage.clear();
      router.push("/");
    } catch (err) {
      
    }
  };

  const updateEmail = async () => {
    try {
      isLoading.value = true;
      let response = await axios.patch(`/update_email/${user.value.tg_id}`, {
        email: email.value,
      });
      
    } catch (err) {
      
    } finally {
      isLoading.value = false;
    }
  };

  const sendCode = async () => {
    try {
      isLoading.value = true;
      let response = await axios.patch(`/send_code?email=${email.value}`);
      
      if (response.status == 200) {
        router.push({ name: "enter_code" });
      }
    } catch (err) {
      
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
        setTimeout(() => {
          message_status.value = "";
          router.push({ name: "profile" });
        }, 2500);
      }
    } catch (err) {
      
      message_status.value = "error";
      setTimeout(() => {
        message_status.value = "";
      }, 2500);
    } finally {
      isLoading.value = false;
    }
  };

  const goTransaction = async (item) => {
    try {
      await getPrice();
      transaction.value = { ...item };
      transaction.value.amountRub = getRub(item.amount);
      
      
      router.push({ name: "transaction" });
    } catch (err) {
      
    }
  };

  const getRub = (amount) => {
    try {
      return `${Math.round(amount * usdt_price.value * 100) / 100}`;
    } catch (err) {
      
    }
  };

  const qrTake = async (link: string) => {
    try {
      loaderScan.value = true;
      
      // Парсим URL и извлекаем параметры
      const url = new URL(link);
      const bank = url.searchParams.get('bank') || '';
      const sum = url.searchParams.get('sum') || '';
      const cur = url.searchParams.get('cur') || '';
      const crc = url.searchParams.get('crc') || '';
      
      // Отправляем данные как query параметры
      const params = new URLSearchParams({
        tg_id: String(userTg.value.id),
        qr_url: link,
        bank: bank,
        sum: sum,
        cur: cur,
        crc: crc
      });
      
      let response = await axios.post(`/qr_take?${params.toString()}`, {});
      
      
      if (response.status == 200) {
        let { id, datatime } = response.data.more_detail
        let { type_trans, bool_suecess } = response.data
        let amount_usdt = response.data.more_detail.amount
        await getPrice()
        let amount_rub = amount_usdt * usdt_price.value
        router.push({ name: "transaction", query: { id, amount_rub, amount_usdt, datatime, type_trans, bool_suecess } });
      }
    } catch (err) {
      
      if (err.response.data.detail == 'Недостаточно средств') {
        errMessage.value = t('insufficient_funds')
      } else {
        errMessage.value = t('failed_text')
      }
      router.push({ name: "transaction_failed" });
    } finally {
      loaderScan.value = false;
    }
  };

  const withdrawFunds = async (amount: string, network: string, wallet: string, memo?: string) => {
    try {
      loaderScan.value = true;
      
      // Отправляем данные как query параметры
      const params = new URLSearchParams({
        tg_id: String(userTg.value.id),
        amount: amount,
        network: network,
        wallet: wallet
      });

      // Добавляем memo только если оно заполнено
      if (memo && memo.trim() !== '') {
        params.append('memo', memo);
      }
      
      let response = await axios.post(`/daddy_pleasу_output?${params.toString()}`, {});
      
      if (response.status == 200) {
        let { id, datatime } = response.data.more_detail
        let { type_trans, bool_suecess } = response.data
        let amount_usdt = response.data.more_detail.amount
        await getPrice()
        let amount_rub = amount_usdt * usdt_price.value
        router.push({ name: "transaction", query: { id, amount_rub, amount_usdt, datatime, type_trans, bool_suecess } });
      }
    } catch (err) {
      
      if (err.response?.data?.detail == 'Недостаточно средств') {
        errMessage.value = t('insufficient_funds')
      } else {
        errMessage.value = t('failed_text')
      }
      router.push({ name: "transaction_failed" });
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
    } catch (err) {
      return []; // Возвращаем пустой массив при ошибке
    }
  };

  const enable2FA = async () => {
    try {
      loaderScan.value = true;
      const tgId = String(userTg.value.id);
      let response = await axios.post(`/fa_take?tg_id=${tgId}`);
      
      if (response.status === 200 && response.data.status === 'success') {
        return {
          success: true,
          qrImage: response.data.qr_image_base64,
          key: response.data.key
        };
      }
      return { success: false };
    } catch (err) {
      showMessage(t('error_occurred'), 'error');
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
      let response = await axios.post(`/key_fa_check?tg_id=${tgId}&key=${keyCode}`, {});
      
      if (response.status === 200 && response.data.status === 'success') {
        has2FA.value = true; // Обновляем статус 2FA
        showMessage(t('2fa_enabled_success'), 'success');
        return true;
      }
      return false;
    } catch (err) {
      if (err.response?.status === 404) {
        showMessage(t('invalid_2fa_code'), 'error');
      } else {
        showMessage(t('error_occurred'), 'error');
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
      let response = await axios.get(`/user/${tgId}`);
      
      if (response.status === 200 && response.data) {
        // Проверяем различные возможные поля для статуса 2FA
        has2FA.value = !!(response.data.two_factor_enabled || 
                         response.data.tfa_enabled || 
                         response.data.has_2fa ||
                         response.data.is_2fa_enabled ||
                         response.data['2fa_enabled']);
      }
    } catch (err) {
      // Если не удается получить статус, пробуем сделать тестовый запрос
      try {
        const tgId = String(userTg.value.id);
        // Тестируем с невалидным кодом - если 2FA включен, получим ошибку 404
        await axios.post(`/key_fa_check?tg_id=${tgId}&key=000000`, {});
      } catch (testErr) {
        // Если получили 404, значит 2FA настроен (но код неверный)
        if (testErr.response?.status === 404) {
          has2FA.value = true;
        }
      }
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
      showMessage(t('error_occurred'), 'error');
      return null;
    }
  };

  const transferFunds = async (recipientWallet: string, amount: string, twoFactorCode: string) => {
    // Проверяем, включен ли 2FA
    if (!has2FA.value) {
      showMessage(t('transfer_requires_2fa'), 'error');
      router.push({ name: 'twoFactorAuth' });
      return false;
    }

    try {
      loaderScan.value = true;
      
      const params = new URLSearchParams();
      params.append('tg_id', String(userTg.value.id));
      params.append('key', String(twoFactorCode));
      params.append('amount', String(amount));
      params.append('wallet', String(recipientWallet));
      
      let response = await axios.post(`/transfer_cash_wallet?${params.toString()}`, {});
      
      if (response.status === 200) {
        // Получаем детали транзакции из ответа
        let { id, datatime } = response.data.more_detail || {};
        let { type_trans, bool_suecess } = response.data;
        let amount_usdt = response.data.more_detail?.amount || amount;
        
        await getPrice();
        await getUser(); // Обновляем баланс
        
        let amount_rub = parseFloat(amount_usdt) * usdt_price.value;
        
        // Перенаправляем на страницу транзакции
        router.push({ 
          name: "transaction", 
          query: { 
            id, 
            amount_rub, 
            amount_usdt, 
            datatime, 
            type_trans: type_trans || 'transfer', 
            bool_suecess 
          } 
        });
        return true;
      }
      return false;
    } catch (err) {
      if (err.response?.status === 404) {
        showMessage(t('invalid_2fa_code'), 'error');
      } else if (err.response?.data?.detail) {
        showMessage(err.response.data.detail, 'error');
      } else {
        showMessage(t('transfer_failed'), 'error');
      }
      router.push({ name: "transaction_failed" });
      return false;
    } finally {
      loaderScan.value = false;
    }
  };


  const roundToHundredths = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '0.00'
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numValue)) return '0.00'
  const truncatedValue = Math.floor(numValue * 100) / 100
  return truncatedValue.toFixed(2)
}

  return {
    qrTake,
    withdrawFunds,
    getMyReferrals,
    enable2FA,
    verify2FACode,
    check2FAStatus,
    getUserWallet,
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
    createUser,
    roundToHundredths,
    errMessage,
    referalId,
    showMessage,
    userWallet,
    has2FA
  };
});
