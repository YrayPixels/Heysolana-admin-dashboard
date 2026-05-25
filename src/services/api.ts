import { toast } from "sonner";
import { API_BASE_URL } from "@/config/env";

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string;
  token?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoginResponse {
  message: string;
  admin: UserProfile;
}

export interface VerifyResponse {
  message: string;
  admin: UserProfile;
  token: string;
}

// Tracking data interfaces
export interface DateValueData {
  date: string;
  total_clicks?: number;
  total_calls?: number;
  total_open_count?: number;
  total_usage?: number;
}

export interface NameValueData {
  button_name?: string;
  tool_name?: string;
  page_name?: string;
  token_name?: string;
  total_clicks?: number;
  total_calls?: number;
  total_open_count?: number;
  total_usage?: number;
}

export interface TrackingData {
  button_clicks_by_date: DateValueData[];
  button_clicks_by_button_name: NameValueData[];
  tool_calls_by_date: DateValueData[];
  tool_calls_by_tool_name: NameValueData[];
  app_open_count_by_date: DateValueData[];
  page_open_count_by_date: DateValueData[];
  page_open_count_by_page_name: NameValueData[];
  token_usage_by_date: DateValueData[];
  token_usage_by_token_name: NameValueData[];
}

export interface EngagementDauPoint {
  date: string;
  active_users: number;
}

export interface EngagementSummary {
  dau_today: number;
  wau: number;
  mau_rolling: number;
  mau_prev_window: number;
  stickiness: number | null;
}

export interface JourneyEdge {
  source: string;
  target: string;
  value: number;
}

export interface JourneyPopularPage {
  event_name: string;
  views: number;
}

export interface EngagementAnalytics {
  available: boolean;
  message?: string;
  dau_series: EngagementDauPoint[];
  dau_series_source?: string;
  dau_series_note?: string;
  summary: EngagementSummary | null;
  journey_edges: JourneyEdge[];
  journey_popular_pages: JourneyPopularPage[];
}

// Error handling helper
const handleError = (error: Error | { response?: { data?: { message?: string } }; message?: string }) => {
  console.error("API Error:", error);
  const message = 
    ('response' in error && error.response?.data?.message) ||
    ('message' in error && error.message) ||
    'Something went wrong';
  toast.error(message);
  return null;
};

// Enhanced fetch function with automatic token handling
const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('auth_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // If we get a 401 (Unauthorized), clear the auth data
  if (response.status === 401) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_profile');
    localStorage.removeItem('auth_token_expires');
    localStorage.removeItem('temp_admin_email');
    
    // Dispatch a custom event to notify components about logout
    window.dispatchEvent(new CustomEvent('auth-logout'));
    
    throw new Error('Session expired. Please log in again.');
  }

  return response;
};

// Validate token by checking with server
export const validateToken = async (): Promise<boolean> => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) return false;

    const response = await authenticatedFetch(`${API_BASE_URL}/validate-token`, {
      method: 'POST',
    });

    return response.ok;
  } catch (error) {
    console.error('Token validation failed:', error);
    return false;
  }
};

