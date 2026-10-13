const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const day = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });
const dayTime = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });

export const formatINR = (amount) => inr.format(amount ?? 0);
export const formatDate = (iso) => day.format(new Date(iso));
export const formatDateTime = (iso) => dayTime.format(new Date(iso));

export const FREE_SHIPPING_FROM = 999;
export const SHIPPING_FEE = 49;
export const MAX_PER_ITEM = 10;

// Remove blank values so they never reach the query string
export const cleanParams = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v != null));
