import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Loader2 } from 'lucide-react';
import { showError, showLoading, dismissToast } from '@/utils/toast';
import heic2any from 'heic2any';

interface ImageUploaderProps {
  bucketName: string;
  currentImageUrl?: string | null;
  onUploadSuccess: (url: string) => void;
  label?: string;
}

export const ImageUploader = ({ bucketName, currentImageUrl, onUploadSuccess, label = "Immagine" }: ImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    let conversionToastId: string | undefined;
    try {
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Devi selezionare un file da caricare.');
      }

      let file = event.target.files[0];
      const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');

      setUploading(true);

      if (isHeic) {
        conversionToastId = showLoading('Conversione immagine HEIC in corso...');
        try {
          const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.8,
          });
          const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpeg');
          file = new File([convertedBlob as Blob], newFileName, { type: 'image/jpeg' });
          if (conversionToastId) dismissToast(conversionToastId);
        } catch (heicError) {
          if (conversionToastId) dismissToast(conversionToastId);
          showError('Impossibile convertire il file HEIC. Prova a convertirlo manualmente in JPEG.');
          setUploading(false);
          return;
        }
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(filePath);
      
      if (!publicUrl) {
        throw new Error("Impossibile ottenere l'URL pubblico dell'immagine.");
      }

      onUploadSuccess(publicUrl);

    } catch (error: any) {
      if (conversionToastId) dismissToast(conversionToastId);
      showError(error.message);
    } finally {
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
          <Input id="single" type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
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