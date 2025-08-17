import { AdminLayout } from "@/components/admin/AdminLayout";
import { Table } from "@/components/Table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseQuery, useSupabaseMutation } from "@/hooks/use-supabase-query";
import { supabase } from "@/lib/supabase/client";
import { Loader2, Search, User as UserIcon, CheckCircle2, XCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { useAuth } from "@/lib/supabase/auth-context";
import { showError } from "@/utils/toast";
import { Badge } from "@/components/ui/badge";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: 'admin' | 'editor' | 'player' | 'captain';
  email: string;
}

const UsersAdmin = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { hasPermission, user: currentUser } = useAuth();

  // Utilizza la nuova Edge Function per recuperare gli utenti in modo sicuro
  const { data: profiles, isLoading, error, refetch } = useSupabaseQuery<Profile[]>(
    ['admin-users'],
    async () => {
      const { data, error } = await supabase.functions.invoke('get-users');
      if (error) {
        // Se l'errore è di autorizzazione, mostriamo un messaggio specifico
        if (error instanceof Error && error.message.includes('401')) {
          throw new Error("Non hai i permessi per visualizzare gli utenti.");
        }
        throw error;
      }
      return data;
    },
    { 
      enabled: hasPermission(['admin']),
      retry: false // Non ritentare in caso di errore di autorizzazione
    }
  );

  const updateRoleMutation = useSupabaseMutation<Profile>(
    ['admin-users'],
    async ({ id, role }: { id: string; role: Profile['role'] }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    {
      onSuccess: () => {
        refetch(); // Ricarica la lista degli utenti per visualizzare le modifiche
      },
      onError: (err) => {
        showError(`Errore nell'aggiornamento del ruolo: ${err.message}`);
      }
    }
  );

  const filteredProfiles = useMemo(() => {
    if (!profiles || !searchTerm) return profiles;
    
    return profiles.filter(profile => 
      (profile.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.role.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [profiles, searchTerm]);

  const handleRoleChange = async (profileId: string, newRole: Profile['role']) => {
    if (!currentUser || currentUser.id === profileId && newRole !== 'admin') {
      showError("Non puoi declassare il tuo stesso account da amministratore.");
      return;
    }
    await updateRoleMutation.mutateAsync({ id: profileId, role: newRole });
  };

  const columns = [
    { key: "name", label: "Nome" },
    { key: "email", label: "Email" },
    { key: "role", label: "Ruolo" },
    { key: "actions", label: "Azioni" },
  ];

  const data = filteredProfiles?.map(profile => ({
    name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'N/A',
    email: profile.email,
    role: (
      <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
        {profile.role}
      </Badge>
    ),
    actions: (
      <Select
        value={profile.role}
        onValueChange={(newRole: Profile['role']) => handleRoleChange(profile.id, newRole)}
        disabled={updateRoleMutation.isPending || !hasPermission(['admin']) || (currentUser?.id === profile.id)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Seleziona ruolo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="editor">Editor</SelectItem>
          <SelectItem value="captain">Capitano</SelectItem>
          <SelectItem value="player">Giocatore</SelectItem>
        </SelectContent>
      </Select>
    ),
  })) || [];

  if (!hasPermission(['admin'])) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-4">Accesso Negato</h1>
          <p className="text-muted-foreground">Non hai i permessi necessari per accedere a questa pagina.</p>
        </div>
      </AdminLayout>
    );
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Errore nel caricamento degli utenti</p>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Gestione Utenti</h1>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Cerca utenti per nome, email o ruolo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredProfiles && (
        <div className="mb-4 text-sm text-muted-foreground">
          {filteredProfiles.length} utent{filteredProfiles.length === 1 ? 'e' : 'i'} 
          {searchTerm && ` trovati per "${searchTerm}"`}
        </div>
      )}
      <Table columns={columns} data={data} />
    </AdminLayout>
  );
};

export default UsersAdmin;