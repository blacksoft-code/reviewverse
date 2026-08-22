'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { getProfile } from '@/services/auth.service';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;

  // NEW:
  // Login করার পরে Navbar-কে immediately জানাবে
  setUser: (user: User | null) => void;

  // NEW:
  // Logout করার সময় user state clear করবে
  logout: () => void;
};

const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(
    null,
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token =
        localStorage.getItem('access_token');

      // Token না থাকলে logged out
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await getProfile();

        setUser(response.data);
      } catch {
        // Token invalid/expired হলে
        localStorage.removeItem('access_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  function logout() {
    localStorage.removeItem('access_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        setUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider',
    );
  }

  return context;
}