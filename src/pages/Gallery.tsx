import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { useAlbums, useUpdateAlbum } from "@/hooks/use-albums";
import { useGalleryItems } from "@/hooks/use-gallery";
import { useAuth } from "@/lib/supabase/auth-context";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Image as ImageIcon, Folder } from "lucide-react";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { useQueryClient } from "@tanstack/react-query";
import heic2any from "heic2any";

const uploadSchema = z.object({
  album_id: z.string().optional().nullable(),
  file: z.instanceof(FileList)
    .refine(files => files.length > 0, "È richiesto almeno un file.")
    .refine(files => files.length <= 10, "Puoi caricare un massimo di 10 file alla volta."),
});

type UploadFormData = z.infer<typeof uploadSchema>;

const GalleryPage = () => {
  const { user } = useAuth();
  const { data: albums, isLoading: albumsLoading, error: albumsError } = useAlbums();
  const { data: allItems, isLoading: itemsLoading, error: itemsError } = useGalleryItems();
  const updateAlbumMutation = useUpdateAlbum();
  const [isUploadOpen, setUploadOpen] = useState(false);
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, control } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
  });

  const onUploadSubmit = async (data: UploadFormData) => {
    if (!user || data.file.length === 0) return;

    let conversionToastId: string | number | undefined;
    try {
      const initialFiles = Array.from(data.file);
      const failedConversions: string[] = [];
      
      const hasHeic = initialFiles.some(file => 
        file.type === 'image/heic' || 
        file.type === 'image/heif' || 
        file.name.toLowerCase().endsWith('.heic') || 
        file.name.toLowerCase().endsWith('.heif')
      );

      if (hasHeic) {
        conversionToastId = showLoading('Conversione immagini HEIC in corso...');
      }

      const filesToUpload = await Promise.all(
        initialFiles.map(async (file) => {
          const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
          if (isHeic) {
            try {
              const convertedBlob = await heic2any({
                blob: file,
                toType: 'image/jpeg',
                quality: 0.8,
              });
              const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpeg');
              return new File([convertedBlob as Blob], newFileName, { type: 'image/jpeg' });
            } catch (heicError) {
              console.error(`Impossibile convertire ${file.name}:`, heicError);
              failedConversions.push(file.name);
              return null;
            }
          }
          return file;
        })
      );

      if (conversionToastId) {
        dismissToast(conversionToastId as string);
      }

      if (failedConversions.length > 0) {
        showError(`Impossibile convertire i seguenti file: ${failedConversions.join(', ')}. Saranno saltati.`);
      }

      const validFiles = filesToUpload.filter(file => file !== null) as File[];

      if (validFiles.length === 0) {
        if (failedConversions.length === 0) {
          showError('Nessun file valido da caricare.');
        }
        return;
      }

      const uploadPromises = validFiles.map(file => {
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}-${Math.random()}.${fileExt}`;
        return supabase.storage.from('gallery_media').upload(filePath, file).then(result => {
          if (result.error) throw result.error;
          return { file, filePath };
        });
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      const galleryItemsToInsert = uploadedFiles.map(({ file, filePath }) => ({
        user_id: user.id,
        album_id: data.album_id || null,
        file_path: filePath,
        file_name: file.name,
        mime_type: file.type,
        title: file.name,
      }));

      const { error: dbError } = await supabase.from('gallery_items').insert(galleryItemsToInsert);
      if (dbError) throw dbError;

      if (data.album_id) {
        const targetAlbum = albums?.find(a => a.id === data.album_id);
        const firstImage = uploadedFiles.find(({ file }) => file.type.startsWith('image/'));
        if (targetAlbum && !targetAlbum.cover_image_path && firstImage) {
          await updateAlbumMutation.mutateAsync({ id: data.album_id, cover_image_path: firstImage.filePath });
        }
      }

      showSuccess(`${uploadedFiles.length} file caricati con successo!`);
      queryClient.invalidateQueries({ queryKey: ['gallery-items'] });
      queryClient.invalidateQueries({ queryKey: ['albums'] });
      reset();
      setUploadOpen(false);
    } catch (err: any) {
      if (conversionToastId) {
        dismissToast(conversionToastId as string);
      }
      showError(`Errore durante il caricamento: ${err.message}`);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Galleria</h1>
          {user && (
            <>
              <Button onClick={() => setUploadOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Carica Media
              </Button>
              <Dialog open={isUploadOpen} onOpenChange={setUploadOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Carica nuovi media</DialogTitle>
                    <DialogDescription>
                      Puoi selezionare fino a 10 file (immagini o video) alla volta.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit(onUploadSubmit)} className="space-y-4">
                    <div>
                      <Label htmlFor="file">File *</Label>
                      <Input id="file" type="file" {...register("file")} accept="image/jpeg, image/png, image/webp, image/gif, video/*, .heic, .heif, image/heic, image/heif" multiple />
                      {errors.file && <p className="text-sm text-destructive mt-1">{errors.file.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="album_id">Album (opzionale)</Label>
                      <Controller
                        name="album_id"
                        control={control}
                        render={({ field }) => (
                          <Select
                            onValueChange={(value) => field.onChange(value === "no-album" ? null : value)}
                            value={field.value || "no-album"}
                          >
                            <SelectTrigger><SelectValue placeholder="Nessun album" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="no-album">Nessun album</SelectItem>
                              {albums?.map(album => <SelectItem key={album.id} value={album.id}>{album.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Carica
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>

        <Tabs defaultValue="albums" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="albums">Album</TabsTrigger>
            <TabsTrigger value="all-media">Tutti i Media</TabsTrigger>
          </TabsList>

          <TabsContent value="albums" className="mt-6">
            {albumsLoading && <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>}
            {albumsError && <p className="text-center text-destructive">Errore nel caricamento degli album.</p>}
            {!albumsLoading && albums && albums.length === 0 && (
              <div className="text-center py-20">
                <Folder className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold">Nessun album creato.</h2>
                <p className="text-muted-foreground mt-2">Crea il primo album per iniziare a organizzare la galleria.</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {albums?.map(album => {
                const publicURL = album.cover_image_path ? supabase.storage.from('gallery_media').getPublicUrl(album.cover_image_path).data.publicUrl : null;
                return (
                  <Link to={`/gallery/albums/${album.id}`} key={album.id}>
                    <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
                      <CardHeader className="p-0">
                        <div className="aspect-video bg-muted flex items-center justify-center">
                          {publicURL ? (
                            <img src={publicURL} alt={album.name} className="w-full h-full object-cover" />
                          ) : (
                            <Folder className="h-12 w-12 text-muted-foreground" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                        <CardTitle className="text-base font-semibold truncate">{album.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{album.item_count} elementi</p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="all-media" className="mt-6">
            {itemsLoading && <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>}
            {itemsError && <p className="text-center text-destructive">Errore nel caricamento dei media.</p>}
            {!itemsLoading && allItems && allItems.length === 0 && (
              <div className="text-center py-20">
                <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold">Nessun media caricato.</h2>
                <p className="text-muted-foreground mt-2">Carica la tua prima immagine o video.</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {allItems?.map(item => {
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
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default GalleryPage;