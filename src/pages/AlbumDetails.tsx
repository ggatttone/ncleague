import { useParams, Link } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { useAlbum } from "@/hooks/use-albums";
import { useGalleryItemsByAlbum } from "@/hooks/use-gallery";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, Image as ImageIcon } from "lucide-react";

const AlbumDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { data: album, isLoading: albumLoading } = useAlbum(id);
  const { data: items, isLoading: itemsLoading } = useGalleryItemsByAlbum(id);

  const isLoading = albumLoading || itemsLoading;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!album) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Album non trovato</h1>
          <Link to="/gallery">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Torna alla galleria
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <Link to="/gallery" className="mb-6 inline-block">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tutti gli album
          </Button>
        </Link>
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{album.name}</h1>
          {album.description && <p className="text-muted-foreground mt-2 max-w-2xl">{album.description}</p>}
        </div>

        {items && items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map(item => {
              const publicURL = supabase.storage.from('gallery_media').getPublicUrl(item.file_path).data.publicUrl;
              return (
                <Card key={item.id} className="overflow-hidden group">
                  <CardContent className="p-0">
                    <div className="aspect-square bg-muted flex items-center justify-center">
                      {item.mime_type?.startsWith('video/') ? (
                        <video src={publicURL} className="w-full h-full object-contain" controls playsInline />
                      ) : (
                        <img src={publicURL} alt={item.title || ''} className="w-full h-full object-cover" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">Questo album è vuoto.</h2>
            <p className="text-muted-foreground mt-2">Nessun elemento è stato ancora aggiunto.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default AlbumDetails;