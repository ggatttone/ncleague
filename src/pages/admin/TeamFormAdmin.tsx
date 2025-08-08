import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { showSuccess } from "@/utils/toast";

const TeamFormAdmin = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Placeholder: in futuro caricare dati se id presente
  const isEdit = Boolean(id);

  return (
    <AdminLayout>
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">
          {isEdit ? "Modifica squadra" : "Nuova squadra"}
        </h1>
        <form
          className="space-y-4"
          onSubmit={e => {
            e.preventDefault();
            showSuccess(isEdit ? "Squadra aggiornata con successo!" : "Squadra creata con successo!");
            navigate("/admin/teams");
          }}
        >
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="team-name">Nome squadra</label>
            <Input id="team-name" placeholder="Nome squadra" required autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="team-parish">Parrocchia</label>
            <Input id="team-parish" placeholder="Parrocchia" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="team-colors">Colori sociali</label>
            <Input id="team-colors" placeholder="Es: Blu/Bianco" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="team-venue">Campo</label>
            <Input id="team-venue" placeholder="Campo di gioco" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="team-logo">Logo (URL)</label>
            <Input id="team-logo" placeholder="https://..." type="url" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={() => navigate("/admin/teams")}>
              Annulla
            </Button>
            <Button type="submit">{isEdit ? "Salva modifiche" : "Crea squadra"}</Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default TeamFormAdmin;