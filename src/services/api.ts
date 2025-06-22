import { toast } from "sonner";
import { API_BASE_URL } from "@/config/env";

export interface WaitlistUser {
  id: number;
  email_address: string;
  first_name: string;
  last_name: string;
  country: string;
  wallet_address: string;
  created_at?: string;
}

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

// Get waitlist users
export const getWaitlistUsers = async (): Promise<WaitlistUser[]> => {
  try {
    console.log("Fetching waitlist users from", `${API_BASE_URL}/get_waitlist`);
    const response = await fetch(`${API_BASE_URL}/get_waitlist`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch waitlist: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Waitlist data:", data);
    return data || [];
  } catch (error) {
    handleError(error);
    return [];
  }
};

// Get tracking data
export const getTrackingData = async (): Promise<TrackingData | null> => {
  try {
    console.log("Fetching tracking data from", `${API_BASE_URL}/track/get-tracking-data`);
    const response = await fetch(`${API_BASE_URL}/track/get-tracking-data`);
    
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

// Add a user to the waitlist
export const addToWaitlist = async (userData: Omit<WaitlistUser, 'id'>): Promise<boolean> => {
  try {
    console.log("Adding user to waitlist:", userData);
    const response = await fetch(`${API_BASE_URL}/add_to_waitlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to add to waitlist: ${response.statusText}`);
    }
    
    toast.success('User added to waitlist successfully');
    return true;
  } catch (error) {
    handleError(error);
    return false;
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
    
    // Store auth token and user profile
    localStorage.setItem('auth_token', data.token);
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

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('auth_token');
};

// Logout user
export const logoutUser = (): void => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_profile');
  localStorage.removeItem('temp_admin_email');
  toast.success('Logged out successfully');
};

// Create admin (if needed)
export const createAdmin = async (name: string, email: string): Promise<boolean> => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/create-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
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
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/fetch-admins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
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
