import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { CATEGORIES, filterModels } from './constants';

interface ModelsReferenceTabProps {
  onSelectModel: (modelName: string) => void;
  onSwitchToGenerator: () => void;
}

const ModelsReferenceTab = ({ onSelectModel, onSwitchToGenerator }: ModelsReferenceTabProps) => {
  const [category, setCategory] = useState('all');
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

  const filteredModels = filterModels(category);

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map(cat => (
          <Button
            key={cat.id}
            variant={category === cat.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategory(cat.id)}
            className={category === cat.id
              ? 'bg-violet-600 hover:bg-violet-500 text-white'
              : 'border-white/10 text-white/50 hover:text-white hover:bg-white/5'}
          >
            <Icon name={cat.icon} size={14} className="mr-1.5" />
            {cat.name}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredModels.map(model => (
          <Card
            key={model.id}
            className={`bg-white/[0.03] border-white/10 cursor-pointer transition-all hover:border-violet-500/30 hover:bg-white/[0.05] ${expandedModel === model.id ? 'border-violet-500/40 bg-white/[0.05]' : ''}`}
            onClick={() => setExpandedModel(expandedModel === model.id ? null : model.id)}
          >
            <CardContent className="pt-5">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl">{model.icon}</span>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-base">{model.name}</h3>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <Badge variant="outline" className="border-white/10 text-white/50 text-[10px]">{model.type}</Badge>
                    <Badge variant="outline" className="border-white/10 text-white/50 text-[10px]">{model.lang}</Badge>
                    <Badge variant="outline" className="border-cyan-500/20 text-cyan-300/70 text-[10px]">{model.speed}</Badge>
                  </div>
                </div>
                <Icon name={expandedModel === model.id ? "ChevronUp" : "ChevronDown"} size={18} className="text-white/30" />
              </div>

              <p className="text-white/50 text-sm mb-2">{model.description}</p>
              <p className="text-white/40 text-xs">
                <span className="text-violet-300/70 font-medium">Лучше всего для:</span> {model.bestFor}
              </p>

              {expandedModel === model.id && (
                <div className="mt-4 pt-4 border-t border-white/5 space-y-4 animate-in slide-in-from-top-2">
                  <div>
                    <h4 className="text-white/70 text-sm font-medium mb-2 flex items-center gap-1.5">
                      <Icon name="Target" size={13} className="text-violet-400" />
                      Советы по промтам
                    </h4>
                    <ul className="space-y-1.5">
                      {model.promptTips.map((tip, i) => (
                        <li key={i} className="text-white/45 text-sm flex items-start gap-2">
                          <span className="text-violet-400 mt-0.5">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-white/70 text-sm font-medium mb-2 flex items-center gap-1.5">
                      <Icon name="MessageSquare" size={13} className="text-cyan-400" />
                      Примеры промтов
                    </h4>
                    <div className="space-y-1.5">
                      {model.examples.map((ex, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-black/30 border border-white/5 text-white/50 text-xs font-mono">
                          {ex}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectModel(model.name);
                      onSwitchToGenerator();
                    }}
                    className="bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/20"
                  >
                    <Icon name="ArrowRight" size={14} className="mr-1.5" />
                    Создать промт для {model.name}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
};

export default ModelsReferenceTab;
