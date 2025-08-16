import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { supabase } from "@/lib/supabase/client";
import { GalleryItem } from "@/types/database";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Image as ImageIcon } from "lucide-react";

export const MediaCarousel = () => {
  const { data: items, isLoading } = useSupabaseQuery<GalleryItem[]>(
    ['latest-gallery-items'],
    async () => supabase
      .from('gallery_items')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 bg-muted rounded-lg mb-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!items || items.length === 0) {
    // Non mostrare nulla se non ci sono media, per non appesantire la homepage
    return null;
  }

  return (
    <div className="mb-12">
       <h2 className="text-3xl font-bold mb-6 text-center">Ultimi Media Caricati</h2>
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {items.map((item) => {
            const publicURL = supabase.storage.from('gallery_media').getPublicUrl(item.file_path).data.publicUrl;
            return (
              <CarouselItem key={item.id} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <Card className="overflow-hidden">
                    <CardContent className="flex aspect-video items-center justify-center p-0 bg-muted">
                      {item.mime_type?.startsWith('video/') ? (
                        <video src={publicURL} className="w-full h-full object-cover" controls playsInline />
                      ) : (
                        <img src={publicURL} alt={item.title || ''} className="w-full h-full object-cover" />
                      )}
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex" />
        <CarouselNext className="hidden sm:flex" />
      </Carousel>
    </div>
  );
};