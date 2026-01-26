import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Node {
  id: string;
  type: 'start' | 'message' | 'question' | 'condition' | 'action' | 'api' | 'delay' | 'end';
  x: number;
  y: number;
  data: {
    label?: string;
    text?: string;
    options?: string[];
    url?: string;
    delay?: number;
  };
}

interface Connection {
  from: string;
  to: string;
  label?: string;
}

const nodeTypes = [
  { type: 'start', label: 'Старт', icon: 'Play', color: 'bg-green-500', desc: 'Начало сценария' },
  { type: 'message', label: 'Сообщение', icon: 'MessageSquare', color: 'bg-blue-500', desc: 'Отправить текст' },
  { type: 'question', label: 'Вопрос', icon: 'HelpCircle', color: 'bg-purple-500', desc: 'Получить ответ' },
  { type: 'condition', label: 'Условие', icon: 'GitBranch', color: 'bg-orange-500', desc: 'IF/ELSE логика' },
  { type: 'action', label: 'Действие', icon: 'Zap', color: 'bg-yellow-500', desc: 'Выполнить код' },
  { type: 'api', label: 'API запрос', icon: 'Globe', color: 'bg-cyan-500', desc: 'HTTP запрос' },
  { type: 'delay', label: 'Задержка', icon: 'Clock', color: 'bg-gray-500', desc: 'Пауза N сек' },
  { type: 'end', label: 'Конец', icon: 'Flag', color: 'bg-red-500', desc: 'Завершение' },
];

interface AdvancedVisualConstructorProps {
  initialConfig?: any;
}