// Get tracking data
export const getTrackingData = async (): Promise<TrackingData | null> => {
  try {
    console.log("Fetching tracking data from", `${API_BASE_URL}/track/get-tracking-data`);
    const response = await authenticatedFetch(`${API_BASE_URL}/track/get-tracking-data`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch tracking data: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Tracking data:", data);
    return data;
  } catch (error) {
    handleError(error);
    return null;
  }
};

export const getEngagementAnalytics = async (
  days: 7 | 30 | 90 = 30
): Promise<EngagementAnalytics | null> => {
  try {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/track/engagement-analytics?days=${days}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch engagement analytics: ${response.statusText}`);
    }

    const data = (await response.json()) as EngagementAnalytics;
    return data;
  } catch (error) {
    handleError(error);
    return null;
  }
};

// ============ App Transactions / TVP ============

export type TransactionMetricsCluster = "mainnet" | "devnet" | "all";
export type TransactionMetricsDays = 7 | 30 | 90 | 365;

export interface TransactionMetricsSummary {
  tx_count: number;
  total_input_usd: number;
  total_output_usd: number;
  total_fee_usd: number;
}

export interface TransactionMetricByType {
  transaction_type: string;
  count: number;
  volume_usd: number;
  fee_usd: number;
}

export interface TransactionMetricByDay {
  date: string;
  count: number;
  volume_usd: number;
  fee_usd: number;
}

export interface TransactionMetricByCluster {
  cluster: "mainnet" | "devnet";
  count: number;
  volume_usd: number;
}

export interface TransactionMetrics {
  available: boolean;
  message?: string;
  cluster: TransactionMetricsCluster;
  days: number;
  summary: TransactionMetricsSummary;
  by_type: TransactionMetricByType[];
  by_day: TransactionMetricByDay[];
  by_cluster: TransactionMetricByCluster[];
}

export const getTransactionMetrics = async (
  cluster: TransactionMetricsCluster = "mainnet",
  days: TransactionMetricsDays = 30
): Promise<TransactionMetrics | null> => {
  try {
    const params = new URLSearchParams({
      cluster,
      days: String(days),
    });
    const response = await authenticatedFetch(
      `${API_BASE_URL}/admin/app-transactions/metrics?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch transaction metrics: ${response.statusText}`);
    }

    return (await response.json()) as TransactionMetrics;
  } catch (error) {
    handleError(error);
    return null;
  }
};

// Admin login - first step
export const loginUser = async (email: string, password: string): Promise<{ needsVerification: boolean; admin?: UserProfile }> => {
  try {
    console.log("Logging in admin:", email);
    const response = await fetch(`${API_BASE_URL}/login-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Login failed: ${response.statusText}`);
    }
    
    const data: LoginResponse = await response.json();
    
    // Store email temporarily for verification step
    localStorage.setItem('temp_admin_email', email);
    
    toast.success('Verification code sent to your email');
    return { needsVerification: true, admin: data.admin };
  } catch (error) {
    handleError(error);
    return { needsVerification: false };
  }
};

// Admin verification - second step
export const verifyAdmin = async (verificationCode: string): Promise<boolean> => {
  try {
    const email = localStorage.getItem('temp_admin_email');
    if (!email) {
      throw new Error('No email found for verification');
    }
    
    console.log("Verifying admin:", email);
    const response = await fetch(`${API_BASE_URL}/verify-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email, 
        verification_code: verificationCode 
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Verification failed: ${response.statusText}`);
    }
    
    const data: VerifyResponse = await response.json();
    
    // Store auth token with expiration and user profile
    setAuthToken(data.token, 24); // 24 hours expiration
    localStorage.setItem('user_profile', JSON.stringify(data.admin));
    
    // Clean up temporary email
    localStorage.removeItem('temp_admin_email');
    
    toast.success('Login successful');
    return true;
  } catch (error) {
    handleError(error);
    return false;
  }
};

// Update user profile (if needed for admin updates)
export const updateUserProfile = async (profile: Partial<UserProfile>): Promise<UserProfile | null> => {
  try {
    // For now, just update localStorage since there's no update endpoint in the backend
    const currentProfile = localStorage.getItem('user_profile');
    if (!currentProfile) {
      throw new Error('No user profile found');
    }
    
    const parsedProfile = JSON.parse(currentProfile);
    const updatedProfile = { ...parsedProfile, ...profile };
    
    localStorage.setItem('user_profile', JSON.stringify(updatedProfile));
    toast.success('Profile updated successfully');
    
    return updatedProfile;
  } catch (error) {
    handleError(error);
    return null;
  }
};

// Get stored user profile
export const getUserProfile = (): UserProfile | null => {
  try {
    const profile = localStorage.getItem('user_profile');
    if (!profile) return null;
    return JSON.parse(profile);
  } catch (error) {
    handleError(error);
    return null;
  }
};

// Store auth token with expiration tracking
const setAuthToken = (token: string, expirationHours: number = 24) => {
  const now = new Date();
  const expiration = new Date(now.getTime() + (expirationHours * 60 * 60 * 1000));
  
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_token_expires', expiration.toISOString());
};

// Check if token is expired
const isTokenExpired = (): boolean => {
  const expiration = localStorage.getItem('auth_token_expires');
  if (!expiration) return true;
  
  return new Date() > new Date(expiration);
};

// Enhanced authentication check
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('auth_token');
  const profile = localStorage.getItem('user_profile');
  
  if (!token || !profile) return false;
  
  // Check if token is expired
  if (isTokenExpired()) {
    // Clear expired auth data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_profile');
    localStorage.removeItem('auth_token_expires');
    localStorage.removeItem('temp_admin_email');
    return false;
  }
  
  return true;
};

// Enhanced logout function
export const logoutUser = (): void => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_profile');
  localStorage.removeItem('auth_token_expires');
  localStorage.removeItem('temp_admin_email');
  toast.success('Logged out successfully');
};

// Create admin (if needed)
export const createAdmin = async (name: string, email: string): Promise<boolean> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/create-admin`, {
      method: 'POST',
      body: JSON.stringify({ name, email }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to create admin: ${response.statusText}`);
    }
    
    toast.success('Admin created successfully');
    return true;
  } catch (error) {
    handleError(error);
    return false;
  }
};

// Fetch all admins
export const fetchAdmins = async (): Promise<UserProfile[]> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/fetch-admins`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to fetch admins: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.admins || [];
  } catch (error) {
    handleError(error);
    return [];
  }
};

// Reset an admin password (emails new temporary password)
export const resetAdminPassword = async (adminId: number): Promise<boolean> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/reset-admin-password`, {
      method: 'POST',
      body: JSON.stringify({ id: adminId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to reset password: ${response.statusText}`);
    }

    toast.success('Password reset email sent');
    return true;
  } catch (error) {
    handleError(error);
    return false;
  }
};

