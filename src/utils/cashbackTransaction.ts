export const CASHBACK_TRANSACTION_LABELS: Record<string, string> = {
  cash_back_d: "Кешбэк за день",
  cash_back_m: "Кешбэк за месяц",
  cash_back_y: "Кешбэк за год",
};

export const isCashbackTransaction = (type: unknown) =>
  Object.prototype.hasOwnProperty.call(
    CASHBACK_TRANSACTION_LABELS,
    String(type || "").toLowerCase()
  );

export const getCashbackTransactionLabel = (type: unknown) =>
  CASHBACK_TRANSACTION_LABELS[String(type || "").toLowerCase()] || "Кешбэк";
