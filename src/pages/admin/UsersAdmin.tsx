import { AdminLayout } from "@/components/admin/AdminLayout";
import { Table } from "@/components/Table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSupabaseQuery, useSupabaseMutation } from "@/hooks/use-supabase-query";
import { supabase } from "@/lib/supabase/client";
import { Loader2, Search, XCircle, ChevronDown, MoreVertical } from "lucide-react";
import { useState, useMemo } from "react";
import { useAuth } from "@/lib/supabase/auth-context";
import { showError, showSuccess } from "@/utils/toast";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { AdminMobileCard } from "@/components/admin/AdminMobileCard";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FunctionsError } from "@supabase/supabase-js";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: 'admin' | 'editor' | 'player' | 'captain';
  email: string;
  status: 'active' | 'blocked';
}

const UsersAdmin = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { hasPermission, user: currentUser } = useAuth();
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: profiles, isLoading, error } = useSupabaseQuery<Profile[], FunctionsError>(
    ['admin-users'],
    () => supabase.functions.invoke('get-users'),
    { 
      enabled: hasPermission(['admin']),
      retry: false
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
      onError: (err) => {
        showError(`Errore nell'aggiornamento del ruolo: ${err.message}`);
      }
    }
  );

  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: 'block' | 'unblock' }) => {
      const { data, error } = await supabase.functions.invoke('update-user-status', {
        body: { userId, action },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess('Stato utente aggiornato con successo!');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: any) => {
      showError(`Errore: ${err.message}`);
    },
  });

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
      showError(t('pages.admin.users.demoteError'));
      return;
    }
    await updateRoleMutation.mutateAsync({ id: profileId, role: newRole });
  };

  const handleStatusChange = (profileId: string, currentStatus: 'active' | 'blocked') => {
    const action = currentStatus === 'active' ? 'block' : 'unblock';
    updateUserStatusMutation.mutate({ userId: profileId, action });
  };

  const columns = [
    { key: "name", label: t('pages.admin.users.table.name') },
    { key: "email", label: t('pages.admin.users.table.email') },
    { key: "role", label: t('pages.admin.users.table.role') },
    { key: "status", label: t('pages.admin.users.table.status') },
    { key: "actions", label: t('pages.admin.users.table.actions') },
  ];

  const data = filteredProfiles?.map(profile => ({
    name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'N/A',
    email: profile.email,
    role: (
      <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
        {t(`roles.${profile.role}`)}
      </Badge>
    ),
    status: (
      <Badge variant={profile.status === 'blocked' ? 'destructive' : 'outline'} className="capitalize">
        {t(`userStatus.${profile.status}`)}
      </Badge>
    ),
    actions: (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={currentUser?.id === profile.id}>
            {t('pages.admin.users.actionsButton')} <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t('pages.admin.users.changeRoleLabel')}</DropdownMenuLabel>
          {['admin', 'editor', 'captain', 'player'].map(role => (
            <DropdownMenuItem key={role} onSelect={() => handleRoleChange(profile.id, role as Profile['role'])} disabled={profile.role === role}>
              {t(`roles.${role}`)}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => handleStatusChange(profile.id, profile.status)}
            className={profile.status === 'active' ? 'text-destructive focus:text-destructive' : ''}
            disabled={updateUserStatusMutation.isPending}
          >
            {profile.status === 'active' ? t('pages.admin.users.blockUser') : t('pages.admin.users.unblockUser')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  })) || [];

  if (!hasPermission(['admin'])) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-4">{t('pages.admin.users.accessDeniedTitle')}</h1>
          <p className="text-muted-foreground">{t('pages.admin.users.accessDeniedDescription')}</p>
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
          <p className="text-red-600 mb-4">{t('pages.admin.users.errorLoading')}</p>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </AdminLayout>
    );
  }

  const renderMobileList = () => (
    <div className="space-y-4">
      {filteredProfiles?.map(profile => {
        const actions = (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={currentUser?.id === profile.id}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('pages.admin.users.changeRoleLabel')}</DropdownMenuLabel>
              {['admin', 'editor', 'captain', 'player'].map(role => (
                <DropdownMenuItem key={role} onSelect={() => handleRoleChange(profile.id, role as Profile['role'])} disabled={profile.role === role}>
                  {t(`roles.${role}`)}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => handleStatusChange(profile.id, profile.status)}
                className={profile.status === 'active' ? 'text-destructive focus:text-destructive' : ''}
                disabled={updateUserStatusMutation.isPending}
              >
                {profile.status === 'active' ? t('pages.admin.users.blockUser') : t('pages.admin.users.unblockUser')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
        return (
          <AdminMobileCard
            key={profile.id}
            title={`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'N/A'}
            subtitle={profile.email}
            actions={actions}
          >
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                {t(`roles.${profile.role}`)}
              </Badge>
              <Badge variant={profile.status === 'blocked' ? 'destructive' : 'outline'} className="capitalize">
                {t(`userStatus.${profile.status}`)}
              </Badge>
            </div>
          </AdminMobileCard>
        );
      })}
    </div>
  );

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">{t('pages.admin.users.title')}</h1>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t('pages.admin.users.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredProfiles && (
        <div className="mb-4 text-sm text-muted-foreground">
          {t('pages.admin.users.usersFound', { count: filteredProfiles.length })}
          {searchTerm && ` per "${searchTerm}"`}
        </div>
      )}
      {isMobile ? renderMobileList() : <Table columns={columns} data={data} />}
    </AdminLayout>
  );
};

export default UsersAdmin;