import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AvatarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  avatarSeeds: string[];
  onSelectAvatar: (avatarUrl: string) => void;
}

export function AvatarDialog({ open, onOpenChange, avatarSeeds, onSelectAvatar }: AvatarDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Выберите аватар</DialogTitle>
          <DialogDescription>
            Выберите понравившийся аватар из галереи
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 py-4">
          {avatarSeeds.map((seed) => {
            const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
            return (
              <button
                key={seed}
                onClick={() => onSelectAvatar(avatarUrl)}
                className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <Avatar className="w-16 h-16">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback>{seed.slice(0, 2)}</AvatarFallback>
                </Avatar>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
