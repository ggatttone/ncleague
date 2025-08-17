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
import { ImageUploader } from "@/components/admin/ImageUploader";
import { GoogleMapEmbed } from "@/components/admin/GoogleMapEmbed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const venueSchema = z.object({
  name: z.string().min(1, "Il nome del campo è obbligatorio"),
  address: z.string().optional(),
  city: z.string().optional(),
  struttura: z.string().optional(),
  photo_url: z.string().url("URL non valido").optional().nullable(),
  lat: z.coerce.number().optional().nullable(),
  lon: z.coerce.number().optional().nullable(),
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
    reset,
    setValue,
    watch,
  } = useForm<VenueFormData>({
    resolver: zodResolver(venueSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      struttura: "",
      photo_url: null,
      lat: null,
      lon: null,
    }
  });

  const photoUrlValue = watch('photo_url');
  const latValue = watch('lat');
  const lonValue = watch('lon');

  useEffect(() => {
    if (venue && isEdit) {
      reset(venue);
    }
  }, [venue, isEdit, reset]);

  const onSubmit = async (data: VenueFormData) => {
    const submissionData = {
      ...data,
      lat: data.lat || null,
      lon: data.lon || null,
    };

    if (isEdit && id) {
      await updateVenueMutation.mutateAsync({ id, ...submissionData });
    } else {
      await createVenueMutation.mutateAsync(submissionData);
    }
    navigate("/admin/venues");
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
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">
            {isEdit ? "Modifica campo" : "Nuovo campo"}
          </h1>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button type="button" variant="secondary" onClick={() => navigate("/admin/venues")} disabled={isSubmitting} className="w-full">
              Annulla
            </Button>
            <Button type="submit" disabled={isSubmitting || createVenueMutation.isPending || updateVenueMutation.isPending} className="w-full">
              {(isSubmitting || createVenueMutation.isPending || updateVenueMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Salva modifiche" : "Crea campo"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Informazioni Principali</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome campo *</Label>
                  <Input id="name" {...register("name")} placeholder="Nome del campo" autoFocus />
                  {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="struttura">Struttura</Label>
                  <Input id="struttura" {...register("struttura")} placeholder="Es: Centro Sportivo, Palazzetto..." />
                </div>
                <div>
                  <Label htmlFor="address">Indirizzo</Label>
                  <Input id="address" {...register("address")} placeholder="Via, numero civico" />
                </div>
                <div>
                  <Label htmlFor="city">Città</Label>
                  <Input id="city" {...register("city")} placeholder="Città" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Posizione Geografica</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lat">Latitudine</Label>
                    <Input id="lat" type="number" step="any" {...register("lat")} placeholder="Es: 45.4642" />
                  </div>
                  <div>
                    <Label htmlFor="lon">Longitudine</Label>
                    <Input id="lon" type="number" step="any" {...register("lon")} placeholder="Es: 9.1900" />
                  </div>
                </div>
                <GoogleMapEmbed lat={latValue} lon={lonValue} />
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card>
              <CardHeader><CardTitle>Immagine</CardTitle></CardHeader>
              <CardContent>
                <ImageUploader
                  bucketName="venue-photos"
                  currentImageUrl={photoUrlValue}
                  onUploadSuccess={(url) => setValue('photo_url', url, { shouldValidate: true, shouldDirty: true })}
                  label="Foto della struttura"
                />
                {errors.photo_url && <p className="text-sm text-destructive mt-1">{errors.photo_url.message}</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
};

export default VenueFormAdmin;