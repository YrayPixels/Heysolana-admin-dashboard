import React, { createContext, useEffect, useState } from "react";
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
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; needsVerification: boolean }>;
  verify: (verificationCode: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (profile: Partial<UserProfile>) => Promise<UserProfile | null>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  needsVerification: false,
  login: async () => ({ success: false, needsVerification: false }),
  verify: async () => false,
  logout: () => {},
  updateProfile: async () => null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [needsVerification, setNeedsVerification] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated on mount
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      setIsLoggedIn(authenticated);

      if (authenticated) {
        const profile = getUserProfile();
        setUser(profile);
      }

      // Check if there's a pending verification
      const tempEmail = localStorage.getItem("temp_admin_email");
      setNeedsVerification(!!tempEmail && !authenticated);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const result = await loginUser(email, password);

    if (result.needsVerification) {
      setNeedsVerification(true);
      if (result.admin) {
        setUser(result.admin);
      }
      return { success: true, needsVerification: true };
    }

    return { success: false, needsVerification: false };
  };

  const verify = async (verificationCode: string) => {
    const success = await verifyAdmin(verificationCode);

    if (success) {
      setIsLoggedIn(true);
      setNeedsVerification(false);
      const profile = getUserProfile();
      setUser(profile);
      navigate("/dashboard");
    }

    return success;
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
        login,
        verify,
        logout,
        updateProfile,
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
