import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

interface BotSettingsIntegrationsTabProps {
  telegramToken: string;
  setTelegramToken: (v: string) => void;
  telegramStatus: 'idle' | 'connecting' | 'connected' | 'error';
  setTelegramStatus: (v: 'idle' | 'connecting' | 'connected' | 'error') => void;
  telegramBotName: string;
  setTelegramBotName: (v: string) => void;
  handleConnectTelegram: () => void;
}

export default function BotSettingsIntegrationsTab({
  telegramToken,
  setTelegramToken,
  telegramStatus,
  setTelegramStatus,
  telegramBotName,
  setTelegramBotName,
  handleConnectTelegram,
}: BotSettingsIntegrationsTabProps) {
  return (
    <TabsContent value="integrations" className="space-y-4 mt-4">
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Icon name="Send" size={24} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold">Telegram</h4>
            <p className="text-sm text-muted-foreground">
              {telegramStatus === 'connected' ? `Подключён: @${telegramBotName}` : 'Подключите бота к Telegram'}
            </p>
          </div>
          {telegramStatus === 'connected' && (
            <Badge className="bg-green-100 text-green-700">Подключён</Badge>
          )}
        </div>
        <div className="space-y-2">
          <Label>Bot Token</Label>
          <Input
            placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
            value={telegramToken}
            onChange={(e) => setTelegramToken(e.target.value)}
            disabled={telegramStatus === 'connected'}
          />
          <p className="text-xs text-muted-foreground">Получите токен у @BotFather в Telegram</p>
        </div>
        {telegramStatus === 'connected' ? (
          <Button variant="outline" className="w-full" onClick={() => { setTelegramStatus('idle'); setTelegramToken(''); setTelegramBotName(''); }}>
            <Icon name="Unplug" size={16} className="mr-2" />
            Отключить
          </Button>
        ) : (
          <Button className="w-full" onClick={handleConnectTelegram} disabled={telegramStatus === 'connecting'}>
            {telegramStatus === 'connecting' ? (
              <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
            ) : (
              <Icon name="Link" size={16} className="mr-2" />
            )}
            {telegramStatus === 'connecting' ? 'Подключение...' : 'Подключить Telegram'}
          </Button>
        )}
        {telegramStatus === 'error' && (
          <p className="text-xs text-destructive">Не удалось подключить. Проверьте токен.</p>
        )}
      </div>

      <div className="border rounded-lg p-4 space-y-3 opacity-60">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 p-2 rounded-lg">
            <Icon name="MessageCircle" size={24} className="text-green-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold">WhatsApp</h4>
            <p className="text-sm text-muted-foreground">Скоро</p>
          </div>
          <Badge variant="outline">Скоро</Badge>
        </div>
      </div>

      <div className="border rounded-lg p-4 space-y-3 opacity-60">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Icon name="Users" size={24} className="text-blue-700" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold">VKontakte</h4>
            <p className="text-sm text-muted-foreground">Скоро</p>
          </div>
          <Badge variant="outline">Скоро</Badge>
        </div>
      </div>
    </TabsContent>
  );
}
