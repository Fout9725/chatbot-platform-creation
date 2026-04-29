/**
 * Список email-адресов единственного администратора платформы.
 * Только эти пользователи могут получить роль admin.
 * Telegram администратора — @Fou9725
 */
export const ADMIN_EMAILS: string[] = [
  's89624027661@yandex.ru',
  'fou9725@yandex.ru',
  'fou9725@gmail.com',
  'fou9725@telegram.org',
  '@fou9725',
];

export const ADMIN_TELEGRAM = '@Fou9725';

const norm = (v: string | undefined | null): string =>
  (v || '').trim().toLowerCase();

export const isAdminEmail = (email: string | undefined | null): boolean => {
  const e = norm(email);
  if (!e) return false;
  return ADMIN_EMAILS.some((a) => norm(a) === e);
};

interface UserLike {
  email?: string;
  role?: string;
}

export const isAdminUser = (user: UserLike | null | undefined): boolean => {
  if (!user) return false;
  if (!isAdminEmail(user.email)) return false;
  return user.role === 'admin';
};
