const ACCESS_TOKEN_KEY = "access_token";
const BROWSER_USER_KEY = "telegram_browser_user";
const BROWSER_TELEGRAM_DATA_KEY = "telegram_browser_auth_data";
const BROWSER_AUTH_PROVIDER_KEY = "browser_auth_provider";
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
  localStorage.setItem(BROWSER_AUTH_PROVIDER_KEY, "telegram");

  if (telegramUser) {
    const user = normalizeTelegramUser(telegramUser);
    localStorage.setItem(BROWSER_TELEGRAM_DATA_KEY, JSON.stringify(telegramUser));
    localStorage.setItem(BROWSER_USER_KEY, JSON.stringify(user));
    localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(user));
  }
};

export const saveBrowserEmailAuth = (emailUser) => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.setItem(BROWSER_AUTH_PROVIDER_KEY, "email");

  const user = normalizeTelegramUser(emailUser);
  localStorage.setItem(BROWSER_TELEGRAM_DATA_KEY, JSON.stringify({ user, auth_provider: "email" }));
  localStorage.setItem(BROWSER_USER_KEY, JSON.stringify(user));
  localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(user));
};

export const clearBrowserAuth = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(BROWSER_USER_KEY);
  localStorage.removeItem(BROWSER_TELEGRAM_DATA_KEY);
  localStorage.removeItem(BROWSER_AUTH_PROVIDER_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);
};

export const getBrowserAuthProvider = () => {
  return localStorage.getItem(BROWSER_AUTH_PROVIDER_KEY) || "";
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
  email: user.email || "",
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
