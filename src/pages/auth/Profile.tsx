import { useAuth } from "@/lib/supabase/auth-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { showSuccess, showError } from "@/utils/toast";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

const profileSchema = z.object({
  first_name: z.string().min(1, "Il nome è obbligatorio"),
  last_name: z.string().min(1, "Il cognome è obbligatorio"),
});

const passwordSchema = z.object({
  password: z.string().min(6, "La password deve essere di almeno 6 caratteri"),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const ProfilePage = () => {
  const { user, profile, loading, signOut } = useAuth();

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
      });
    }
  }, [profile, profileForm.reset]);

  const handleProfileUpdate = async (data: ProfileFormData) => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ first_name: data.first_name, last_name: data.last_name, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (error) {
      showError(error.message);
    } else {
      showSuccess("Profilo aggiornato con successo!");
    }
  };

  const handlePasswordUpdate = async (data: PasswordFormData) => {
    const { error } = await supabase.auth.updateUser({ password: data.password });
    if (error) {
      showError(error.message);
    } else {
      showSuccess("Password aggiornata con successo! Sarai disconnesso per sicurezza.");
      passwordForm.reset();
      setTimeout(() => {
        signOut();
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Il mio profilo</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Informazioni personali</CardTitle>
          <CardDescription>Aggiorna il tuo nome e cognome.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">Nome</Label>
                <Input id="first_name" {...profileForm.register("first_name")} />
                {profileForm.formState.errors.first_name && (
                  <p className="text-sm text-destructive mt-1">{profileForm.formState.errors.first_name.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="last_name">Cognome</Label>
                <Input id="last_name" {...profileForm.register("last_name")} />
                {profileForm.formState.errors.last_name && (
                  <p className="text-sm text-destructive mt-1">{profileForm.formState.errors.last_name.message}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ""} disabled />
            </div>
            <Button type="submit" disabled={profileForm.formState.isSubmitting}>
              {profileForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salva modifiche
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cambia password</CardTitle>
          <CardDescription>Scegli una nuova password sicura. Verrai disconnesso dopo la modifica.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)} className="space-y-4">
            <div>
              <Label htmlFor="password">Nuova password</Label>
              <Input id="password" type="password" {...passwordForm.register("password")} />
              {passwordForm.formState.errors.password && (
                <p className="text-sm text-destructive mt-1">{passwordForm.formState.errors.password.message}</p>
              )}
            </div>
            <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
              {passwordForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Aggiorna password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;