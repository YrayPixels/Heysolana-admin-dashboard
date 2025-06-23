import React, { createContext, useEffect, useState, useCallback } from "react";
import {
  getUserProfile,
  isAuthenticated,
  loginUser,
  logoutUser,
  updateUserProfile,
  UserProfile,
  verifyAdmin,
} from "@/services/api";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: UserProfile | null;
  isLoggedIn: boolean;
  needsVerification: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; needsVerification: boolean }>;
  verify: (verificationCode: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (profile: Partial<UserProfile>) => Promise<UserProfile | null>;
  refreshAuth: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  needsVerification: false,
  isLoading: true,
  login: async () => ({ success: false, needsVerification: false }),
  verify: async () => false,
  logout: () => {},
  updateProfile: async () => null,
  refreshAuth: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [needsVerification, setNeedsVerification] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Function to refresh authentication state
  const refreshAuth = useCallback(() => {
    const authenticated = isAuthenticated();
    const profile = getUserProfile();
    const tempEmail = localStorage.getItem("temp_admin_email");

    setIsLoggedIn(authenticated);
    setUser(profile);
    setNeedsVerification(!!tempEmail && !authenticated);
    setIsLoading(false);
  }, []);

  // Listen for storage changes (for cross-tab synchronization) and auth logout events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === "auth_token" ||
        e.key === "user_profile" ||
        e.key === "temp_admin_email"
      ) {
        refreshAuth();
      }
    };

    const handleAuthLogout = () => {
      // Handle automatic logout from expired tokens
      setIsLoggedIn(false);
      setNeedsVerification(false);
      setUser(null);
      setIsLoading(false);
      navigate("/");
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth-logout", handleAuthLogout);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth-logout", handleAuthLogout);
    };
  }, [refreshAuth, navigate]);

  // Check authentication state on mount
  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const result = await loginUser(email, password);

      if (result.needsVerification) {
        setNeedsVerification(true);
        if (result.admin) {
          setUser(result.admin);
        }
        return { success: true, needsVerification: true };
      }

      return { success: false, needsVerification: false };
    } finally {
      setIsLoading(false);
    }
  };

  const verify = async (verificationCode: string) => {
    try {
      setIsLoading(true);
      const success = await verifyAdmin(verificationCode);

      if (success) {
        // Refresh auth state after successful verification
        refreshAuth();
        navigate("/dashboard");
      }

      return success;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    logoutUser();
    setIsLoggedIn(false);
    setNeedsVerification(false);
    setUser(null);
    navigate("/");
  };

  const updateProfile = async (profile: Partial<UserProfile>) => {
    const updatedProfile = await updateUserProfile(profile);

    if (updatedProfile) {
      setUser(updatedProfile);
    }

    return updatedProfile;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        needsVerification,
        isLoading,
        login,
        verify,
        logout,
        updateProfile,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
