import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const FixtureDetailsAdmin = () => {
  const navigate = useNavigate();
  
  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Dettaglio Partita</h1>
          <Button onClick={() => navigate("/admin/fixtures/1/edit")}>
            Modifica
          </Button>
        </div>
        
        <div className="bg-card rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-center">
              <div className="text-xl font-bold">FC Example</div>
              <div className="text-muted-foreground">Casa</div>
            </div>
            <div className="text-3xl font-bold">2 - 1</div>
            <div className="text-center">
              <div className="text-xl font-bold">FC Test</div>
              <div className="text-muted-foreground">Ospite</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-semibold">Data e ora</div>
              <div>15 Maggio 2024, 20:30</div>
            </div>
            <div>
              <div className="font-semibold">Campo</div>
              <div>Campo A</div>
            </div>
            <div>
              <div className="font-semibold">Stato</div>
              <div className="text-green-600">Completata</div>
            </div>
            <div>
              <div className="font-semibold">Arbitro</div>
              <div>Mario Rossi</div>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Marcatori</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <div>⚽ Marco Bianchi (FC Example) - 23'</div>
              <Button variant="link" size="sm" className="text-destructive">Elimina</Button>
            </div>
            <div className="flex justify-between">
              <div>⚽ Luca Verdi (FC Example) - 45'</div>
              <Button variant="link" size="sm" className="text-destructive">Elimina</Button>
            </div>
            <div className="flex justify-between">
              <div>⚽ Giovanni Neri (FC Test) - 78'</div>
              <Button variant="link" size="sm" className="text-destructive">Elimina</Button>
            </div>
          </div>
          
          <Button variant="outline" className="mt-4">
            + Aggiungi marcatore
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default FixtureDetailsAdmin;