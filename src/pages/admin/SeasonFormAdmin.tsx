import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNavigate, useParams } from "react-router-dom";
import { useCreateSeason, useUpdateSeason, useSeason } from "@/hooks/use-seasons";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const seasonSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio"),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

type SeasonFormData = z.infer<typeof seasonSchema>;

const SeasonFormAdmin = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { t } = useTranslation();

  const { data: season, isLoading: seasonLoading } = useSeason(id);
  const createMutation = useCreateSeason();
  const updateMutation = useUpdateSeason();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<SeasonFormData>({
    resolver: zodResolver(seasonSchema),
  });

  useEffect(() => {
    if (season && isEdit) {
      reset({
        ...season,
        start_date: season.start_date ? season.start_date.split('T')[0] : '',
        end_date: season.end_date ? season.end_date.split('T')[0] : '',
      });
    }
  }, [season, isEdit, reset]);

  const onSubmit = async (data: SeasonFormData) => {
    if (isEdit && id) {
      await updateMutation.mutateAsync({ id, ...data });
    } else {
      await createMutation.mutateAsync(data);
    }
    navigate("/admin/seasons");
  };

  if (seasonLoading && isEdit) {
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
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">
          {isEdit ? t('pages.admin.seasonForm.editTitle') : t('pages.admin.seasonForm.newTitle')}
        </h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">{t('pages.admin.seasonForm.nameLabel')}</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder={t('pages.admin.seasonForm.namePlaceholder')}
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">{t('pages.admin.seasonForm.startDateLabel')}</Label>
              <Input
                id="start_date"
                type="date"
                {...register("start_date")}
              />
            </div>
            <div>
              <Label htmlFor="end_date">{t('pages.admin.seasonForm.endDateLabel')}</Label>
              <Input
                id="end_date"
                type="date"
                {...register("end_date")}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => navigate("/admin/seasons")}
              disabled={isSubmitting}
            >
              Annulla
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
            >
              {(isSubmitting || createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Salva modifiche" : "Crea stagione"}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default SeasonFormAdmin;