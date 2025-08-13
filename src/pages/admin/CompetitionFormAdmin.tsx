import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNavigate, useParams } from "react-router-dom";
import { useCreateCompetition, useUpdateCompetition, useCompetition } from "@/hooks/use-competitions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

const competitionSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio"),
  slug: z.string().optional(),
  level: z.coerce.number().optional(),
});

type CompetitionFormData = z.infer<typeof competitionSchema>;

const CompetitionFormAdmin = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { data: competition, isLoading: competitionLoading } = useCompetition(id);
  const createMutation = useCreateCompetition();
  const updateMutation = useUpdateCompetition();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<CompetitionFormData>({
    resolver: zodResolver(competitionSchema),
  });

  useEffect(() => {
    if (competition && isEdit) {
      reset(competition);
    }
  }, [competition, isEdit, reset]);

  const onSubmit = async (data: CompetitionFormData) => {
    if (isEdit && id) {
      await updateMutation.mutateAsync({ id, ...data });
    } else {
      await createMutation.mutateAsync(data);
    }
    navigate("/admin/competitions");
  };

  if (competitionLoading && isEdit) {
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
          {isEdit ? "Modifica competizione" : "Nuova competizione"}
        </h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Es: Serie A"
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              {...register("slug")}
              placeholder="Es: serie-a (generato se vuoto)"
            />
          </div>

          <div>
            <Label htmlFor="level">Livello</Label>
            <Input
              id="level"
              type="number"
              {...register("level")}
              placeholder="Es: 1 (per ordinamento)"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => navigate("/admin/competitions")}
              disabled={isSubmitting}
            >
              Annulla
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
            >
              {(isSubmitting || createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Salva modifiche" : "Crea competizione"}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default CompetitionFormAdmin;