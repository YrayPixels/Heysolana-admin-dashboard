
import { toast } from "sonner";

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
  username: string;
  email: string;
  fullName: string;
  avatar: string;
}

const BASE_URL = "https://api.yraytestings.com.ng/api";

// Error handling helper
const handleError = (error: any) => {
  console.error("API Error:", error);
  const message = error.response?.data?.message || 'Something went wrong';
  toast.error(message);
  return null;
};

// Get waitlist users
export const getWaitlistUsers = async (): Promise<WaitlistUser[]> => {
  try {
    console.log("Fetching waitlist users from", `${BASE_URL}/get_waitlist`);
    const response = await fetch(`${BASE_URL}/get_waitlist`);
    
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

// Add a user to the waitlist
export const addToWaitlist = async (userData: Omit<WaitlistUser, 'id'>): Promise<boolean> => {
  try {
    console.log("Adding user to waitlist:", userData);
    const response = await fetch(`${BASE_URL}/add_to_waitlist`, {
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

// Mock auth service
export const loginUser = async (username: string, password: string): Promise<boolean> => {
  try {
    // For demo purposes, hardcoded credentials
    if (username === 'admin' && password === 'password') {
      // Store auth token in localStorage
      localStorage.setItem('auth_token', 'mock_token_12345');
      localStorage.setItem('user_profile', JSON.stringify({
        username: 'admin',
        email: 'admin@example.com',
        fullName: 'Admin User',
        avatar: '',
      }));
      return true;
    }
    
    throw new Error('Invalid credentials');
  } catch (error) {
    handleError(error);
    return false;
  }
};

// Mock profile update
export const updateUserProfile = async (profile: Partial<UserProfile>): Promise<UserProfile | null> => {
  try {
    // For demo purposes, just update localStorage
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
  toast.success('Logged out successfully');
};