// User Distribution Analytics Interfaces
export interface CountryDistribution {
  country: string;
  user_count: number;
}

export interface VerificationStatus {
  status: string;
  user_count: number;
}

export interface WalletStatus {
  wallet_status: string;
  user_count: number;
}

export interface PinStatus {
  pin_status: string;
  user_count: number;
}

export interface RegistrationTrend {
  date: string;
  registrations: number;
}

export interface MonthlyRegistration {
  year: number;
  month: number;
  registrations: number;
}

export interface UserDistributionData {
  country_distribution: CountryDistribution[];
  registration_trends: RegistrationTrend[];
  monthly_registrations: MonthlyRegistration[];
  verification_status: VerificationStatus[];
  wallet_status: WalletStatus[];
  pin_status: PinStatus[];
  total_users: number;
  recent_registrations: number;
  growth_rate: number;
}

// Get user distribution analytics
export const getUserDistributionAnalytics = async (): Promise<UserDistributionData | null> => {
  try {
    console.log("Fetching user distribution analytics from", `${API_BASE_URL}/user-analytics`);
    const response = await authenticatedFetch(`${API_BASE_URL}/user-analytics`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user distribution analytics: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("User distribution analytics data:", data);
    return data;
  } catch (error) {
    handleError(error);
    return null;
  }
};

// User management interfaces
export interface User {
  id: number;
  username: string;
  phone_number: string;
  wallet_address: string;
  pin: string;
  verification_status?: string;
  created_at: string;
  updated_at: string;
}

export interface UsersResponse {
  users: User[];
  total: number;
  verified_count: number;
  wallet_users_count: number;
  pin_users_count: number;
  current_page: number;
  last_page: number;
  per_page: number;
}

export interface UsersFilters {
  search?: string;
  status?: string;
  wallet_status?: string;
  page?: number;
  per_page?: number;
  sort_field?: string;
  sort_direction?: 'asc' | 'desc';
}

// Get all users and handle filtering/pagination on frontend
export const getUsers = async (filters: UsersFilters = {}): Promise<UsersResponse | null> => {
  try {
    // Just fetch all users from the simple endpoint
    const url = `${import.meta.env.VITE_API_BASE_URL}/fetch-users`;
    console.log("Fetching users from", url);
    
    const response = await authenticatedFetch(url);
    console.log("Response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response body:", errorText);
      throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Users data:", data);
    
    // Transform the data to match our expected format
    let users = Array.isArray(data) ? data : [];
    
    // Apply search filter
    if (filters.search) {
      users = users.filter(user =>
        user.username?.toLowerCase().includes(filters.search!.toLowerCase()) ||
        user.phone_number?.includes(filters.search) ||
        user.wallet_address?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }
    
    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'verified') {
        users = users.filter(user => user.verification_status === 'verified');
      } else if (filters.status === 'pending') {
        users = users.filter(user => !user.verification_status || user.verification_status !== 'verified');
      }
    }
    
    // Apply wallet status filter
    if (filters.wallet_status && filters.wallet_status !== 'all') {
      if (filters.wallet_status === 'has_wallet') {
        users = users.filter(user => user.wallet_address && user.wallet_address !== '');
      } else if (filters.wallet_status === 'no_wallet') {
        users = users.filter(user => !user.wallet_address || user.wallet_address === '');
      }
    }
    
    // Apply sorting
    if (filters.sort_field) {
      users.sort((a, b) => {
        const aValue = a[filters.sort_field as keyof typeof a];
        const bValue = b[filters.sort_field as keyof typeof b];
        
        if (filters.sort_direction === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }
    
    const total = users.length;
    const verified_count = users.filter(
      (user) => user.verification_status === 'verified'
    ).length;
    const wallet_users_count = users.filter(
      (user) => user.wallet_address && user.wallet_address !== ''
    ).length;
    const pin_users_count = users.filter(
      (user) => user.pin && user.pin !== ''
    ).length;
    const current_page = filters.page || 1;
    const per_page = filters.per_page || 10;
    const last_page = Math.ceil(total / per_page);
    
    // Apply pagination
    const startIndex = (current_page - 1) * per_page;
    const endIndex = startIndex + per_page;
    const paginatedUsers = users.slice(startIndex, endIndex);
    
    return {
      users: paginatedUsers,
      total,
      verified_count,
      wallet_users_count,
      pin_users_count,
      current_page,
      last_page,
      per_page
    };
  } catch (error) {
    console.error("getUsers error:", error);
    handleError(error);
    return null;
  }
};

// Get a single user by ID
export const getUser = async (id: number): Promise<User | null> => {
  try {
    console.log("Fetching user from", `${API_BASE_URL}/fetch-user/${id}`);
    const response = await authenticatedFetch(`${API_BASE_URL}/fetch-user/${id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("User data:", data);
    return data;
  } catch (error) {
    handleError(error);
    return null;
  }
};

// Create a new user
export const createUser = async (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User | null> => {
  try {
    console.log("Creating user:", userData);
    const response = await authenticatedFetch(`${API_BASE_URL}/create-user`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create user: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Created user data:", data);
    toast.success('User created successfully');
    return data;
  } catch (error) {
    handleError(error);
    return null;
  }
};

// Update user verification status
export const updateUserVerificationStatus = async (id: number, status: string): Promise<boolean> => {
  try {
    console.log("Updating user verification status:", { id, status });
    const response = await authenticatedFetch(`${API_BASE_URL}/update-user-verification`, {
      method: 'POST',
      body: JSON.stringify({ id, verification_status: status }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update user verification status: ${response.statusText}`);
    }
    
    toast.success('User verification status updated successfully');
    return true;
  } catch (error) {
    handleError(error);
    return false;
  }
};

// ============ Jumia Orders (Admin) ============

export interface JumiaOrderUser {
  id: number;
  name: string;
  email: string;
}

export interface JumiaDeliveryAddress {
  id: number;
  full_name: string;
  phone_number: string;
  email?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  full_address?: string;
}

export interface JumiaOrderItem {
  id: number;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category?: string;
  brand?: string;
}

export interface JumiaOrderHistoryEntry {
  id: number;
  status: string;
  status_description?: string;
  timestamp: string;
  notes?: string;
}

export interface JumiaOrder {
  id: number;
  order_number: string;
  jumia_order_id?: string;
  status: string;
  total_amount: number;
  currency: string;
  payment_method?: string;
  payment_status: string;
  order_date: string;
  estimated_delivery_date?: string;
  notes?: string;
  tracking_number?: string;
  status_label?: string;
  payment_status_label?: string;
  formatted_total?: string;
  created_at: string;
  updated_at: string;
  delivery_address?: JumiaDeliveryAddress;
  order_items?: JumiaOrderItem[];
  order_history?: JumiaOrderHistoryEntry[];
  user?: JumiaOrderUser;
}

export interface JumiaOrdersResponse {
  success: boolean;
  data: JumiaOrder[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface JumiaOrderStats {
  total_orders: number;
  pending_orders: number;
  processing_orders: number;
  shipped_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  total_revenue: number;
}

export interface JumiaOrdersFilters {
  status?: string;
  payment_status?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

// Get all Jumia orders (admin)
export const getJumiaOrders = async (filters: JumiaOrdersFilters = {}): Promise<JumiaOrdersResponse | null> => {
  try {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.payment_status) params.set('payment_status', filters.payment_status);
    if (filters.search) params.set('search', filters.search);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.per_page) params.set('per_page', String(filters.per_page));
    const url = `${API_BASE_URL}/admin/jumia/orders${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await authenticatedFetch(url);
    if (!response.ok) throw new Error(`Failed to fetch orders: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    handleError(error);
    return null;
  }
};

// Get single Jumia order (admin)
export const getJumiaOrder = async (orderId: number): Promise<{ success: boolean; data: JumiaOrder } | null> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/admin/jumia/orders/${orderId}`);
    if (!response.ok) throw new Error(`Failed to fetch order: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    handleError(error);
    return null;
  }
};

// Update Jumia order status (admin)
export const updateJumiaOrderStatus = async (
  orderId: number,
  payload: { status: string; status_description?: string; tracking_number?: string; notes?: string }
): Promise<{ success: boolean; message: string; data: JumiaOrder } | null> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/admin/jumia/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `Failed to update order: ${response.statusText}`);
    toast.success('Order status updated');
    return data;
  } catch (error) {
    handleError(error);
    return null;
  }
};

