import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, Trash2 } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { getInitials } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/lib/image';

interface AvatarUploaderProps {
  onUpload: (url: string | null) => void;
}

export const AvatarUploader = ({ onUpload }: AvatarUploaderProps) => {
  const { user, profile } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setAvatarUrl(profile?.avatar_url || null);
  }, [profile]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Devi selezionare un file da caricare.');
      }
      if (!user) {
        throw new Error('Utente non autenticato.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Math.random()}.${fileExt}`;

      // If an old avatar exists, find its path to remove it later
      let oldAvatarPath: string | null = null;
      if (profile?.avatar_url) {
          try {
              const url = new URL(profile.avatar_url);
              // The path is the part after '/avatars/'
              oldAvatarPath = url.pathname.split('/avatars/')[1];
          } catch (e) {
              console.error("Invalid old avatar URL", profile.avatar_url);
          }
      }

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // If upload is successful and an old avatar existed, remove it
      if (oldAvatarPath) {
          const { error: removeError } = await supabase.storage.from('avatars').remove([oldAvatarPath]);
          if (removeError) {
              console.error("Failed to remove old avatar:", removeError.message);
          }
      }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      setAvatarUrl(publicUrl);
      onUpload(publicUrl);
      showSuccess("Avatar aggiornato con successo!");

    } catch (error: any) {
      showError(`Errore: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !avatarUrl) return;
    try {
      setUploading(true);
      const url = new URL(avatarUrl);
      const filePath = url.pathname.split('/avatars/')[1];
      
      const { error } = await supabase.storage.from('avatars').remove([filePath]);
      if (error) throw error;
      
      setAvatarUrl(null);
      onUpload(null);
      showSuccess("Avatar rimosso.");
    } catch (error: any) {
      showError(`Errore nella rimozione: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-24 w-24">
        <AvatarImage src={getOptimizedImageUrl(avatarUrl, { width: 100, height: 100, resize: 'cover' })} alt="User avatar" />
        <AvatarFallback className="text-3xl">
          {getInitials(profile?.first_name, profile?.last_name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-2">
        <Button asChild size="sm" variant="outline" disabled={uploading}>
          <label htmlFor="avatar-upload" className="cursor-pointer">
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {uploading ? 'Caricamento...' : 'Cambia foto'}
          </label>
        </Button>
        <Input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
        {avatarUrl && (
          <Button size="sm" variant="ghost" className="text-destructive" onClick={handleDelete} disabled={uploading}>
            <Trash2 className="mr-2 h-4 w-4" />
            Rimuovi
          </Button>
        )}
      </div>
    </div>
  );
};