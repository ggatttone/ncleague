import { useTheme, useUpdateTheme } from '@/hooks/use-theme';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { showSuccess } from '@/utils/toast';
import { useTranslation } from 'react-i18next';

const themeSchema = z.object({
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Formato colore non valido (es. #RRGGBB)"),
  secondary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Formato colore non valido (es. #RRGGBB)"),
  font_family: z.string(),
  logo_url: z.string().url("URL non valido").optional().nullable(),
});

type ThemeFormData = z.infer<typeof themeSchema>;

const availableFonts = [
  "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", "Oswald"
];

const ThemeAdmin = () => {
  const { data: theme, isLoading: themeLoading } = useTheme();
  const updateThemeMutation = useUpdateTheme();
  const { t } = useTranslation();

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    setValue,
    watch,
  } = useForm<ThemeFormData>({
    resolver: zodResolver(themeSchema),
  });

  const logoUrlValue = watch('logo_url');

  useEffect(() => {
    if (theme) {
      reset({
        ...theme,
        primary_color: theme.primary_color || '#09090b',
        secondary_color: theme.secondary_color || '#64748b',
        font_family: theme.font_family || 'Inter',
      });
    }
  }, [theme, reset]);

  const onSubmit = async (data: ThemeFormData) => {
    await updateThemeMutation.mutateAsync(data, {
      onSuccess: () => {
        showSuccess("Tema aggiornato con successo!");
      }
    });
  };

  if (themeLoading) {
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{t('pages.admin.theme.title')}</h1>
          <Button type="submit" disabled={isSubmitting || updateThemeMutation.isPending}>
            {(isSubmitting || updateThemeMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('pages.admin.theme.saveButton')}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('pages.admin.theme.colorsCardTitle')}</CardTitle>
                <CardDescription>
                  {t('pages.admin.theme.colorsCardDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="primary_color">{t('pages.admin.theme.primaryColorLabel')}</Label>
                  <Controller
                    name="primary_color"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={field.value || ''}
                          onChange={field.onChange}
                          className="p-1 h-10 w-14"
                        />
                        <Input
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="#000000"
                        />
                      </div>
                    )}
                  />
                  {errors.primary_color && <p className="text-sm text-destructive mt-1">{errors.primary_color.message}</p>}
                </div>
                <div>
                  <Label htmlFor="secondary_color">{t('pages.admin.theme.secondaryColorLabel')}</Label>
                  <Controller
                    name="secondary_color"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={field.value || ''}
                          onChange={field.onChange}
                          className="p-1 h-10 w-14"
                        />
                        <Input
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="#64748b"
                        />
                      </div>
                    )}
                  />
                  {errors.secondary_color && <p className="text-sm text-destructive mt-1">{errors.secondary_color.message}</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('pages.admin.theme.typographyCardTitle')}</CardTitle>
                <CardDescription>
                  {t('pages.admin.theme.typographyCardDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Label htmlFor="font_family">{t('pages.admin.theme.fontFamilyLabel')}</Label>
                <Controller
                  name="font_family"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('pages.admin.theme.fontPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFonts.map(font => (
                          <SelectItem key={font} value={font}>{font}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>{t('pages.admin.theme.logoCardTitle')}</CardTitle>
                <CardDescription>
                  {t('pages.admin.theme.logoCardDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUploader
                  bucketName="logos"
                  currentImageUrl={logoUrlValue}
                  onUploadSuccess={(url) => setValue('logo_url', url, { shouldValidate: true, shouldDirty: true })}
                  label={t('pages.admin.theme.logoFileLabel')}
                />
                {errors.logo_url && <p className="text-sm text-destructive mt-1">{errors.logo_url.message}</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
};

export default ThemeAdmin;