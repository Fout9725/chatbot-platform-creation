import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

const API_URL = 'https://functions.poehali.dev/28a8e1f1-0c2b-4802-8fbe-0a098fc29bec';

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

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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
    if (user && user.id && user.email) {
      const syncUser = async () => {
        try {
          const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role || 'user',
              plan: user.plan,
              avatar: user.avatar
            })
          });
          const data = await response.json();
          
          if (data.user && data.user.avatar && data.user.avatar !== user.avatar) {
            setUser(prev => prev ? { ...prev, avatar: data.user.avatar } : null);
          }
        } catch (error) {
          console.error('Ошибка синхронизации пользователя при загрузке:', error);
        }
      };
      syncUser();
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
    const hashedPassword = await hashPassword(password);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        email,
        password: hashedPassword
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Login failed');
    }

    const sessionExpiry = Date.now() + (4 * 60 * 60 * 1000);

    const loggedInUser: User = {
      id: String(data.user.id),
      name: data.user.name || 'Пользователь',
      email: data.user.email,
      plan: data.user.plan || 'free',
      registeredAt: data.user.created_at ? new Date(data.user.created_at) : new Date(),
      hasActivatedBot: false,
      sessionExpiry,
      role: data.user.role || 'user',
      avatar: data.user.avatar || undefined
    };

    setUser(loggedInUser);
  };

  const register = async (name: string, email: string, password: string) => {
    const hashedPassword = await hashPassword(password);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'register',
        name,
        email,
        password: hashedPassword
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Registration failed');
    }

    const sessionExpiry = Date.now() + (4 * 60 * 60 * 1000);

    const newUser: User = {
      id: String(data.user.id),
      name: data.user.name || name,
      email: data.user.email,
      plan: data.user.plan || 'free',
      registeredAt: data.user.created_at ? new Date(data.user.created_at) : new Date(),
      hasActivatedBot: false,
      sessionExpiry,
      role: data.user.role || 'user',
      avatar: data.user.avatar || undefined
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

  const updateUserAvatar = async (avatarUrl: string) => {
    if (user) {
      const updatedUser = { ...user, avatar: avatarUrl };
      setUser(updatedUser);
      
      try {
        await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role || 'user',
            plan: user.plan,
            avatar: avatarUrl
          })
        });
      } catch (error) {
        console.error('Ошибка сохранения аватара в БД:', error);
      }
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