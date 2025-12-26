import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'optimal' | 'premium' | 'partner';
  registeredAt: Date;
  hasActivatedBot: boolean;
  sessionExpiry: number;
  role?: 'admin' | 'user';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setUserActivatedBot: () => void;
  setUserPlan: (plan: 'free' | 'optimal' | 'premium' | 'partner') => void;
  checkSession: () => boolean;
  updateUserAvatar: (avatarUrl: string) => void;
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
    if (user && user.id) {
      fetch('https://functions.poehali.dev/28a8e1f1-0c2b-4802-8fbe-0a098fc29bec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role || 'user',
          plan: user.plan
        })
      }).catch(error => {
        console.error('Ошибка синхронизации пользователя при загрузке:', error);
      });
    }
  }, []);

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

  const login = async (email: string, password: string) => {
    const sessionExpiry = Date.now() + (4 * 60 * 60 * 1000);
    
    if (email === 'A/V admin' && password === 'vovan.ru97') {
      const adminUser: User = {
        id: 'admin-001',
        name: 'Администратор',
        email: 'admin@intellectpro.ru',
        plan: 'partner',
        registeredAt: new Date(),
        hasActivatedBot: true,
        sessionExpiry,
        role: 'admin'
      };
      
      try {
        await fetch('https://functions.poehali.dev/28a8e1f1-0c2b-4802-8fbe-0a098fc29bec', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.name,
            role: adminUser.role,
            plan: adminUser.plan
          })
        });
      } catch (error) {
        console.error('Ошибка синхронизации админа с БД:', error);
      }
      
      setUser(adminUser);
      return;
    }
    
    const mockUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Пользователь',
      email,
      plan: 'free',
      registeredAt: new Date(),
      hasActivatedBot: false,
      sessionExpiry
    };
    
    try {
      await fetch('https://functions.poehali.dev/28a8e1f1-0c2b-4802-8fbe-0a098fc29bec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: 'user',
          plan: mockUser.plan
        })
      });
    } catch (error) {
      console.error('Ошибка синхронизации пользователя с БД:', error);
    }
    
    setUser(mockUser);
  };

  const register = async (name: string, email: string, password: string) => {
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
    
    try {
      await fetch('https://functions.poehali.dev/28a8e1f1-0c2b-4802-8fbe-0a098fc29bec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: 'user',
          plan: newUser.plan
        })
      });
    } catch (error) {
      console.error('Ошибка синхронизации с БД:', error);
    }
    
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

  const updateUserAvatar = (avatarUrl: string) => {
    if (user) {
      setUser({ ...user, avatar: avatarUrl });
    }
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
      checkSession,
      updateUserAvatar
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