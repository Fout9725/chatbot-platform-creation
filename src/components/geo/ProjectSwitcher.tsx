import { useState, useRef, useEffect, FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useGeoProject } from '@/contexts/GeoProjectContext';
import { geoApi } from '@/lib/geo/api';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

export default function ProjectSwitcher() {
  const qc = useQueryClient();
  const { projects, current, currentId, switchProject, reload } = useGeoProject();
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const createMut = useMutation({
    mutationFn: (data: { name: string; description?: string }) => geoApi.projects.create(data),
    onSuccess: async (r) => {
      await reload();
      switchProject(r.project.id);
      qc.invalidateQueries({ predicate: (q) => String(q.queryKey[0] || '').startsWith('geo-') });
      setCreateOpen(false);
      toast({ title: 'Проект создан', description: `«${r.project.name}» — добавьте бренд и запросы` });
    },
    onError: (e: Error) => toast({ title: 'Ошибка', description: e.message, variant: 'destructive' }),
  });

  const onCreate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get('name') || '').trim();
    if (!name) return;
    createMut.mutate({ name, description: String(fd.get('description') || '').trim() || undefined });
  };

  return (
    <div className="px-3 pb-1" ref={menuRef}>
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:border-indigo-300 transition text-left"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Icon name="Briefcase" size={14} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-400 leading-none mb-0.5">Проект</div>
            <div className="text-sm font-medium truncate">{current?.name || 'Загрузка…'}</div>
          </div>
          <Icon name="ChevronsUpDown" size={14} className="text-slate-400 flex-shrink-0" />
        </button>

        {open && (
          <div className="absolute z-30 left-0 right-0 mt-1 bg-white border rounded-xl shadow-lg overflow-hidden">
            <div className="max-h-64 overflow-y-auto py-1">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { switchProject(p.id); setOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 transition ${
                    p.id === currentId ? 'bg-indigo-50' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate flex items-center gap-1.5">
                      {p.name}
                      {p.is_default && <span className="text-[9px] bg-slate-100 text-slate-500 px-1 rounded">основной</span>}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {p.own_brand ? `Бренд: ${p.own_brand}` : 'Бренд не задан'} · {p.queries_count} запр.
                    </div>
                  </div>
                  {p.id === currentId && <Icon name="Check" size={15} className="text-indigo-600 flex-shrink-0" />}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setCreateOpen(true); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-indigo-600 hover:bg-indigo-50 border-t font-medium"
            >
              <Icon name="Plus" size={15} />
              Новый проект
            </button>
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый проект</DialogTitle>
          </DialogHeader>
          <form onSubmit={onCreate} className="space-y-4">
            <div>
              <Label htmlFor="proj-name">Название проекта / бренда</Label>
              <Input id="proj-name" name="name" required placeholder="Например: Бренд А" autoFocus />
            </div>
            <div>
              <Label htmlFor="proj-desc">Описание (необязательно)</Label>
              <Textarea id="proj-desc" name="description" rows={2} placeholder="Короткое описание проекта" />
            </div>
            <p className="text-xs text-slate-500">
              После создания добавьте в проект свой бренд, конкурентов и запросы — у каждого проекта своя
              аналитика и продвижение.
            </p>
            <DialogFooter>
              <Button type="submit" disabled={createMut.isPending}>
                {createMut.isPending ? (
                  <><Icon name="Loader2" size={14} className="mr-2 animate-spin" />Создаём…</>
                ) : (
                  <><Icon name="Plus" size={14} className="mr-2" />Создать проект</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
