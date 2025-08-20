import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNavigate, useParams } from "react-router-dom";
import { useCreateAlbum, useUpdateAlbum, useAlbum } from "@/hooks/use-albums";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import { useTranslation } from "react-i18next";

const albumSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio"),
  description: z.string().optional(),
});

type AlbumFormData = z.infer<typeof albumSchema>;

const AlbumFormAdmin = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isEdit = Boolean(id);
  const { t } = useTranslation();

  const { data: album, isLoading: albumLoading } = useAlbum(id);
  const createMutation = useCreateAlbum();
  const updateMutation = useUpdateAlbum();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<AlbumFormData>({
    resolver: zodResolver(albumSchema),
  });

  useEffect(() => {
    if (album && isEdit) {
      reset(album);
    }
  }, [album, isEdit, reset]);

  const onSubmit = async (data: AlbumFormData) => {
    if (!user) return;

    if (isEdit && id) {
      await updateMutation.mutateAsync({ id, ...data });
    } else {
      await createMutation.mutateAsync({ ...data, user_id: user.id });
    }
    navigate("/admin/albums");
  };

  if (albumLoading && isEdit) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">
          {isEdit ? t('pages.admin.albumForm.editTitle') : t('pages.admin.albumForm.newTitle')}
        </h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">{t('pages.admin.albumForm.nameLabel')}</Label>
            <Input id="name" {...register("name")} autoFocus />
            {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="description">{t('pages.admin.albumForm.descriptionLabel')}</Label>
            <Textarea id="description" {...register("description")} />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={() => navigate("/admin/albums")} disabled={isSubmitting}>
              Annulla
            </Button>
            <Button type="submit" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
              {(isSubmitting || createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Salva modifiche" : "Crea album"}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AlbumFormAdmin;