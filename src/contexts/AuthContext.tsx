import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'optimal' | 'premium' | 'partner';
  registeredAt: Date;
  hasActivatedBot: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => void;
  register: (name: string, email: string, password: string) => void;
  logout: () => void;
  setUserActivatedBot: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      const parsed = JSON.parse(saved);
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

  const login = (email: string, password: string) => {
    const mockUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Пользователь',
      email,
      plan: 'free',
      registeredAt: new Date(),
      hasActivatedBot: false
    };
    setUser(mockUser);
  };

  const register = (name: string, email: string, password: string) => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      plan: 'free',
      registeredAt: new Date(),
      hasActivatedBot: false
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

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      register, 
      logout,
      setUserActivatedBot
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
