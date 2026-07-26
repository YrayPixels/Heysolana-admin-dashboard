import React, {
  createContext,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  clearMerchantAuth,
  getMerchantProfile,
  isMerchantAuthenticated,
  merchantGoogleLogin,
  merchantLogout,
  MerchantProfile,
  setMerchantProfile,
} from "@/services/merchantApi";

interface MerchantAuthContextType {
  merchant: MerchantProfile | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  loginWithGoogle: (idToken: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAuth: () => void;
  updateLocalProfile: (profile: MerchantProfile) => void;
}

export const MerchantAuthContext = createContext<MerchantAuthContextType>({
  merchant: null,
  isLoggedIn: false,
  isLoading: true,
  loginWithGoogle: async () => false,
  logout: async () => {},
  refreshAuth: () => {},
  updateLocalProfile: () => {},
});

export const MerchantAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const refreshAuth = useCallback(() => {
    const authenticated = isMerchantAuthenticated();
    const profile = getMerchantProfile();
    setIsLoggedIn(authenticated);
    setMerchant(profile);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  useEffect(() => {
    const onLogout = () => {
      setIsLoggedIn(false);
      setMerchant(null);
      navigate("/");
    };
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === "merchant_auth_token" ||
        e.key === "merchant_user_profile"
      ) {
        refreshAuth();
      }
    };
    window.addEventListener("merchant-auth-logout", onLogout);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("merchant-auth-logout", onLogout);
      window.removeEventListener("storage", onStorage);
    };
  }, [navigate, refreshAuth]);

  const loginWithGoogle = async (idToken: string) => {
    setIsLoading(true);
    try {
      const profile = await merchantGoogleLogin(idToken);
      if (!profile) return false;
      setMerchant(profile);
      setIsLoggedIn(true);
      navigate("/dashboard");
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await merchantLogout();
    clearMerchantAuth();
    setMerchant(null);
    setIsLoggedIn(false);
    navigate("/");
  };

  const updateLocalProfile = (profile: MerchantProfile) => {
    setMerchantProfile(profile);
    setMerchant(profile);
  };

  return (
    <MerchantAuthContext.Provider
      value={{
        merchant,
        isLoggedIn,
        isLoading,
        loginWithGoogle,
        logout,
        refreshAuth,
        updateLocalProfile,
      }}
    >
      {children}
    </MerchantAuthContext.Provider>
  );
};

export const useMerchantAuth = () => React.useContext(MerchantAuthContext);
