import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";

const PlayerFormAdmin = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Placeholder: in futuro caricare dati se id presente
  const isEdit = Boolean(id);

  return (
    <AdminLayout>
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">
          {isEdit ? "Modifica giocatore" : "Nuovo giocatore"}
        </h1>
        <form
          className="space-y-4"
          onSubmit={e => {
            e.preventDefault();
            // Placeholder: qui chiamata API
            navigate("/admin/players");
          }}
        >
          <div>
            <label className="block text-sm font-medium mb-1">Nome</label>
            <Input placeholder="Nome" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cognome</label>
            <Input placeholder="Cognome" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Data di nascita</label>
            <Input type="date" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ruolo</label>
            <Input placeholder="Es: Portiere, Difensore..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Numero maglia</label>
            <Input type="number" min={1} max={99} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Documento (opzionale)</label>
            <Input placeholder="ID documento" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={() => navigate("/admin/players")}>
              Annulla
            </Button>
            <Button type="submit">{isEdit ? "Salva modifiche" : "Crea giocatore"}</Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default PlayerFormAdmin;