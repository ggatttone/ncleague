import { AdminLayout } from "@/components/admin/AdminLayout";
import { Table } from "@/components/Table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVenues, useDeleteVenue } from "@/hooks/use-venues";
import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { Search, Loader2, Plus, Edit, Trash2 } from "lucide-react";
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

const VenuesAdmin = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: venues, isLoading, error } = useVenues();
  const deleteVenueMutation = useDeleteVenue();

  const filteredVenues = useMemo(() => {
    if (!venues || !searchTerm) return venues;
    
    return venues.filter(venue => 
      venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.struttura?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [venues, searchTerm]);

  const handleDeleteVenue = async (venueId: string) => {
    await deleteVenueMutation.mutateAsync(venueId);
  };

  const columns = [
    { key: "name", label: "Nome" },
    { key: "struttura", label: "Struttura" },
    { key: "address", label: "Indirizzo" },
    { key: "city", label: "Città" },
    { key: "actions", label: "Azioni" },
  ];

  const data = filteredVenues?.map(venue => ({
    name: venue.name,
    struttura: venue.struttura || "-",
    address: venue.address || "-",
    city: venue.city || "-",
    actions: (
      <div className="flex items-center gap-2">
        <Link to={`/admin/venues/${venue.id}/edit`}>
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        </Link>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Elimina campo</AlertDialogTitle>
              <AlertDialogDescription>
                Sei sicuro di voler eliminare il campo "{venue.name}"? 
                Questa azione non può essere annullata.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteVenue(venue.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteVenueMutation.isPending}
              >
                {deleteVenueMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Elimina
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    ),
  })) || [];

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Errore nel caricamento dei campi</p>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Campi da Gioco</h1>
        <Link to="/admin/venues/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nuovo campo
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Cerca campi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <Table columns={columns} data={data} />
      )}
    </AdminLayout>
  );
};

export default VenuesAdmin;