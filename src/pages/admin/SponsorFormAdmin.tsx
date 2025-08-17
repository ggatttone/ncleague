import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNavigate, useParams } from "react-router-dom";
import { useCreateSponsor, useUpdateSponsor, useSponsor } from "@/hooks/use-sponsors";
import { useTeams } from "@/hooks/use-teams";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const sponsorSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio"),
  team_id: z.string().min(1, "La squadra è obbligatoria"),
  logo_url: z.string().url("URL non valido").optional().nullable(),
  website_url: z.string().url("URL non valido").optional().nullable(),
});

type SponsorFormData = z.infer<typeof sponsorSchema>;

const SponsorFormAdmin = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { data: sponsor, isLoading: sponsorLoading } = useSponsor(id);
  const { data: teams, isLoading: teamsLoading } = useTeams();
  const createMutation = useCreateSponsor();
  const updateMutation = useUpdateSponsor();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    setValue,
    watch,
  } = useForm<SponsorFormData>({ resolver: zodResolver(sponsorSchema) });

  const logoUrlValue = watch('logo_url');

  useEffect(() => {
    if (sponsor && isEdit) reset(sponsor);
  }, [sponsor, isEdit, reset]);

  const onSubmit = async (data: SponsorFormData) => {
    if (isEdit && id) {
      await updateMutation.mutateAsync({ id, ...data });
    } else {
      await createMutation.mutateAsync(data);
    }
    navigate("/admin/sponsors");
  };

  if ((sponsorLoading || teamsLoading) && isEdit) return <AdminLayout><Loader2 className="h-8 w-8 animate-spin" /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">{isEdit ? "Modifica Sponsor" : "Nuovo Sponsor"}</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <ImageUploader bucketName="sponsor-logos" currentImageUrl={logoUrlValue} onUploadSuccess={(url) => setValue('logo_url', url, { shouldValidate: true })} label="Logo Sponsor" />
          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" {...register("name")} autoFocus />
            {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="team_id">Squadra *</Label>
            <Controller
              name="team_id"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} disabled={teamsLoading}>
                  <SelectTrigger><SelectValue placeholder="Seleziona una squadra" /></SelectTrigger>
                  <SelectContent>{teams?.map((team) => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}</SelectContent>
                </Select>
              )}
            />
            {errors.team_id && <p className="text-sm text-destructive mt-1">{errors.team_id.message}</p>}
          </div>
          <div>
            <Label htmlFor="website_url">Sito Web</Label>
            <Input id="website_url" {...register("website_url")} placeholder="https://..." />
            {errors.website_url && <p className="text-sm text-destructive mt-1">{errors.website_url.message}</p>}
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={() => navigate("/admin/sponsors")} disabled={isSubmitting}>Annulla</Button>
            <Button type="submit" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
              {(isSubmitting || createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Salva modifiche" : "Crea Sponsor"}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default SponsorFormAdmin;