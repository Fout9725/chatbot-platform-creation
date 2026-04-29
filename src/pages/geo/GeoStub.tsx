import Icon from '@/components/ui/icon';

export default function GeoStub({ title, icon, sprint }: { title: string; icon: string; sprint: string }) {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">{title}</h1>
      <p className="text-slate-500 mb-8">Раздел в разработке</p>

      <div className="bg-white rounded-2xl border p-12 text-center">
        <div className="inline-flex w-16 h-16 rounded-2xl bg-slate-100 items-center justify-center mb-4">
          <Icon name={icon} size={32} className="text-slate-500" />
        </div>
        <h2 className="text-lg font-semibold mb-1">Скоро здесь будет полный функционал</h2>
        <p className="text-slate-500 text-sm">Запланировано на {sprint}</p>
      </div>
    </div>
  );
}
