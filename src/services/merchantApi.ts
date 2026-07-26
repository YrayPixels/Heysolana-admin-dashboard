import { toast } from "sonner";
import { API_BASE_URL } from "@/config/env";

export interface MerchantProfile {
  id: number;
  name: string;
  email: string;
  phone_number?: string | null;
  avatar_url?: string | null;
  status: string;
  is_primary: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MerchantAsset {
  id: number;
  merchant_id: number;
  token_symbol: string;
  token_name?: string | null;
  chain: string;
  contract_address?: string | null;
  decimals?: number | null;
  is_active: boolean;
}

export interface MerchantWallet {
  id: number;
  merchant_id: number;
  chain: string;
  token_symbol?: string | null;
  address: string;
  label?: string | null;
  is_active: boolean;
}

export interface MerchantRate {
  id: number;
  merchant_id: number;
  token_symbol: string;
  chain: string;
  buy_rate_ngn: string | number;
  sell_rate_ngn: string | number;
  is_active: boolean;
}

export interface OfframpOrder {
  id: number;
  order_number: string;
  merchant_id: number;
  side: "buy" | "sell";
  status: "pending" | "seen" | "completed" | "cancelled";
  token_symbol: string;
  chain: string;
  amount_token: string | number;
  amount_ngn: string | number;
  rate_ngn: string | number;
  user_wallet_address?: string | null;
  user_phone?: string | null;
  user_email?: string | null;
  transfer_wallet_address?: string | null;
  tx_hash?: string | null;
  notes?: string | null;
  seen_at?: string | null;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface MerchantAnalytics {
  summary: {
    orders_total: number;
    orders_pending: number;
    orders_seen: number;
    orders_completed: number;
    orders_cancelled: number;
    buy_orders: number;
    sell_orders: number;
    completed_volume_ngn: number;
    open_volume_ngn: number;
    active_assets: number;
    active_rates: number;
  };
  last_7_days: Array<{ date: string; orders: number; volume_ngn: number }>;
  by_asset: Array<{
    token_symbol: string;
    chain: string;
    orders: number;
    volume_ngn: number;
  }>;
}

const TOKEN_KEY = "merchant_auth_token";
const PROFILE_KEY = "merchant_user_profile";
const EXPIRES_KEY = "merchant_auth_token_expires";

const handleError = (error: unknown) => {
  console.error("Merchant API Error:", error);
  const message =
    error instanceof Error ? error.message : "Something went wrong";
  toast.error(message);
  return null;
};

const merchantFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    clearMerchantAuth();
    window.dispatchEvent(new CustomEvent("merchant-auth-logout"));
    throw new Error("Session expired. Please log in again.");
  }

  return response;
};

const setMerchantAuthToken = (token: string, expirationHours = 24 * 7) => {
  const expiration = new Date();
  expiration.setHours(expiration.getHours() + expirationHours);
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EXPIRES_KEY, expiration.toISOString());
};

export const clearMerchantAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(EXPIRES_KEY);
};

export const setMerchantProfile = (profile: MerchantProfile) => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};

export const getMerchantProfile = (): MerchantProfile | null => {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MerchantProfile;
  } catch {
    return null;
  }
};

export const isMerchantAuthenticated = (): boolean => {
  const token = localStorage.getItem(TOKEN_KEY);
  const expires = localStorage.getItem(EXPIRES_KEY);
  if (!token || !expires) return false;
  if (new Date(expires) <= new Date()) {
    clearMerchantAuth();
    return false;
  }
  return true;
};

export const merchantGoogleLogin = async (
  googleIdToken: string
): Promise<MerchantProfile | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/merchant/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ google_id_token: googleIdToken }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Google login failed");
    }
    setMerchantAuthToken(data.token);
    setMerchantProfile(data.merchant);
    return data.merchant as MerchantProfile;
  } catch (error) {
    return handleError(error);
  }
};

export const merchantLogout = async () => {
  try {
    if (isMerchantAuthenticated()) {
      await merchantFetch(`${API_BASE_URL}/merchant/logout`, { method: "POST" });
    }
  } catch {
    // ignore
  } finally {
    clearMerchantAuth();
  }
};