const AdvancedVisualConstructor = ({ initialConfig }: AdvancedVisualConstructorProps) => {
  const [nodes, setNodes] = useState<Node[]>(
    initialConfig?.nodes || [
      { id: 'start-1', type: 'start', x: 100, y: 100, data: { label: 'Начало' } }
    ]
  );
  const [connections, setConnections] = useState<Connection[]>(initialConfig?.connections || []);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [draggedNode, setDraggedNode] = useState<Node | null>(null);
  const [connecting, setConnecting] = useState<{ from: string; x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleDragStart = useCallback((type: string) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type: type as any,
      x: 0,
      y: 0,
      data: { label: nodeTypes.find(n => n.type === type)?.label }
    };
    setDraggedNode(newNode);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedNode || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const finalNode = { ...draggedNode, x, y };
    setNodes(prev => [...prev, finalNode]);
    setDraggedNode(null);
    
    toast({
      title: 'Узел добавлен',
      description: `${finalNode.data.label} добавлен на холст`,
    });
  }, [draggedNode, toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleNodeClick = useCallback((node: Node) => {
    setSelectedNode(node);
  }, []);

  const startConnection = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setConnecting({ from: nodeId, x: node.x + 60, y: node.y + 30 });
    }
  }, [nodes]);

  const completeConnection = useCallback((toId: string) => {
    if (connecting && connecting.from !== toId) {
      const newConnection: Connection = { from: connecting.from, to: toId };
      setConnections(prev => [...prev, newConnection]);
      toast({
        title: 'Соединение создано',
        description: 'Узлы успешно соединены',
      });
    }
    setConnecting(null);
  }, [connecting, toast]);

  const updateNodeData = useCallback((field: string, value: any) => {
    if (!selectedNode) return;

    setNodes(prev => prev.map(n => 
      n.id === selectedNode.id 
        ? { ...n, data: { ...n.data, [field]: value } }
        : n
    ));

    setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, [field]: value } });
  }, [selectedNode]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c.from !== nodeId && c.to !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  }, [selectedNode]);

  const saveWorkflow = useCallback(() => {
    const workflow = { nodes, connections };
    localStorage.setItem('visual-workflow', JSON.stringify(workflow));
    toast({
      title: 'Сохранено',
      description: 'Сценарий успешно сохранён',
    });
  }, [nodes, connections, toast]);

  return (
    <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
      <div className="col-span-2">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Узлы</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="h-[calc(100%-60px)]">
              <div className="space-y-2">
                {nodeTypes.map((nodeType) => (
                  <div
                    key={nodeType.type}
                    draggable
                    onDragStart={() => handleDragStart(nodeType.type)}
                    className="cursor-grab active:cursor-grabbing p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`${nodeType.color} p-1.5 rounded`}>
                        <Icon name={nodeType.icon as any} className="text-white" size={14} />
                      </div>
                      <span className="text-xs font-medium">{nodeType.label}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{nodeType.desc}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="col-span-7">
        <Card className="h-full">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Холст (Drag & Drop)</CardTitle>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={saveWorkflow} disabled={false}>
                  <Icon name="Save" size={14} className="mr-1" />
                  Сохранить
                </Button>
                <Button type="button" size="sm" variant="outline" disabled={false}>
                  <Icon name="Play" size={14} className="mr-1" />
                  Тест
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div
              ref={canvasRef}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="relative w-full h-full bg-grid-pattern overflow-auto"
              style={{ minHeight: '600px', backgroundSize: '20px 20px' }}
            >
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {connections.map((conn, idx) => {
                  const fromNode = nodes.find(n => n.id === conn.from);
                  const toNode = nodes.find(n => n.id === conn.to);
                  if (!fromNode || !toNode) return null;

                  const x1 = fromNode.x + 60;
                  const y1 = fromNode.y + 30;
                  const x2 = toNode.x;
                  const y2 = toNode.y + 30;

                  return (
                    <g key={idx}>
                      <path
                        d={`M ${x1} ${y1} C ${x1 + 50} ${y1}, ${x2 - 50} ${y2}, ${x2} ${y2}`}
                        stroke="#8b5cf6"
                        strokeWidth="2"
                        fill="none"
                        markerEnd="url(#arrowhead)"
                      />
                    </g>
                  );
                })}
                
                {connecting && (
                  <line
                    x1={connecting.x}
                    y1={connecting.y}
                    x2={connecting.x + 50}
                    y2={connecting.y}
                    stroke="#8b5cf6"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                )}

                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill="#8b5cf6" />
                  </marker>
                </defs>
              </svg>

              {nodes.map((node) => {
                const nodeConfig = nodeTypes.find(t => t.type === node.type);
                return (
                  <div
                    key={node.id}
                    className={`absolute cursor-move border-2 rounded-lg bg-white p-3 transition-all ${
                      selectedNode?.id === node.id ? 'border-primary shadow-lg' : 'border-gray-200'
                    }`}
                    style={{ left: node.x, top: node.y, width: '120px' }}
                    onClick={() => handleNodeClick(node)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`${nodeConfig?.color} p-1 rounded flex-shrink-0`}>
                        <Icon name={nodeConfig?.icon as any} className="text-white" size={12} />
                      </div>
                      <span className="text-xs font-medium truncate">{node.data.label}</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <Badge variant="outline" className="text-[9px] px-1 py-0">
                        {nodeConfig?.type}
                      </Badge>
                      
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={(e) => startConnection(node.id, e)}
                          className="p-0.5 hover:bg-accent rounded"
                        >
                          <Icon name="Link" size={10} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNode(node.id);
                          }}
                          className="p-0.5 hover:bg-accent rounded text-destructive"
                        >
                          <Icon name="Trash2" size={10} />
                        </button>
                      </div>
                    </div>

                    <div
                      onClick={() => completeConnection(node.id)}
                      className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full border-2 border-white cursor-pointer hover:scale-110 transition-transform"
                    />
                    
                    <div
                      onMouseDown={(e) => startConnection(node.id, e)}
                      className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-secondary rounded-full border-2 border-white cursor-pointer hover:scale-110 transition-transform"
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="col-span-3">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              {selectedNode ? 'Свойства узла' : 'Выберите узел'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedNode ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium mb-1 block">Название</label>
                  <Input
                    type="text"
                    value={selectedNode.data.label || ''}
                    onChange={(e) => updateNodeData('label', e.target.value)}
                    placeholder="Название узла"
                    className="text-sm"
                  />
                </div>

                {(selectedNode.type === 'message' || selectedNode.type === 'question') && (
                  <div>
                    <label className="text-xs font-medium mb-1 block">Текст</label>
                    <Textarea
                      value={selectedNode.data.text || ''}
                      onChange={(e) => updateNodeData('text', e.target.value)}
                      placeholder="Введите текст сообщения"
                      className="text-sm min-h-[100px]"
                    />
                  </div>
                )}

                {selectedNode.type === 'question' && (
                  <div>
                    <label className="text-xs font-medium mb-1 block">Варианты ответов</label>
                    {(selectedNode.data.options || []).map((opt, idx) => (
                      <div key={idx} className="flex gap-2 mb-2">
                        <Input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOptions = [...(selectedNode.data.options || [])];
                            newOptions[idx] = e.target.value;
                            updateNodeData('options', newOptions);
                          }}
                          placeholder={`Вариант ${idx + 1}`}
                          className="text-sm"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const newOptions = (selectedNode.data.options || []).filter((_, i) => i !== idx);
                            updateNodeData('options', newOptions);
                          }}
                          disabled={false}
                        >
                          <Icon name="X" size={14} />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => updateNodeData('options', [...(selectedNode.data.options || []), ''])}
                      disabled={false}
                    >
                      <Icon name="Plus" size={14} className="mr-1" />
                      Добавить вариант
                    </Button>
                  </div>
                )}

                {selectedNode.type === 'api' && (
                  <div>
                    <label className="text-xs font-medium mb-1 block">URL</label>
                    <Input
                      type="text"
                      value={selectedNode.data.url || ''}
                      onChange={(e) => updateNodeData('url', e.target.value)}
                      placeholder="https://api.example.com"
                      className="text-sm"
                    />
                  </div>
                )}

                {selectedNode.type === 'delay' && (
                  <div>
                    <label className="text-xs font-medium mb-1 block">Задержка (сек)</label>
                    <Input
                      type="number"
                      value={selectedNode.data.delay || 1}
                      onChange={(e) => updateNodeData('delay', parseInt(e.target.value))}
                      className="text-sm"
                    />
                  </div>
                )}

                <Button
                  type="button"
                  variant="destructive"
                  className="w-full"
                  onClick={() => deleteNode(selectedNode.id)}
                  disabled={false}
                >
                  <Icon name="Trash2" size={14} className="mr-1" />
                  Удалить узел
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Icon name="MousePointerClick" className="mx-auto mb-2" size={32} />
                <p>Кликните на узел на холсте для редактирования</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdvancedVisualConstructor;