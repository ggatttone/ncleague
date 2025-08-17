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

const SponsorsAdmin = () => {
  const { data: sponsors, isLoading, error } = useAllSponsors();
  const deleteSponsorMutation = useDeleteSponsor();

  const handleDelete = async (id: string) => {
    await deleteSponsorMutation.mutateAsync(id);
  };

  const columns = [
    { key: "name", label: "Nome" },
    { key: "team", label: "Squadra" },
    { key: "website", label: "Sito Web" },
    { key: "actions", label: "Azioni" },
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
              <AlertDialogTitle>Elimina sponsor</AlertDialogTitle>
              <AlertDialogDescription>
                Sei sicuro di voler eliminare lo sponsor "{sponsor.name}"? Questa azione non può essere annullata.
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

  if (error) return <AdminLayout><div className="text-center py-12"><p className="text-red-600">Errore: {error.message}</p></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Sponsor</h1>
        <Link to="/admin/sponsors/new"><Button className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" />Nuovo Sponsor</Button></Link>
      </div>
      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div> : <Table columns={columns} data={data} />}
    </AdminLayout>
  );
};

export default SponsorsAdmin;