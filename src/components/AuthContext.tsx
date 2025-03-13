
import React, { createContext, useEffect, useState } from 'react';
import { 
  getUserProfile, 
  isAuthenticated, 
  loginUser, 
  logoutUser, 
  updateUserProfile, 
  UserProfile 
} from '@/services/api';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: UserProfile | null;
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (profile: Partial<UserProfile>) => Promise<UserProfile | null>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  login: async () => false,
  logout: () => {},
  updateProfile: async () => null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
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
    };
    
    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    const success = await loginUser(username, password);
    
    if (success) {
      setIsLoggedIn(true);
      const profile = getUserProfile();
      setUser(profile);
      navigate('/dashboard');
    }
    
    return success;
  };

  const logout = () => {
    logoutUser();
    setIsLoggedIn(false);
    setUser(null);
    navigate('/');
  };

  const updateProfile = async (profile: Partial<UserProfile>) => {
    const updatedProfile = await updateUserProfile(profile);
    
    if (updatedProfile) {
      setUser(updatedProfile);
    }
    
    return updatedProfile;
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
