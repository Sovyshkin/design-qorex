const ACCESS_TOKEN_KEY = "access_token";
const BROWSER_USER_KEY = "telegram_browser_user";
const BROWSER_TELEGRAM_DATA_KEY = "telegram_browser_auth_data";
const LEGACY_USER_KEY = "user";

export const getTelegramInitData = () => {
  if (window.Telegram?.WebApp?.initData) {
    return window.Telegram.WebApp.initData;
  }

  return "";
};

export const getAccessToken = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || "";
};

export const saveBrowserAuth = (token, telegramUser) => {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }

  if (telegramUser) {
    const user = normalizeTelegramUser(telegramUser);
    localStorage.setItem(BROWSER_TELEGRAM_DATA_KEY, JSON.stringify(telegramUser));
    localStorage.setItem(BROWSER_USER_KEY, JSON.stringify(user));
    localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(user));
  }
};

export const clearBrowserAuth = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(BROWSER_USER_KEY);
  localStorage.removeItem(BROWSER_TELEGRAM_DATA_KEY);
};

export const getSavedBrowserUser = () => {
  const rawUser =
    localStorage.getItem(BROWSER_USER_KEY) || localStorage.getItem(LEGACY_USER_KEY);

  if (!rawUser) return null;

  try {
    const user = normalizeTelegramUser(JSON.parse(rawUser));
    return user.id ? user : null;
  } catch (_error) {
    return null;
  }
};

export const normalizeTelegramUser = (user = {}) => ({
  first_name: user.first_name || "",
  last_name: user.last_name || "",
  username: user.username || "",
  id: String(user.id || ""),
  photo_url: user.photo_url || "",
});

export const getSavedTelegramData = () => {
  const rawData = localStorage.getItem(BROWSER_TELEGRAM_DATA_KEY);

  if (rawData) {
    try {
      return JSON.parse(rawData);
    } catch (_error) {}
  }

  const savedUser = getSavedBrowserUser();
  return savedUser ? { user: savedUser } : {};
};

export const isTelegramMiniApp = () => {
  return Boolean(getTelegramInitData());
};

export const isTelegramWebView = () => {
  const userAgent = navigator.userAgent || "";
  const platform = window.Telegram?.WebApp?.platform;

  return Boolean(
    window.TelegramWebviewProxy ||
      /Telegram/i.test(userAgent) ||
      (platform && platform !== "unknown")
  );
};

export const shouldUseBrowserAuth = () => {
  return !isTelegramWebView();
};