// Get Jumia order stats (admin)
export const getJumiaOrderStats = async (): Promise<JumiaOrderStats | null> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/admin/jumia/orders/stats`);
    if (!response.ok) throw new Error(`Failed to fetch order stats: ${response.statusText}`);
    const json = await response.json();
    return json.data ?? null;
  } catch (error) {
    handleError(error);
    return null;
  }
};

// ============ Crossmint Orders (Admin) ============

export interface CrossmintShippingAddress {
  name?: string;
  line1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface CrossmintOrder {
  id: number;
  order_number: string;
  crossmint_order_id: string | null;
  wallet_address: string;
  recipient_email: string | null;
  shipping_address: CrossmintShippingAddress | null;
  asin: string;
  status: string;
  total_amount: number | null;
  currency: string;
  payment_status: string;
  order_date: string;
  created_at: string;
  updated_at: string;
  source: string;
}

export interface CrossmintOrdersResponse {
  success: boolean;
  data: CrossmintOrder[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface CrossmintOrderStats {
  total_orders: number;
  pending_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
}

export interface CrossmintOrdersFilters {
  status?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export const getCrossmintOrders = async (filters: CrossmintOrdersFilters = {}): Promise<CrossmintOrdersResponse | null> => {
  try {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.search) params.set('search', filters.search);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.per_page) params.set('per_page', String(filters.per_page));
    const url = `${API_BASE_URL}/admin/crossmint/orders${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await authenticatedFetch(url);
    if (!response.ok) throw new Error(`Failed to fetch Crossmint orders: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    handleError(error);
    return null;
  }
};

export const getCrossmintOrder = async (orderId: number): Promise<{ success: boolean; data: CrossmintOrder } | null> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/admin/crossmint/orders/${orderId}`);
    if (!response.ok) throw new Error(`Failed to fetch Crossmint order: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    handleError(error);
    return null;
  }
};

export const getCrossmintOrderStats = async (): Promise<CrossmintOrderStats | null> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/admin/crossmint/orders/stats`);
    if (!response.ok) throw new Error(`Failed to fetch Crossmint order stats: ${response.statusText}`);
    const json = await response.json();
    return json.data ?? null;
  } catch (error) {
    handleError(error);
    return null;
  }
};

