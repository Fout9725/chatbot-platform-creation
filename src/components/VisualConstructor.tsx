import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Block {
  id: string;
  type: 'start' | 'message' | 'question' | 'condition' | 'action' | 'end';
  x: number;
  y: number;
  data: {
    text?: string;
    options?: string[];
  };
}

const blockTypes = [
  { type: 'start', label: 'Старт', icon: 'Play', color: 'bg-green-500' },
  { type: 'message', label: 'Сообщение', icon: 'MessageSquare', color: 'bg-blue-500' },
  { type: 'question', label: 'Вопрос', icon: 'HelpCircle', color: 'bg-purple-500' },
  { type: 'condition', label: 'Условие', icon: 'GitBranch', color: 'bg-orange-500' },
  { type: 'action', label: 'Действие', icon: 'Zap', color: 'bg-yellow-500' },
  { type: 'end', label: 'Конец', icon: 'Flag', color: 'bg-red-500' },
];

const VisualConstructor = () => {
  const [blocks, setBlocks] = useState<Block[]>([
    { id: '1', type: 'start', x: 50, y: 50, data: { text: 'Начало диалога' } }
  ]);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [draggedType, setDraggedType] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDragStart = (type: string) => {
    setDraggedType(type);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedType) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newBlock: Block = {
      id: Date.now().toString(),
      type: draggedType as any,
      x,
      y,
      data: { text: '', options: [] }
    };

    setBlocks([...blocks, newBlock]);
    setDraggedType(null);
    
    toast({
      title: 'Блок добавлен',
      description: `Блок "${blockTypes.find(b => b.type === draggedType)?.label}" добавлен на холст`,
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleBlockClick = (block: Block) => {
    setSelectedBlock(block);
  };

  const updateBlockData = (field: string, value: any) => {
    if (!selectedBlock) return;

    setBlocks(blocks.map(b => 
      b.id === selectedBlock.id 
        ? { ...b, data: { ...b.data, [field]: value } }
        : b
    ));

    setSelectedBlock({ ...selectedBlock, data: { ...selectedBlock.data, [field]: value } });
  };

  const deleteBlock = (blockId: string) => {
    setBlocks(blocks.filter(b => b.id !== blockId));
    if (selectedBlock?.id === blockId) {
      setSelectedBlock(null);
    }
    toast({
      title: 'Блок удален',
      description: 'Блок успешно удален с холста',
    });
  };

  const exportBot = () => {
    const botData = {
      blocks,
      connections: [],
      created: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(botData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bot-config.json';
    a.click();

    toast({
      title: 'Бот экспортирован',
      description: 'Конфигурация бота сохранена в файл',
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Icon name="Blocks" size={20} />
              Панель блоков
            </CardTitle>
            <CardDescription>Перетащите блок на холст</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {blockTypes.map((blockType) => (
              <div
                key={blockType.type}
                draggable
                onDragStart={() => handleDragStart(blockType.type)}
                className="p-3 border rounded-lg cursor-move hover:shadow-md transition-all bg-white"
              >
                <div className="flex items-center gap-2">
                  <div className={`${blockType.color} p-2 rounded-md`}>
                    <Icon name={blockType.icon as any} size={18} className="text-white" />
                  </div>
                  <span className="font-medium text-sm">{blockType.label}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Icon name="Settings" size={20} />
              Свойства
            </CardTitle>
            <CardDescription>
              {selectedBlock ? 'Редактирование блока' : 'Выберите блок'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedBlock ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Текст</label>
                  <Textarea
                    value={selectedBlock.data.text || ''}
                    onChange={(e) => updateBlockData('text', e.target.value)}
                    placeholder="Введите текст сообщения"
                    rows={4}
                  />
                </div>

                {(selectedBlock.type === 'question' || selectedBlock.type === 'condition') && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Варианты ответов</label>
                    <div className="space-y-2">
                      {(selectedBlock.data.options || []).map((option, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...(selectedBlock.data.options || [])];
                              newOptions[index] = e.target.value;
                              updateBlockData('options', newOptions);
                            }}
                            placeholder={`Вариант ${index + 1}`}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const newOptions = (selectedBlock.data.options || []).filter((_, i) => i !== index);
                              updateBlockData('options', newOptions);
                            }}
                          >
                            <Icon name="X" size={16} />
                          </Button>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newOptions = [...(selectedBlock.data.options || []), ''];
                          updateBlockData('options', newOptions);
                        }}
                      >
                        <Icon name="Plus" size={16} className="mr-2" />
                        Добавить вариант
                      </Button>
                    </div>
                  </div>
                )}

                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => deleteBlock(selectedBlock.id)}
                >
                  <Icon name="Trash2" size={16} className="mr-2" />
                  Удалить блок
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Кликните на блок для редактирования
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-3 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Workflow" size={24} />
                  Конструктор диалогов
                </CardTitle>
                <CardDescription>Создайте сценарий диалога визуально</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Icon name="Undo" size={16} className="mr-2" />
                  Отменить
                </Button>
                <Button variant="outline" size="sm" onClick={exportBot}>
                  <Icon name="Download" size={16} className="mr-2" />
                  Экспорт
                </Button>
                <Button size="sm">
                  <Icon name="Play" size={16} className="mr-2" />
                  Тест
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="relative border-2 border-dashed rounded-lg bg-gradient-to-br from-gray-50 to-white min-h-[600px]"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {blocks.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Icon name="Workflow" size={64} className="mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Перетащите блоки на холст</p>
                  </div>
                </div>
              ) : (
                blocks.map((block) => {
                  const blockType = blockTypes.find(b => b.type === block.type);
                  return (
                    <div
                      key={block.id}
                      className={`absolute cursor-pointer transition-all ${
                        selectedBlock?.id === block.id ? 'ring-2 ring-primary' : ''
                      }`}
                      style={{ left: block.x, top: block.y }}
                      onClick={() => handleBlockClick(block)}
                    >
                      <Badge className={`${blockType?.color} text-white px-4 py-2`}>
                        <Icon name={blockType?.icon as any} size={16} className="mr-2" />
                        {blockType?.label}
                      </Badge>
                      {block.data.text && (
                        <div className="mt-2 bg-white border rounded p-2 text-xs max-w-[200px]">
                          {block.data.text}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VisualConstructor;
