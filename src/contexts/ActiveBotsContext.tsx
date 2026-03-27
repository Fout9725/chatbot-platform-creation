import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface ActiveBot {
  botId: number;
  botName: string;
  activatedAt: Date;
  expiresAt: Date;
  status: 'active' | 'expired';
  purchased?: boolean;
}

interface ActiveBotsContextType {
  activeBots: ActiveBot[];
  activateBot: (botId: number, botName: string, purchased?: boolean) => void;
  deactivateBot: (botId: number) => void;
  isBotActive: (botId: number) => boolean;
  getBotStatus: (botId: number) => ActiveBot | undefined;
}

const ActiveBotsContext = createContext<ActiveBotsContextType | undefined>(undefined);

export function ActiveBotsProvider({ children }: { children: ReactNode }) {
  const [activeBots, setActiveBots] = useState<ActiveBot[]>(() => {
    localStorage.removeItem('activeBots_version');
    
    const saved = localStorage.getItem('activeBots');
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const bots = parsed.map((bot: Record<string, unknown>) => ({
          ...bot,
          activatedAt: new Date(bot.activatedAt as string),
          expiresAt: new Date(bot.expiresAt as string)
        }));
        return bots;
      } catch {
        localStorage.removeItem('activeBots');
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
          status: bot.purchased || bot.expiresAt > now ? 'active' as const : 'expired' as const
        }))
      );
    };

    checkExpiredBots();
    const interval = setInterval(checkExpiredBots, 60000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const dataToSave = JSON.stringify(activeBots);
    localStorage.setItem('activeBots', dataToSave);
  }, [activeBots]);

  const activateBot = (botId: number, botName: string, purchased?: boolean) => {
    const now = new Date();
    const expiresAt = purchased
      ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
      : new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    setActiveBots(prev => {
      const existing = prev.find(bot => bot.botId === botId);
      if (existing) {
        return prev.map(bot => 
          bot.botId === botId 
            ? { ...bot, activatedAt: now, expiresAt, status: 'active' as const, purchased: purchased || bot.purchased }
            : bot
        );
      }
      return [...prev, { botId, botName, activatedAt: now, expiresAt, status: 'active' as const, purchased: !!purchased }];
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
