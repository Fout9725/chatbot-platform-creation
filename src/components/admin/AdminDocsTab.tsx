import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';

const AdminDocsTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Управление документами</CardTitle>
        <CardDescription>Редактирование юридических документов</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Пользовательское соглашение</label>
          <Textarea rows={4} placeholder="Текст соглашения..." />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Политика конфиденциальности</label>
          <Textarea rows={4} placeholder="Текст политики..." />
        </div>
        <Button type="button" className="w-full">
          <Icon name="Save" size={18} className="mr-2" />
          Сохранить документы
        </Button>
      </CardContent>
    </Card>
  );
};

export default AdminDocsTab;
