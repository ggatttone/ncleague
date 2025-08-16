import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Loader2 } from 'lucide-react';
import { showError, showLoading, dismissToast } from '@/utils/toast';

interface ImageUploaderProps {
  bucketName: string;
  currentImageUrl?: string | null;
  onUploadSuccess: (url: string) => void;
  label?: string;
}

export const ImageUploader = ({ bucketName, currentImageUrl, onUploadSuccess, label = "Immagine" }: ImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    let uploadToastId: string | number | undefined;
    try {
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Devi selezionare un file da caricare.');
      }

      const file = event.target.files[0];
      
      setUploading(true);
      uploadToastId = showLoading(`Caricamento di ${file.name}...`);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucketName', bucketName);

      const { data, error } = await supabase.functions.invoke('convert-and-upload-image', {
        body: formData,
      });

      if (error) {
        const errorMessage = error.context?.error?.message || error.message;
        throw new Error(errorMessage);
      }

      const { publicUrl } = data;

      if (!publicUrl) {
        throw new Error("Impossibile ottenere l'URL pubblico dell'immagine dopo la conversione.");
      }

      onUploadSuccess(publicUrl);

    } catch (error: any) {
      showError(`Errore: ${error.message}`);
    } finally {
      if (uploadToastId) dismissToast(uploadToastId as string);
      setUploading(false);
    }
  };

  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-4 mt-2">
        <Avatar className="h-20 w-20">
          <AvatarImage src={currentImageUrl || undefined} alt="Avatar" />
          <AvatarFallback className="h-20 w-20">
            <User className="h-10 w-10" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Input id="single" type="file" accept="image/jpeg, image/png, image/webp, image/gif, .heic, .heif, image/heic, image/heif" onChange={handleUpload} disabled={uploading} />
          {uploading && (
            <div className="flex items-center gap-2 mt-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Elaborazione...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};