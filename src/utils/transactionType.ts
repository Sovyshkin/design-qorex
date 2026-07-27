import {
  getCashbackTransactionLabel,
  isCashbackTransaction,
} from "@/utils/cashbackTransaction";

const KNOWN_TRANSLATION_KEYS = new Set([
  "buy",
  "input",
  "output",
  "receiving",
  "referal",
]);

export const normalizeTransactionType = (type: unknown) =>
  String(type || "").trim().toLowerCase();

export const getTransactionTypeLabel = (
  type: unknown,
  t: (key: string) => string
) => {
  const normalizedType = normalizeTransactionType(type);

  if (isCashbackTransaction(normalizedType)) {
    return getCashbackTransactionLabel(normalizedType);
  }

  if (normalizedType === "transfer") {
    return t("transfer_transaction");
  }

  if (KNOWN_TRANSLATION_KEYS.has(normalizedType)) {
    return t(normalizedType);
  }

  return t("transaction");
};
