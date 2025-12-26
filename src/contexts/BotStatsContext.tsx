import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface BotStats {
  botId: number;
  users: Set<string>;
  messages: number;
  lastMessageTime: Date;
}

interface BotStatsContextType {
  getBotStats: (botId: number) => { users: number; messages: number; lastActive: string };
  addMessage: (botId: number, userId: string) => void;
  resetBotStats: (botId: number) => void;
}

const BotStatsContext = createContext<BotStatsContextType | undefined>(undefined);

export function BotStatsProvider({ children }: { children: ReactNode }) {
  const [botsStats, setBotsStats] = useState<Map<number, BotStats>>(() => {
    localStorage.removeItem('botStats_version');
    
    const saved = localStorage.getItem('botStats');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const map = new Map<number, BotStats>();
        
        Object.entries(parsed).forEach(([botId, stats]: [string, any]) => {
          map.set(Number(botId), {
            botId: Number(botId),
            users: new Set(stats.users || []),
            messages: stats.messages || 0,
            lastMessageTime: stats.lastMessageTime ? new Date(stats.lastMessageTime) : new Date()
          });
        });
        
        return map;
      } catch (error) {
        console.error('Error parsing botStats:', error);
        localStorage.removeItem('botStats');
        return new Map();
      }
    }
    return new Map();
  });

  useEffect(() => {
    const statsObject: Record<number, any> = {};
    
    botsStats.forEach((stats, botId) => {
      statsObject[botId] = {
        users: Array.from(stats.users),
        messages: stats.messages,
        lastMessageTime: stats.lastMessageTime.toISOString()
      };
    });
    
    localStorage.setItem('botStats', JSON.stringify(statsObject));
    console.log('📊 Сохранена статистика для', botsStats.size, 'ботов');
  }, [botsStats]);

  const getBotStats = (botId: number) => {
    const stats = botsStats.get(botId);
    
    if (!stats) {
      return {
        users: 0,
        messages: 0,
        lastActive: 'Никогда'
      };
    }

    const now = new Date();
    const diffMs = now.getTime() - stats.lastMessageTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    let lastActive = 'Никогда';
    if (diffMins < 1) {
      lastActive = 'Только что';
    } else if (diffMins < 60) {
      lastActive = `${diffMins} ${diffMins === 1 ? 'минуту' : diffMins < 5 ? 'минуты' : 'минут'} назад`;
    } else if (diffHours < 24) {
      lastActive = `${diffHours} ${diffHours === 1 ? 'час' : diffHours < 5 ? 'часа' : 'часов'} назад`;
    } else {
      lastActive = `${diffDays} ${diffDays === 1 ? 'день' : diffDays < 5 ? 'дня' : 'дней'} назад`;
    }

    return {
      users: stats.users.size,
      messages: stats.messages,
      lastActive
    };
  };

  const addMessage = (botId: number, userId: string) => {
    setBotsStats(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(botId);

      if (existing) {
        existing.users.add(userId);
        existing.messages += 1;
        existing.lastMessageTime = new Date();
      } else {
        newMap.set(botId, {
          botId,
          users: new Set([userId]),
          messages: 1,
          lastMessageTime: new Date()
        });
      }

      return newMap;
    });
  };

  const resetBotStats = (botId: number) => {
    setBotsStats(prev => {
      const newMap = new Map(prev);
      newMap.delete(botId);
      return newMap;
    });
  };

  return (
    <BotStatsContext.Provider value={{ getBotStats, addMessage, resetBotStats }}>
      {children}
    </BotStatsContext.Provider>
  );
}

export function useBotStats() {
  const context = useContext(BotStatsContext);
  if (!context) {
    throw new Error('useBotStats must be used within BotStatsProvider');
  }
  return context;
}