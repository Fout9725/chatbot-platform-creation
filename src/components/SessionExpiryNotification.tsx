import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function SessionExpiryNotification() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout } = useAuth();

  useEffect(() => {
    const handleSessionExpired = () => {
      logout();
      toast({
        title: 'Срок действия сессии истек',
        description: 'Пожалуйста, авторизуйтесь заново для продолжения работы',
        variant: 'destructive',
        duration: 5000,
      });
      navigate('/');
    };

    window.addEventListener('session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('session-expired', handleSessionExpired);
    };
  }, [logout, navigate, toast]);

  return null;
}
