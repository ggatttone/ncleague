import { AdminLayout } from "@/components/admin/AdminLayout";
import { Table } from "@/components/Table";
import { Button } from "@/components/ui/button";
import { useAllSponsors, useDeleteSponsor } from "@/hooks/use-sponsors";
import { Link } from "react-router-dom";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { AdminMobileCard } from "@/components/admin/AdminMobileCard";
import { useTranslation } from "react-i18next";

const SponsorsAdmin = () => {
  const { data: sponsors, isLoading, error } = useAllSponsors();
  const deleteSponsorMutation = useDeleteSponsor();
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  const handleDelete = async (id: string) => {
    await deleteSponsorMutation.mutateAsync(id);
  };

  const columns = [
    { key: "name", label: t('pages.admin.sponsors.table.name') },
    { key: "team", label: t('pages.admin.sponsors.table.team') },
    { key: "website", label: t('pages.admin.sponsors.table.website') },
    { key: "actions", label: t('pages.admin.sponsors.table.actions') },
  ];

  const data = sponsors?.map(sponsor => ({
    name: sponsor.name,
    team: sponsor.teams?.name || "-",
    website: sponsor.website_url ? <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer" className="underline">{sponsor.website_url}</a> : "-",
    actions: (
      <div className="flex items-center gap-2">
        <Link to={`/admin/sponsors/${sponsor.id}/edit`}>
          <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
        </Link>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('pages.admin.sponsors.deleteDialogTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('pages.admin.sponsors.deleteDialogDescription', { name: sponsor.name })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDelete(sponsor.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteSponsorMutation.isPending}>
                {deleteSponsorMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Elimina
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    ),
  })) || [];

  if (error) return <AdminLayout><div className="text-center py-12"><p className="text-red-600">{t('pages.admin.sponsors.errorLoading')}: {error.message}</p></div></AdminLayout>;

  const renderMobileList = () => (
    <div className="space-y-4">
      {sponsors?.map(sponsor => {
        const actions = (
          <>
            <Link to={`/admin/sponsors/${sponsor.id}/edit`}><Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button></Link>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>{t('pages.admin.sponsors.deleteDialogTitle')}</AlertDialogTitle><AlertDialogDescription>{t('pages.admin.sponsors.deleteDialogDescription', { name: sponsor.name })}</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(sponsor.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteSponsorMutation.isPending}>
                    {deleteSponsorMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Elimina
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        );
        return (
          <AdminMobileCard
            key={sponsor.id}
            title={sponsor.name}
            subtitle={sponsor.teams?.name || "Nessuna squadra"}
            actions={actions}
          />
        );
      })}
    </div>
  );

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">{t('pages.admin.sponsors.title')}</h1>
        <Link to="/admin/sponsors/new"><Button className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" />{t('pages.admin.sponsors.newSponsor')}</Button></Link>
      </div>
      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
        isMobile ? renderMobileList() : <Table columns={columns} data={data} />
      )}
    </AdminLayout>
  );
};

export default SponsorsAdmin;