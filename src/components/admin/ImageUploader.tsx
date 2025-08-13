import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Loader2 } from 'lucide-react';
import { showError } from '@/utils/toast';

interface ImageUploaderProps {
  bucketName: string;
  currentImageUrl?: string | null;
  onUploadSuccess: (url: string) => void;
  label?: string;
}

export const ImageUploader = ({ bucketName, currentImageUrl, onUploadSuccess, label = "Immagine" }: ImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null | undefined>(currentImageUrl);

  useEffect(() => {
    setImageUrl(currentImageUrl);
  }, [currentImageUrl]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Devi selezionare un file da caricare.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      setUploading(true);

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

      setImageUrl(publicUrl);
      onUploadSuccess(publicUrl);

    } catch (error: any) {
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
          <AvatarImage src={imageUrl || undefined} alt="Avatar" />
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