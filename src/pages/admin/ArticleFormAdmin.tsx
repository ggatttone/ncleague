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
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

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
    .replace(/[^\w-]+/g, '')        // Rimuovi caratteri non validi
    .replace(/--+/g, '-')           // Sostituisci multipli - con uno solo
    .replace(/^-+/, '')             // Rimuovi - dall'inizio
    .replace(/-+$/, '');            // Rimuovi - dalla fine
};

const ArticleFormAdmin = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isEdit = Boolean(id);
  const { t } = useTranslation();

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
      status: 'draft',
      cover_image_url: '',
    }
  });

  const titleValue = watch("title");
  const coverImageUrlValue = watch('cover_image_url');

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
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">
            {isEdit ? t('pages.admin.articleForm.editTitle') : t('pages.admin.articleForm.newTitle')}
          </h1>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button type="button" variant="secondary" onClick={() => navigate("/admin/articles")} disabled={isSubmitting} className="w-full">
              Annulla
            </Button>
            <Button type="submit" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending} className="w-full">
              {(isSubmitting || createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Salva modifiche" : "Crea articolo"}
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main content column */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('pages.admin.articleForm.mainContent')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">{t('pages.admin.articleForm.titleLabel')}</Label>
                  <Input id="title" {...register("title")} placeholder={t('pages.admin.articleForm.titlePlaceholder')} autoFocus />
                  {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
                </div>

                <div>
                  <Label htmlFor="slug">{t('pages.admin.articleForm.slugLabel')}</Label>
                  <Input id="slug" {...register("slug")} placeholder={t('pages.admin.articleForm.slugPlaceholder')} readOnly className="bg-muted/50" />
                  {errors.slug && <p className="text-sm text-destructive mt-1">{errors.slug.message}</p>}
                </div>

                <div>
                  <Label htmlFor="content">{t('pages.admin.articleForm.contentLabel')}</Label>
                  <Textarea id="content" {...register("content")} placeholder={t('pages.admin.articleForm.contentPlaceholder')} rows={15} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar column for metadata */}
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('pages.admin.articleForm.publication')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Label htmlFor="status">{t('pages.admin.articleForm.statusLabel')}</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('pages.admin.articleForm.statusPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">{t('pages.admin.articles.status.draft')}</SelectItem>
                        <SelectItem value="published">{t('pages.admin.articles.status.published')}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('pages.admin.articleForm.coverImage')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUploader
                  bucketName="article-images"
                  currentImageUrl={coverImageUrlValue}
                  onUploadSuccess={(url) => setValue('cover_image_url', url, { shouldValidate: true, shouldDirty: true })}
                />
                {errors.cover_image_url && <p className="text-sm text-destructive mt-1">{errors.cover_image_url.message}</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
};

export default ArticleFormAdmin;