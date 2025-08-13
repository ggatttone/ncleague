import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate, useParams } from "react-router-dom";
import { useCreateArticle, useUpdateArticle, useArticle } from "@/hooks/use-articles";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";

const articleSchema = z.object({
  title: z.string().min(1, "Il titolo è obbligatorio"),
  slug: z.string().min(1, "Lo slug è obbligatorio"),
  content: z.string().optional(),
  cover_image_url: z.string().url("URL non valido").optional().or(z.literal('')),
  status: z.enum(['draft', 'published']),
});

type ArticleFormData = z.infer<typeof articleSchema>;

const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Sostituisci spazi con -
    .replace(/[^\w\-]+/g, '')       // Rimuovi caratteri non validi
    .replace(/\-\-+/g, '-')         // Sostituisci multipli - con uno solo
    .replace(/^-+/, '')             // Rimuovi - dall'inizio
    .replace(/-+$/, '');            // Rimuovi - dalla fine
};

const ArticleFormAdmin = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isEdit = Boolean(id);

  const { data: article, isLoading: articleLoading } = useArticle(id);
  const createMutation = useCreateArticle();
  const updateMutation = useUpdateArticle();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    watch,
    setValue
  } = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      status: 'draft'
    }
  });

  const titleValue = watch("title");

  useEffect(() => {
    if (titleValue) {
      setValue("slug", generateSlug(titleValue));
    }
  }, [titleValue, setValue]);

  useEffect(() => {
    if (article && isEdit) {
      reset(article);
    }
  }, [article, isEdit, reset]);

  const onSubmit = async (data: ArticleFormData) => {
    if (!user) return;

    const submissionData = {
      ...data,
      author_id: user.id,
      published_at: data.status === 'published' && !article?.published_at 
        ? new Date().toISOString() 
        : article?.published_at,
    };

    if (isEdit && id) {
      await updateMutation.mutateAsync({ id, ...submissionData });
    } else {
      await createMutation.mutateAsync(submissionData);
    }
    navigate("/admin/articles");
  };

  if (articleLoading && isEdit) {
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
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">
          {isEdit ? "Modifica articolo" : "Nuovo articolo"}
        </h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="title">Titolo *</Label>
            <Input id="title" {...register("title")} placeholder="Titolo dell'articolo" autoFocus />
            {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <Label htmlFor="slug">Slug *</Label>
            <Input id="slug" {...register("slug")} placeholder="verra-generato-automaticamente" />
            {errors.slug && <p className="text-sm text-destructive mt-1">{errors.slug.message}</p>}
          </div>

          <div>
            <Label htmlFor="content">Contenuto</Label>
            <Textarea id="content" {...register("content")} placeholder="Scrivi il tuo articolo qui..." rows={15} />
          </div>

          <div>
            <Label htmlFor="cover_image_url">URL Immagine di Copertina</Label>
            <Input id="cover_image_url" {...register("cover_image_url")} placeholder="https://..." type="url" />
            {errors.cover_image_url && <p className="text-sm text-destructive mt-1">{errors.cover_image_url.message}</p>}
          </div>

          <div>
            <Label htmlFor="status">Stato</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Seleziona stato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Bozza</SelectItem>
                    <SelectItem value="published">Pubblicato</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={() => navigate("/admin/articles")} disabled={isSubmitting}>
              Annulla
            </Button>
            <Button type="submit" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
              {(isSubmitting || createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Salva modifiche" : "Crea articolo"}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default ArticleFormAdmin;