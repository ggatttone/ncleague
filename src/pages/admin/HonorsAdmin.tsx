import { AdminLayout } from "@/components/admin/AdminLayout";
import { Table } from "@/components/Table";
import { Button } from "@/components/ui/button";
import { useAllHonors, useDeleteHonor } from "@/hooks/use-honors";
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

const HonorsAdmin = () => {
  const { data: honors, isLoading, error } = useAllHonors();
  const deleteHonorMutation = useDeleteHonor();
  const isMobile = useIsMobile();

  const handleDelete = async (id: string) => {
    await deleteHonorMutation.mutateAsync(id);
  };

  const columns = [
    { key: "team", label: "Squadra" },
    { key: "achievement", label: "Risultato" },
    { key: "competition", label: "Competizione" },
    { key: "season", label: "Stagione" },
    { key: "actions", label: "Azioni" },
  ];

  const data = honors?.map(honor => ({
    team: honor.teams?.name || "-",
    achievement: honor.achievement,
    competition: honor.competitions?.name || "-",
    season: honor.seasons?.name || "-",
    actions: (
      <div className="flex items-center gap-2">
        <Link to={`/admin/honors/${honor.id}/edit`}>
          <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
        </Link>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Elimina trofeo</AlertDialogTitle>
              <AlertDialogDescription>Sei sicuro di voler eliminare questo risultato? L'azione non può essere annullata.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDelete(honor.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteHonorMutation.isPending}>
                {deleteHonorMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Elimina
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    ),
  })) || [];

  if (error) return <AdminLayout><div className="text-center py-12"><p className="text-red-600">Errore: {error.message}</p></div></AdminLayout>;

  const renderMobileList = () => (
    <div className="space-y-4">
      {honors?.map(honor => {
        const actions = (
          <>
            <Link to={`/admin/honors/${honor.id}/edit`}><Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button></Link>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Elimina trofeo</AlertDialogTitle><AlertDialogDescription>Sei sicuro di voler eliminare questo risultato?</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(honor.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteHonorMutation.isPending}>
                    {deleteHonorMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Elimina
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        );
        return (
          <AdminMobileCard
            key={honor.id}
            title={honor.achievement}
            subtitle={honor.teams?.name || "Squadra non specificata"}
            actions={actions}
          >
            <div className="mt-2 text-sm text-muted-foreground">
              {honor.competitions?.name} - {honor.seasons?.name}
            </div>
          </AdminMobileCard>
        );
      })}
    </div>
  );

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Albo d'Oro</h1>
        <Link to="/admin/honors/new"><Button className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" />Aggiungi Trofeo</Button></Link>
      </div>
      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
        isMobile ? renderMobileList() : <Table columns={columns} data={data} />
      )}
    </AdminLayout>
  );
};

export default HonorsAdmin;