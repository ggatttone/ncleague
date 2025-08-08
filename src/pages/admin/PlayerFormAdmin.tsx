import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { showSuccess } from "@/utils/toast";

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
            showSuccess(isEdit ? "Giocatore aggiornato con successo!" : "Giocatore creato con successo!");
            navigate("/admin/players");
          }}
        >
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="player-name">Nome</label>
            <Input id="player-name" placeholder="Nome" required autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="player-surname">Cognome</label>
            <Input id="player-surname" placeholder="Cognome" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="player-dob">Data di nascita</label>
            <Input id="player-dob" type="date" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="player-role">Ruolo</label>
            <Input id="player-role" placeholder="Es: Portiere, Difensore..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="player-number">Numero maglia</label>
            <Input id="player-number" type="number" min={1} max={99} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="player-doc">Documento (opzionale)</label>
            <Input id="player-doc" placeholder="ID documento" />
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