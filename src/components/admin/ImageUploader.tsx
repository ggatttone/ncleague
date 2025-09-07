import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Loader2 } from 'lucide-react';
import { showError, showLoading, dismissToast, showSuccess } from '@/utils/toast';
import { getOptimizedImageUrl } from '@/lib/image';

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
      const fileExt = file.name.split('.').pop();
      const filePath = `${Date.now()}.${fileExt}`;
      
      setUploading(true);
      uploadToastId = showLoading(`Caricamento di ${file.name}...`);

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      onUploadSuccess(publicUrl);
      showSuccess("Immagine caricata con successo!");

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
          <AvatarImage src={getOptimizedImageUrl(currentImageUrl, { width: 80, height: 80, resize: 'cover' })} alt="Avatar" />
          <AvatarFallback className="h-20 w-20">
            <User className="h-10 w-10" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Input id="single" type="file" accept="image/jpeg, image/png, image/webp, image/gif" onChange={handleUpload} disabled={uploading} />
          {uploading && (
            <div className="flex items-center gap-2 mt-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Caricamento...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};