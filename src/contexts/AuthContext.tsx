import { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, authApi } from '@/api/auth';
import { mockAuthApi } from '@/data/mockAuth';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role?: string;
    phone?: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    let token: string;
    let loggedUser: User;

    if (USE_MOCK) {
      const result = await mockAuthApi.login(email, password);
      token = result.token;
      loggedUser = result.user;
    } else {
      const result = await authApi.login({ email, password });
      token = result.token;
      loggedUser = result.user;
    }

    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(loggedUser));
    setUser(loggedUser);
    return loggedUser;
  }, []);

  const register = useCallback(async (data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role?: string;
    phone?: string;
  }) => {
    let token: string;
    let registeredUser: User;

    if (USE_MOCK) {
      const result = await mockAuthApi.register(data);
      token = result.token;
      registeredUser = result.user;
    } else {
      const result = await authApi.register(data);
      token = result.token;
      registeredUser = result.user;
    }

    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(registeredUser));
    setUser(registeredUser);
    return registeredUser;
  }, []);

  const logout = useCallback(async () => {
    if (USE_MOCK) {
      await mockAuthApi.logout();
    } else {
      try { await authApi.logout(); } catch { /* ignore */ }
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
