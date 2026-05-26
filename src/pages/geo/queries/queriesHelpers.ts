import { GeoQueryCategory, GeoQueryIntent } from '@/lib/geo/api';

export const CATEGORY_META: Record<GeoQueryCategory, { label: string; cls: string; icon: string; hint: string }> = {
  commercial:    { label: 'Коммерческий', cls: 'bg-emerald-100 text-emerald-700', icon: 'ShoppingCart', hint: 'Где купить / заказать / цена' },
  comparison:    { label: 'Сравнение',    cls: 'bg-violet-100 text-violet-700',   icon: 'GitCompareArrows', hint: 'X vs Y, рейтинг, что лучше' },
  informational: { label: 'Информационный', cls: 'bg-sky-100 text-sky-700',       icon: 'BookOpen', hint: 'Как выбрать / что это / обзор' },
  branded:       { label: 'Брендовый',    cls: 'bg-indigo-100 text-indigo-700',   icon: 'Sparkles', hint: 'Содержит имя бренда' },
  navigational:  { label: 'Навигационный', cls: 'bg-slate-100 text-slate-700',    icon: 'Compass', hint: 'Сайт / контакты / войти' },
  local:         { label: 'Локальный',    cls: 'bg-amber-100 text-amber-700',     icon: 'MapPin', hint: 'Привязка к городу/региону' },
  other:         { label: 'Другой',       cls: 'bg-slate-100 text-slate-600',     icon: 'Tag', hint: 'Не классифицирован' },
};

export const INTENT_META: Record<GeoQueryIntent, { label: string }> = {
  buy:     { label: 'Купить' },
  compare: { label: 'Сравнить' },
  choose:  { label: 'Выбрать' },
  learn:   { label: 'Узнать' },
  find:    { label: 'Найти' },
  review:  { label: 'Отзывы' },
  other:   { label: 'Другое' },
};

export const FOCUS_OPTIONS: Array<{ id: 'all' | 'commercial' | 'comparison' | 'informational' | 'branded'; label: string; emoji: string; hint: string }> = [
  { id: 'all',           label: 'Микс',           emoji: '🎯', hint: 'Сбалансированный набор' },
  { id: 'commercial',    label: 'Коммерческие',   emoji: '🛒', hint: 'Где купить, заказать' },
  { id: 'comparison',    label: 'Сравнения',      emoji: '⚖️', hint: 'X vs Y, рейтинг' },
  { id: 'informational', label: 'Информационные', emoji: '📚', hint: 'Как выбрать, инструкции' },
  { id: 'branded',       label: 'Брендовые',      emoji: '✨', hint: 'Отзывы, обзоры, аналоги' },
];

export function formatDate(s: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(s: string | null): string {
  if (!s) return 'не опрашивался';
  const diff = Date.now() - new Date(s).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч назад`;
  return `${Math.floor(h / 24)} дн назад`;
}