export const updateCrossmintOrderStatus = async (
  orderId: number,
  payload: { status: string; notes?: string }
): Promise<{ success: boolean; data: CrossmintOrder } | null> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/admin/crossmint/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Failed to update Crossmint order status: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    handleError(error);
    return null;
  }
};

// ============ Admin Settings (Processing Fee) ============

export interface ProcessingFeeSettings {
  processing_fee_percent: string;
  processing_fee_fixed_ngn: string;
  processing_fee_fixed_usd: string;
  treasury_wallet_address: string;
  delivery_fee_jumia_ngn: string;
  delivery_fee_crossmint_usd: string;
  /** Jupiter referral account pubkey for swap integrator fees */
  jupiter_referral_account: string;
  /** Basis points (50–255). Use 0 to disable Hey Solana swap fee. */
  jupiter_referral_fee_bps: string;
}

export const getProcessingFeeSettings = async (): Promise<ProcessingFeeSettings | null> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/admin/settings/processing-fee`);
    if (!response.ok) throw new Error(`Failed to fetch settings: ${response.statusText}`);
    const json = await response.json();
    return json.data ?? null;
  } catch (error) {
    handleError(error);
    return null;
  }
};

// ============ Push notifications (Admin) ============

export interface PushRecipient {
  id: number;
  user_id: number | null;
  phone_number: string | null;
  username: string | null;
  device_type: "ios" | "android";
  is_active: boolean;
  push_token_preview: string;
  last_used_at: string | null;
  updated_at: string | null;
}

export interface PushRecipientsFilters {
  search?: string;
  device_type?: "ios" | "android" | "all";
  phone_number?: string;
  active_only?: boolean;
  page?: number;
  per_page?: number;
}

export interface PushRecipientsResponse {
  recipients: PushRecipient[];
  meta: {
    total: number;
    unique_phones: number;
    current_page: number;
    per_page: number;
    last_page: number;
  };
}

export interface PushPreviewResponse {
  device_count: number;
  user_count: number;
  ios_count: number;
  android_count: number;
}

export interface AdminSendPushPayload {
  title: string;
  body: string;
  target: "all" | "filtered" | "selected";
  device_type?: "ios" | "android";
  search?: string;
  phone_number?: string;
  phone_numbers?: string[];
  token_ids?: number[];
  active_only?: boolean;
  data?: Record<string, unknown>;
}

export const getPushRecipients = async (
  filters: PushRecipientsFilters = {}
): Promise<PushRecipientsResponse | null> => {
  try {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.device_type && filters.device_type !== "all") {
      params.set("device_type", filters.device_type);
    }
    if (filters.phone_number) params.set("phone_number", filters.phone_number);
    if (filters.active_only === false) params.set("active_only", "0");
    if (filters.page) params.set("page", String(filters.page));
    if (filters.per_page) params.set("per_page", String(filters.per_page));

    const url = `${API_BASE_URL}/admin/notifications/recipients${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    const response = await authenticatedFetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch recipients: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    handleError(error);
    return null;
  }
};

