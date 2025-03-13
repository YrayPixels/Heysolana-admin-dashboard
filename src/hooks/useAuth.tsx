
import { AuthContext } from '@/components/AuthContext';
import { useContext } from 'react';

export const useAuth = () => {
  return useContext(AuthContext);
};
