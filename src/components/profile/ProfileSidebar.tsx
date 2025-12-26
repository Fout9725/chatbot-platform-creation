import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface ProfileSidebarProps {
  name: string;
  email: string;
  avatar?: string;
  onChangeAvatar: () => void;
  onLogout: () => void;
}

export function ProfileSidebar({ name, email, avatar, onChangeAvatar, onLogout }: ProfileSidebarProps) {
  return (
    <Card className="md:col-span-1">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <Avatar className="w-24 h-24">
            <AvatarImage src={avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} />
            <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-lg">{name}</h3>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
          <Button 
            type="button" 
            disabled={false} 
            variant="outline" 
            className="w-full"
            onClick={onChangeAvatar}
          >
            <Icon name="Upload" size={16} className="mr-2" />
            Изменить фото
          </Button>
          <Button 
            type="button" 
            disabled={false}
            variant="destructive" 
            className="w-full"
            onClick={onLogout}
          >
            <Icon name="LogOut" size={16} className="mr-2" />
            Выйти
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
