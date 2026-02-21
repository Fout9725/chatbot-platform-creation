import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import type { CrmIntegration } from '../BotSettingsModal';

const CRM_TYPES = [
  { id: 'bitrix24', name: 'Bitrix24', icon: 'Building2', color: 'bg-blue-100 text-blue-700' },
  { id: 'amocrm', name: 'amoCRM', icon: 'Target', color: 'bg-indigo-100 text-indigo-700' },
  { id: 'yclients', name: 'YClients', icon: 'Calendar', color: 'bg-green-100 text-green-700' },
  { id: 'retailcrm', name: 'RetailCRM', icon: 'ShoppingBag', color: 'bg-orange-100 text-orange-700' },
  { id: 'custom_api', name: 'Свой API', icon: 'Code', color: 'bg-gray-100 text-gray-700' },
  { id: 'whatsapp', name: 'WhatsApp API', icon: 'MessageCircle', color: 'bg-green-100 text-green-600' },
  { id: 'vk_api', name: 'VK API', icon: 'Users', color: 'bg-blue-100 text-blue-600' },
  { id: 'instagram', name: 'Instagram API', icon: 'Camera', color: 'bg-pink-100 text-pink-600' },
];

interface BotSettingsIntegrationsTabProps {
  telegramToken: string;
  setTelegramToken: (v: string) => void;
  telegramStatus: 'idle' | 'connecting' | 'connected' | 'error';
  telegramBotName: string;
  handleConnectTelegram: () => void;
  handleDisconnectTelegram: () => void;
  crmIntegrations: CrmIntegration[];
  onSaveCrm: (crm: Partial<CrmIntegration>) => void;
  onDeleteCrm: (id: number) => void;
}

export default function BotSettingsIntegrationsTab({
  telegramToken,
  setTelegramToken,
  telegramStatus,
  telegramBotName,
  handleConnectTelegram,
  handleDisconnectTelegram,
  crmIntegrations,
  onSaveCrm,
  onDeleteCrm,
}: BotSettingsIntegrationsTabProps) {
  const [showAddCrm, setShowAddCrm] = useState(false);
  const [newCrmType, setNewCrmType] = useState('');
  const [newCrmApiKey, setNewCrmApiKey] = useState('');
  const [newCrmWebhook, setNewCrmWebhook] = useState('');

  const handleAddCrm = () => {
    if (!newCrmType || !newCrmApiKey.trim()) return;
    onSaveCrm({
      crm_type: newCrmType,
      api_key: newCrmApiKey.trim(),
      webhook_url: newCrmWebhook.trim() || undefined,
    });
    setNewCrmType('');
    setNewCrmApiKey('');
    setNewCrmWebhook('');
    setShowAddCrm(false);
  };

  const getCrmInfo = (type: string) => CRM_TYPES.find(c => c.id === type) || { name: type, icon: 'Plug', color: 'bg-gray-100 text-gray-700' };

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
          <Button variant="outline" className="w-full" onClick={handleDisconnectTelegram}>
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

      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="Puzzle" size={20} className="text-primary" />
            <h4 className="font-semibold">CRM и API интеграции</h4>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowAddCrm(!showAddCrm)}>
            <Icon name={showAddCrm ? 'X' : 'Plus'} size={16} className="mr-1" />
            {showAddCrm ? 'Отмена' : 'Добавить'}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">Подключите CRM-системы и внешние API для расширения возможностей бота</p>

        {showAddCrm && (
          <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
            <div className="space-y-2">
              <Label>Тип интеграции</Label>
              <Select value={newCrmType} onValueChange={setNewCrmType}>
                <SelectTrigger><SelectValue placeholder="Выберите сервис" /></SelectTrigger>
                <SelectContent>
                  {CRM_TYPES.map(crm => (
                    <SelectItem key={crm.id} value={crm.id}>
                      <div className="flex items-center gap-2">
                        <Icon name={crm.icon} size={16} />
                        <span>{crm.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>API ключ</Label>
              <Input
                type="password"
                placeholder="Введите API ключ сервиса"
                value={newCrmApiKey}
                onChange={(e) => setNewCrmApiKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Webhook URL (необязательно)</Label>
              <Input
                placeholder="https://..."
                value={newCrmWebhook}
                onChange={(e) => setNewCrmWebhook(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={handleAddCrm} disabled={!newCrmType || !newCrmApiKey.trim()}>
              <Icon name="Save" size={16} className="mr-2" />
              Сохранить интеграцию
            </Button>
          </div>
        )}

        {crmIntegrations.length > 0 ? (
          <div className="space-y-2">
            {crmIntegrations.map(integration => {
              const info = getCrmInfo(integration.crm_type);
              return (
                <div key={integration.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className={`p-2 rounded-lg ${info.color}`}>
                    <Icon name={info.icon} size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{info.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      Ключ: {integration.api_key_masked || '***'}
                    </p>
                  </div>
                  <Badge variant={integration.is_active ? 'default' : 'secondary'}>
                    {integration.is_active ? 'Активна' : 'Выкл'}
                  </Badge>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDeleteCrm(integration.id)}>
                    <Icon name="Trash2" size={16} />
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          !showAddCrm && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              <Icon name="PlugZap" size={32} className="mx-auto mb-2 opacity-40" />
              Интеграции не подключены
            </div>
          )
        )}
      </div>
    </TabsContent>
  );
}
