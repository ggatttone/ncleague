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

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: 'admin' | 'editor' | 'player' | 'captain';
  email: string; // Assuming email can be fetched or joined
}

const UsersAdmin = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { hasPermission, user: currentUser } = useAuth();

  // Fetch profiles and join with auth.users for email
  const { data: profiles, isLoading, error, refetch } = useSupabaseQuery<Profile[]>(
    ['profiles'],
    async () => {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('last_name');

      if (profilesError) throw profilesError;

      // Fetch user emails from auth.users for display
      const userIds = profilesData.map(p => p.id);
      const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 100, // Adjust as needed, or implement pagination
      });

      if (usersError) {
        console.error("Error fetching users for emails:", usersError);
        // Proceed without emails if there's an error fetching them
        return profilesData.map(profile => ({
          ...profile,
          email: 'N/A'
        }));
      }

      const userMap = new Map(usersData.users.map(u => [u.id, u.email]));

      return profilesData.map(profile => ({
        ...profile,
        email: userMap.get(profile.id) || 'N/A'
      }));
    },
    { enabled: hasPermission(['admin']) } // Only fetch if current user is admin
  );

  const updateRoleMutation = useSupabaseMutation<Profile>(
    ['profiles'],
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
        refetch(); // Re-fetch profiles to update the list
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
      <Badge variant="secondary" className="capitalize">
        {profile.role}
      </Badge>
    ),
    actions: (
      <Select
        value={profile.role}
        onValueChange={(newRole: Profile['role']) => handleRoleChange(profile.id, newRole)}
        disabled={updateRoleMutation.isPending || !hasPermission(['admin']) || (currentUser?.id === profile.id && profile.role === 'admin' && newRole !== 'admin')}
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Gestione Utenti</h1>
      </div>

      {/* Search */}
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

      {filteredProfiles && filteredProfiles.length > 0 && (
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