export const fetchMerchantMe = async (): Promise<MerchantProfile | null> => {
  try {
    const response = await merchantFetch(`${API_BASE_URL}/merchant/me`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to load profile");
    setMerchantProfile(data.merchant);
    return data.merchant as MerchantProfile;
  } catch (error) {
    return handleError(error);
  }
};

export const updateMerchantProfile = async (payload: {
  name?: string;
  phone_number?: string | null;
}): Promise<MerchantProfile | null> => {
  try {
    const response = await merchantFetch(`${API_BASE_URL}/merchant/me`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to update profile");
    setMerchantProfile(data.merchant);
    return data.merchant as MerchantProfile;
  } catch (error) {
    return handleError(error);
  }
};

export const fetchMerchantAnalytics = async (): Promise<MerchantAnalytics | null> => {
  try {
    const response = await merchantFetch(`${API_BASE_URL}/merchant/analytics`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to load analytics");
    return data as MerchantAnalytics;
  } catch (error) {
    return handleError(error);
  }
};

export const fetchMerchantOrders = async (params?: {
  status?: string;
  side?: string;
}): Promise<{ data: OfframpOrder[] } | null> => {
  try {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.side) query.set("side", params.side);
    const qs = query.toString();
    const response = await merchantFetch(
      `${API_BASE_URL}/merchant/orders${qs ? `?${qs}` : ""}`
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to load orders");
    return data;
  } catch (error) {
    return handleError(error);
  }
};

export const fetchMerchantOrder = async (
  id: number | string
): Promise<OfframpOrder | null> => {
  try {
    const response = await merchantFetch(`${API_BASE_URL}/merchant/orders/${id}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to load order");
    return data.order as OfframpOrder;
  } catch (error) {
    return handleError(error);
  }
};

export const updateMerchantOrderStatus = async (
  id: number | string,
  payload: { status: string; tx_hash?: string; notes?: string }
): Promise<OfframpOrder | null> => {
  try {
    const response = await merchantFetch(
      `${API_BASE_URL}/merchant/orders/${id}/status`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to update order");
    return data.order as OfframpOrder;
  } catch (error) {
    return handleError(error);
  }
};

export const fetchMerchantAssets = async (): Promise<MerchantAsset[] | null> => {
  try {
    const response = await merchantFetch(`${API_BASE_URL}/merchant/assets`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to load assets");
    return data.assets as MerchantAsset[];
  } catch (error) {
    return handleError(error);
  }
};

export const saveMerchantAsset = async (payload: {
  token_symbol: string;
  token_name?: string;
  chain: string;
  contract_address?: string;
  decimals?: number;
  is_active?: boolean;
}): Promise<MerchantAsset | null> => {
  try {
    const response = await merchantFetch(`${API_BASE_URL}/merchant/assets`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to save asset");
    return data.asset as MerchantAsset;
  } catch (error) {
    return handleError(error);
  }
};

export const deleteMerchantAsset = async (id: number): Promise<boolean> => {
  try {
    const response = await merchantFetch(`${API_BASE_URL}/merchant/assets/${id}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to delete asset");
    return true;
  } catch (error) {
    handleError(error);
    return false;
  }
};

export const fetchMerchantWallets = async (): Promise<MerchantWallet[] | null> => {
  try {
    const response = await merchantFetch(`${API_BASE_URL}/merchant/wallets`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to load wallets");
    return data.wallets as MerchantWallet[];
  } catch (error) {
    return handleError(error);
  }
};

export const saveMerchantWallet = async (payload: {
  chain: string;
  token_symbol?: string;
  address: string;
  label?: string;
  is_active?: boolean;
}): Promise<MerchantWallet | null> => {
  try {
    const response = await merchantFetch(`${API_BASE_URL}/merchant/wallets`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to save wallet");
    return data.wallet as MerchantWallet;
  } catch (error) {
    return handleError(error);
  }
};

export const deleteMerchantWallet = async (id: number): Promise<boolean> => {
  try {
    const response = await merchantFetch(`${API_BASE_URL}/merchant/wallets/${id}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to delete wallet");
    return true;
  } catch (error) {
    handleError(error);
    return false;
  }
};

export const fetchMerchantRates = async (): Promise<MerchantRate[] | null> => {
  try {
    const response = await merchantFetch(`${API_BASE_URL}/merchant/rates`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to load rates");
    return data.rates as MerchantRate[];
  } catch (error) {
    return handleError(error);
  }
};

export const saveMerchantRate = async (payload: {
  token_symbol: string;
  chain: string;
  buy_rate_ngn: number;
  sell_rate_ngn: number;
  is_active?: boolean;
}): Promise<MerchantRate | null> => {
  try {
    const response = await merchantFetch(`${API_BASE_URL}/merchant/rates`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to save rate");
    return data.rate as MerchantRate;
  } catch (error) {
    return handleError(error);
  }
};

export const deleteMerchantRate = async (id: number): Promise<boolean> => {
  try {
    const response = await merchantFetch(`${API_BASE_URL}/merchant/rates/${id}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to delete rate");
    return true;
  } catch (error) {
    handleError(error);
    return false;
  }
};
