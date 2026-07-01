export type TransactionStatusKind = "success" | "error" | "in_processing";

const SUCCESS_VALUES = new Set([
  "1",
  "true",
  "success",
  "successful",
  "completed",
  "paid",
  "done",
  "ok",
  "approved",
  "succeeded",
]);

const PROCESSING_VALUES = new Set([
  "0",
  "false",
  "wait",
  "wait_pay",
  "pending",
  "processing",
  "in_processing",
  "created",
  "new",
]);

const ERROR_VALUES = new Set([
  "error",
  "error timer",
  "failed",
  "fail",
  "declined",
  "cancelled",
  "canceled",
  "rejected",
]);

export const normalizeTransactionStatus = (
  rawStatus: unknown
): TransactionStatusKind => {
  if (rawStatus === true || rawStatus === 1) {
    return "success";
  }

  if (rawStatus === false || rawStatus === 0 || rawStatus == null) {
    return "in_processing";
  }

  const normalized = String(rawStatus).trim().toLowerCase();

  if (SUCCESS_VALUES.has(normalized)) {
    return "success";
  }

  if (ERROR_VALUES.has(normalized) || normalized.includes("error")) {
    return "error";
  }

  if (PROCESSING_VALUES.has(normalized)) {
    return "in_processing";
  }

  return "in_processing";
};

export const getTransactionStatusMeta = (
  rawStatus: unknown,
  t: (key: string) => string
) => {
  const status = normalizeTransactionStatus(rawStatus);

  if (status === "success") {
    return { text: t("success"), class: "success" };
  }

  if (status === "error") {
    const isTimeout =
      String(rawStatus ?? "")
        .trim()
        .toLowerCase() === "error timer";

    return {
      text: isTimeout ? t("error_timer") : t("transaction_error"),
      class: "error",
    };
  }

  return { text: t("in_processing"), class: "in_processing" };
};

export const isTransactionErrorStatus = (rawStatus: unknown) =>
  normalizeTransactionStatus(rawStatus) === "error";
