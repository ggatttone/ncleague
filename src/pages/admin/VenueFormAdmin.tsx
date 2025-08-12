import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNavigate, useParams } from "react-router-dom";
import { useCreateVenue, useUpdateVenue, useVenue } from "@/hooks/use-venues";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

const venueSchema = z.object({
  name: z.string().min(1, "Il nome del campo è obbligatorio"),
  address: z.string().optional(),
  city: z.string().optional(),
});

type VenueFormData = z.infer<typeof venueSchema>;

const VenueFormAdmin = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { data: venue, isLoading: venueLoading } = useVenue(id);
  const createVenueMutation = useCreateVenue();
  const updateVenueMutation = useUpdateVenue();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<VenueFormData>({
    resolver: zodResolver(venueSchema),
  });

  useEffect(() => {
    if (venue && isEdit) {
      reset(venue);
    }
  }, [venue, isEdit, reset]);

  const onSubmit = async (data: VenueFormData) => {
    try {
      if (isEdit && id) {
        await updateVenueMutation.mutateAsync({ id, ...data });
      } else {
        await createVenueMutation.mutateAsync(data);
      }
      navigate("/admin/venues");
    } catch (error) {
      console.error("Error saving venue:", error);
    }
  };

  if (venueLoading && isEdit) {
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
          {isEdit ? "Modifica campo" : "Nuovo campo"}
        </h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome campo *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Nome del campo"
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="address">Indirizzo</Label>
            <Input
              id="address"
              {...register("address")}
              placeholder="Via, numero civico"
            />
          </div>

          <div>
            <Label htmlFor="city">Città</Label>
            <Input
              id="city"
              {...register("city")}
              placeholder="Città"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => navigate("/admin/venues")}
              disabled={isSubmitting}
            >
              Annulla
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || createVenueMutation.isPending || updateVenueMutation.isPending}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Salva modifiche" : "Crea campo"}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default VenueFormAdmin;