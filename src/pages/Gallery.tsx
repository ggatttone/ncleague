import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MainLayout } from "@/components/MainLayout";
import { useGalleryItems, useDeleteGalleryItem } from "@/hooks/use-gallery";
import { useAuth } from "@/lib/supabase/auth-context";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { useQueryClient } from "@tanstack/react-query";

const uploadSchema = z.object({
  title: z.string().min(1, "Il titolo è obbligatorio"),
  description: z.string().optional(),
  file: z.instanceof(FileList).refine(files => files.length > 0, "È richiesto un file."),
});

type UploadFormData = z.infer<typeof uploadSchema>;

const GalleryPage = () => {
  const { user, hasPermission } = useAuth();
  const { data: items, isLoading, error } = useGalleryItems();
  const deleteItemMutation = useDeleteGalleryItem();
  const [isUploadOpen, setUploadOpen] = useState(false);
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
  });

  const onUploadSubmit = async (data: UploadFormData) => {
    if (!user) return;
    const file = data.file[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('gallery_media')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from('gallery_items').insert({
        user_id: user.id,
        file_path: filePath,
        file_name: file.name,
        mime_type: file.type,
        title: data.title,
        description: data.description,
      });
      if (dbError) throw dbError;

      showSuccess("Immagine caricata con successo!");
      queryClient.invalidateQueries({ queryKey: ['gallery-items'] });
      reset();
      setUploadOpen(false);
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleDelete = (item: any) => {
    deleteItemMutation.mutate(item);
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Galleria</h1>
          {user && (
            <Dialog open={isUploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Carica Immagine
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Carica un nuovo media</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onUploadSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Titolo *</Label>
                    <Input id="title" {...register("title")} />
                    {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="description">Descrizione</Label>
                    <Textarea id="description" {...register("description")} />
                  </div>
                  <div>
                    <Label htmlFor="file">File *</Label>
                    <Input id="file" type="file" {...register("file")} accept="image/*,video/*" />
                    {errors.file && <p className="text-sm text-destructive mt-1">{errors.file.message}</p>}
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
          )}
        </div>

        {isLoading && <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>}
        {error && <p className="text-center text-destructive">Errore nel caricamento della galleria.</p>}
        
        {!isLoading && items && items.length === 0 && (
          <div className="text-center py-20">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">La galleria è vuota.</h2>
            <p className="text-muted-foreground mt-2">Carica la prima immagine per iniziare.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items?.map(item => {
            const publicURL = supabase.storage.from('gallery_media').getPublicUrl(item.file_path).data.publicUrl;
            const canDelete = user?.id === item.user_id || hasPermission(['admin']);
            return (
              <Card key={item.id} className="overflow-hidden group">
                <CardHeader className="p-0">
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    {item.mime_type?.startsWith('image/') ? (
                      <img src={publicURL} alt={item.title || ''} className="w-full h-full object-cover" />
                    ) : (
                      <video src={publicURL} className="w-full h-full object-cover" controls />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="text-base font-semibold truncate">{item.title}</CardTitle>
                  <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  {canDelete && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(item)}
                      disabled={deleteItemMutation.isPending}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Elimina
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
};

export default GalleryPage;