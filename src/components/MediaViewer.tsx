import { Dialog, DialogContent } from "@/components/ui/dialog";
import { GalleryItem } from "@/types/database";
import { supabase } from "@/lib/supabase/client";

interface MediaViewerProps {
  item: GalleryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MediaViewer = ({ item, open, onOpenChange }: MediaViewerProps) => {
  if (!item) {
    return null;
  }

  const publicURL = supabase.storage.from('gallery_media').getPublicUrl(item.file_path).data.publicUrl;
  const isVideo = item.mime_type?.startsWith('video/');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 bg-transparent border-0 max-w-6xl w-auto h-auto max-h-[90vh] flex items-center justify-center">
        {isVideo ? (
          <video
            src={publicURL}
            className="max-w-full max-h-[90vh] object-contain"
            controls
            autoPlay
            playsInline
          />
        ) : (
          <img
            src={publicURL}
            alt={item.title || 'Media visualizzato'}
            className="max-w-full max-h-[90vh] object-contain"
          />
        )}
      </DialogContent>
    </Dialog>
  );
};