export const previewAdminPush = async (
  payload: Omit<AdminSendPushPayload, "title" | "body">
): Promise<PushPreviewResponse | null> => {
  try {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/admin/notifications/preview`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Preview failed: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    handleError(error);
    return null;
  }
};

export const sendAdminPush = async (
  payload: AdminSendPushPayload
): Promise<{ sent_count: number; device_count: number } | null> => {
  try {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/admin/notifications/send`,
      {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          data: payload.data ?? { type: "admin_broadcast" },
        }),
      }
    );
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(json.message || `Send failed: ${response.statusText}`);
    }
    toast.success(`Sent to ${json.sent_count ?? 0} device(s)`);
    return {
      sent_count: json.sent_count ?? 0,
      device_count: json.device_count ?? 0,
    };
  } catch (error) {
    handleError(error);
    return null;
  }
};

export const updateProcessingFeeSettings = async (
  payload: Partial<{
    processing_fee_percent: number;
    processing_fee_fixed_ngn: number;
    processing_fee_fixed_usd: number;
    treasury_wallet_address: string;
    delivery_fee_jumia_ngn: number;
    delivery_fee_crossmint_usd: number;
    jupiter_referral_account: string;
    jupiter_referral_fee_bps: number;
  }>
): Promise<ProcessingFeeSettings | null> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/admin/settings/processing-fee`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.message || `Failed to update settings: ${response.statusText}`);
    toast.success('Settings updated');
    return json.data ?? null;
  } catch (error) {
    handleError(error);
    return null;
  }
};

// ============ Bug Reports / Logs (Admin) ============

export type BugReportSeverity = 'critical' | 'warning' | 'info';
export type BugReportStatus = 'new' | 'pending' | 'fixed';
export type BugReportType = 'bug' | 'log';

export interface BugReportUser {
  id: number;
  name: string;
  email: string;
}

export interface BugReport {
  id: number;
  user_id: number | null;
  wallet_address: string | null;
  type: BugReportType;
  severity: BugReportSeverity;
  status: BugReportStatus;
  title: string;
  summary: string | null;
  details: string | null;
  stack_trace: string | null;
  source: string | null;
  app_version: string | null;
  platform: string | null;
  device_info: string | null;
  metadata: Record<string, unknown> | null;
  resolved_at: string | null;
  resolved_by: number | null;
  resolver: BugReportUser | null;
  user: BugReportUser | null;
  created_at: string;
  updated_at: string;
}

export interface BugReportsFilters {
  status?: string;
  severity?: string;
  type?: string;
  source?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface BugReportsResponse {
  success: boolean;
  data: BugReport[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface BugReportStats {
  new: number;
  pending: number;
  fixed: number;
  total: number;
  open_critical: number;
  open_warning: number;
}

export const getBugReports = async (
  filters: BugReportsFilters = {}
): Promise<BugReportsResponse | null> => {
  try {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.severity) params.set('severity', filters.severity);
    if (filters.type) params.set('type', filters.type);
    if (filters.source) params.set('source', filters.source);
    if (filters.search) params.set('search', filters.search);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.per_page) params.set('per_page', String(filters.per_page));
    const url = `${API_BASE_URL}/admin/bug-reports${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await authenticatedFetch(url);
    if (!response.ok) throw new Error(`Failed to fetch bug reports: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    handleError(error);
    return null;
  }
};

export const getBugReportStats = async (): Promise<BugReportStats | null> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/admin/bug-reports/stats`);
    if (!response.ok) throw new Error(`Failed to fetch bug report stats: ${response.statusText}`);
    const json = await response.json();
    return json.data ?? null;
  } catch (error) {
    handleError(error);
    return null;
  }
};

