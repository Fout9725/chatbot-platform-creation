import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface ActiveBot {
  botId: number;
  botName: string;
  activatedAt: Date;
  expiresAt: Date;
  status: 'active' | 'expired';
}

interface ActiveBotsContextType {
  activeBots: ActiveBot[];
  activateBot: (botId: number, botName: string) => void;
  deactivateBot: (botId: number) => void;
  isBotActive: (botId: number) => boolean;
  getBotStatus: (botId: number) => ActiveBot | undefined;
}

const ActiveBotsContext = createContext<ActiveBotsContextType | undefined>(undefined);

export function ActiveBotsProvider({ children }: { children: ReactNode }) {
  const [activeBots, setActiveBots] = useState<ActiveBot[]>(() => {
    const DATA_VERSION = '2.0';
    const currentVersion = localStorage.getItem('activeBots_version');
    
    if (currentVersion !== DATA_VERSION) {
      localStorage.removeItem('activeBots');
      localStorage.setItem('activeBots_version', DATA_VERSION);
      return [];
    }
    
    const saved = localStorage.getItem('activeBots');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((bot: any) => ({
          ...bot,
          activatedAt: new Date(bot.activatedAt),
          expiresAt: new Date(bot.expiresAt)
        }));
      } catch (error) {
        console.error('Error parsing activeBots:', error);
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    const checkExpiredBots = () => {
      const now = new Date();
      setActiveBots(prev => 
        prev.map(bot => ({
          ...bot,
          status: bot.expiresAt > now ? 'active' : 'expired'
        }))
      );
    };

    checkExpiredBots();
    const interval = setInterval(checkExpiredBots, 60000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('activeBots', JSON.stringify(activeBots));
  }, [activeBots]);

  const activateBot = (botId: number, botName: string) => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    setActiveBots(prev => {
      const existing = prev.find(bot => bot.botId === botId);
      if (existing) {
        return prev.map(bot => 
          bot.botId === botId 
            ? { ...bot, activatedAt: now, expiresAt, status: 'active' as const }
            : bot
        );
      }
      return [...prev, { botId, botName, activatedAt: now, expiresAt, status: 'active' as const }];
    });
  };

  const deactivateBot = (botId: number) => {
    setActiveBots(prev => prev.filter(bot => bot.botId !== botId));
  };

  const isBotActive = (botId: number) => {
    const bot = activeBots.find(b => b.botId === botId);
    return bot?.status === 'active';
  };

  const getBotStatus = (botId: number) => {
    return activeBots.find(bot => bot.botId === botId);
  };

  return (
    <ActiveBotsContext.Provider value={{ activeBots, activateBot, deactivateBot, isBotActive, getBotStatus }}>
      {children}
    </ActiveBotsContext.Provider>
  );
}

export function useActiveBots() {
  const context = useContext(ActiveBotsContext);
  if (!context) {
    throw new Error('useActiveBots must be used within ActiveBotsProvider');
  }
  return context;
}