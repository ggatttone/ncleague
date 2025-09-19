import { AdminLayout } from "@/components/admin/AdminLayout";
import { Table } from "@/components/Table";
import { Button } from "@/components/ui/button";
import { useTournamentModes, useDeleteTournamentMode } from "@/hooks/use-tournament-modes";
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

const TournamentModesAdmin = () => {
  const { data: modes, isLoading, error } = useTournamentModes();
  const deleteMutation = useDeleteTournamentMode();
  const isMobile = useIsMobile();

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const columns = [
    { key: "name", label: "Nome" },
    { key: "description", label: "Descrizione" },
    { key: "handler_key", label: "Handler" },
    { key: "actions", label: "Azioni" },
  ];

  const data = modes?.map(mode => ({
    name: mode.name,
    description: mode.description || "-",
    handler_key: <code className="text-sm">{mode.handler_key}</code>,
    actions: (
      <div className="flex items-center gap-2">
        <Link to={`/admin/tournament-modes/${mode.id}/edit`}>
          <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
        </Link>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
              <AlertDialogDescription>
                Questa azione non può essere annullata. Questo eliminerà permanentemente la modalità "{mode.name}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDelete(mode.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteMutation.isPending}>
                {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Elimina
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    ),
  })) || [];

  if (error) {
    return <AdminLayout><div className="text-center py-12"><p className="text-red-600">Errore nel caricamento: {error.message}</p></div></AdminLayout>;
  }

  const renderMobileList = () => (
    <div className="space-y-4">
      {modes?.map(mode => {
        const actions = (
          <>
            <Link to={`/admin/tournament-modes/${mode.id}/edit`}><Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button></Link>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Sei sicuro?</AlertDialogTitle><AlertDialogDescription>Questa azione eliminerà permanentemente la modalità "{mode.name}".</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(mode.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteMutation.isPending}>
                    {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Elimina
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        );
        return (
          <AdminMobileCard
            key={mode.id}
            title={mode.name}
            subtitle={mode.description}
            actions={actions}
          />
        );
      })}
    </div>
  );

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Modalità Torneo</h1>
        <Link to="/admin/tournament-modes/new">
          <Button className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" /> Nuova Modalità</Button>
        </Link>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        isMobile ? renderMobileList() : <Table columns={columns} data={data} />
      )}
    </AdminLayout>
  );
};

export default TournamentModesAdmin;