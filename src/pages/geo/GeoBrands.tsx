import { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { geoApi, GeoBrand } from '@/lib/geo/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

export default function GeoBrands() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['geo-brands'],
    queryFn: () => geoApi.brands.list(),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GeoBrand | null>(null);

  const createMut = useMutation({
    mutationFn: geoApi.brands.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['geo-brands'] });
      setOpen(false);
      toast({ title: 'Бренд добавлен' });
    },
    onError: (e: Error) => toast({ title: 'Ошибка', description: e.message, variant: 'destructive' }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...data }: { id: string; name: string; aliases: string[]; is_own: boolean }) =>
      geoApi.brands.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['geo-brands'] });
      setEditing(null);
      toast({ title: 'Сохранено' });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => geoApi.brands.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['geo-brands'] });
      toast({ title: 'Бренд удалён' });
    },
  });

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get('name') || '').trim();
    const aliases = String(fd.get('aliases') || '').split(',').map(s => s.trim()).filter(Boolean);
    const is_own = fd.get('is_own') === 'on';
    if (!name) return;
    if (editing) {
      updateMut.mutate({ id: editing.id, name, aliases, is_own });
    } else {
      createMut.mutate({ name, aliases, is_own });
    }
  };

  const brands = data?.brands || [];
  const ownExists = brands.some(b => b.is_own);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Бренды</h1>
          <p className="text-slate-500 mt-1">Свой бренд и конкуренты для отслеживания</p>
        </div>
        <Dialog open={open || !!editing} onOpenChange={(v) => { if (!v) { setOpen(false); setEditing(null); } }}>
          <DialogTrigger asChild>
            <Button onClick={() => setOpen(true)}>
              <Icon name="Plus" size={16} className="mr-2" />
              Добавить бренд
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Редактировать бренд' : 'Новый бренд'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Название</Label>
                <Input id="name" name="name" defaultValue={editing?.name || ''} required placeholder="Например: Tinkoff" />
              </div>
              <div>
                <Label htmlFor="aliases">Альтернативные названия (через запятую)</Label>
                <Input id="aliases" name="aliases" defaultValue={editing?.aliases.join(', ') || ''} placeholder="Тинькофф, T-Bank" />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="is_own" name="is_own" defaultChecked={editing?.is_own || (!ownExists && !editing)} />
                <Label htmlFor="is_own" className="cursor-pointer">Это мой бренд</Label>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
                  {editing ? 'Сохранить' : 'Добавить'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-slate-500">Загрузка…</div>
      ) : brands.length === 0 ? (
        <div className="bg-white border rounded-2xl p-12 text-center">
          <Icon name="Tag" size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Пока нет брендов. Добавьте свой и 3–5 конкурентов.</p>
        </div>
      ) : (
        <div className="bg-white border rounded-2xl divide-y">
          {brands.map((b) => (
            <div key={b.id} className="flex items-center gap-4 p-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${b.is_own ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                <Icon name={b.is_own ? 'Crown' : 'Tag'} size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{b.name}</span>
                  {b.is_own && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">мой</span>}
                </div>
                {b.aliases.length > 0 && (
                  <div className="text-xs text-slate-500 truncate">также: {b.aliases.join(', ')}</div>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setEditing(b)}>
                <Icon name="Pencil" size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm(`Удалить бренд «${b.name}»?`)) deleteMut.mutate(b.id);
                }}
              >
                <Icon name="Trash2" size={16} className="text-rose-500" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
