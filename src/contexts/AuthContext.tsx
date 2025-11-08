import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'optimal' | 'premium' | 'partner';
  registeredAt: Date;
  hasActivatedBot: boolean;
  sessionExpiry: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => void;
  register: (name: string, email: string, password: string) => void;
  logout: () => void;
  setUserActivatedBot: () => void;
  setUserPlan: (plan: 'free' | 'optimal' | 'premium' | 'partner') => void;
  checkSession: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      const parsed = JSON.parse(saved);
      const now = Date.now();
      if (parsed.sessionExpiry && now > parsed.sessionExpiry) {
        localStorage.removeItem('user');
        return null;
      }
      return {
        ...parsed,
        registeredAt: new Date(parsed.registeredAt)
      };
    }
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (user && user.sessionExpiry) {
        const now = Date.now();
        if (now > user.sessionExpiry) {
          setUser(null);
          window.dispatchEvent(new CustomEvent('session-expired'));
        }
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [user]);

  const login = (email: string, password: string) => {
    const sessionExpiry = Date.now() + (4 * 60 * 60 * 1000);
    const mockUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Пользователь',
      email,
      plan: 'free',
      registeredAt: new Date(),
      hasActivatedBot: false,
      sessionExpiry
    };
    setUser(mockUser);
  };

  const register = (name: string, email: string, password: string) => {
    const sessionExpiry = Date.now() + (4 * 60 * 60 * 1000);
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      plan: 'free',
      registeredAt: new Date(),
      hasActivatedBot: false,
      sessionExpiry
    };
    setUser(newUser);
  };

  const logout = () => {
    setUser(null);
  };

  const setUserActivatedBot = () => {
    if (user) {
      setUser({ ...user, hasActivatedBot: true });
    }
  };

  const setUserPlan = (plan: 'free' | 'optimal' | 'premium' | 'partner') => {
    if (user) {
      setUser({ ...user, plan });
    }
  };

  const checkSession = (): boolean => {
    if (!user || !user.sessionExpiry) return false;
    const now = Date.now();
    return now <= user.sessionExpiry;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      register, 
      logout,
      setUserActivatedBot,
      setUserPlan,
      checkSession
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}