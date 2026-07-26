const MERCHANT_HOST_PREFIX = "merchant.";

export type AppMode = "admin" | "merchant";

export const getAppMode = (): AppMode => {
  const forced = (import.meta.env.VITE_APP_MODE || "").toLowerCase().trim();
  if (forced === "merchant" || forced === "admin") {
    return forced;
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();
    if (host.startsWith(MERCHANT_HOST_PREFIX) || host === "merchant.localhost") {
      return "merchant";
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "merchant") {
      return "merchant";
    }
  }

  return "admin";
};

export const isMerchantMode = (): boolean => getAppMode() === "merchant";

export const GOOGLE_CLIENT_ID = (
  import.meta.env.VITE_GOOGLE_CLIENT_ID || ""
).trim();