export const getBugReport = async (
  id: number
): Promise<{ success: boolean; data: BugReport } | null> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/admin/bug-reports/${id}`);
    if (!response.ok) throw new Error(`Failed to fetch bug report: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    handleError(error);
    return null;
  }
};

export const updateBugReportStatus = async (
  id: number,
  status: BugReportStatus
): Promise<{ success: boolean; data: BugReport } | null> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/admin/bug-reports/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.message || `Failed to update status: ${response.statusText}`);
    toast.success('Status updated');
    return json;
  } catch (error) {
    handleError(error);
    return null;
  }
};

export const deleteBugReport = async (id: number): Promise<boolean> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/admin/bug-reports/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`Failed to delete report: ${response.statusText}`);
    toast.success('Report deleted');
    return true;
  } catch (error) {
    handleError(error);
    return false;
  }
};

export const bulkDeleteBugReports = async (ids: number[]): Promise<number> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/admin/bug-reports/bulk-delete`, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.message || `Failed to delete reports: ${response.statusText}`);
    toast.success(json.message || 'Reports deleted');
    return json.deleted_count ?? ids.length;
  } catch (error) {
    handleError(error);
    return 0;
  }
};

export const clearBugReports = async (scope: 'fixed' | 'all'): Promise<number> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/admin/bug-reports/clear`, {
      method: 'POST',
      body: JSON.stringify({ scope }),
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.message || `Failed to clear reports: ${response.statusText}`);
    toast.success(json.message || 'Reports cleared');
    return json.deleted_count ?? 0;
  } catch (error) {
    handleError(error);
    return 0;
  }
};
