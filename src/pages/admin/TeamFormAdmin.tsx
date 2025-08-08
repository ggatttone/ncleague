import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";

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
            // Placeholder: qui chiamata API
            navigate("/admin/teams");
          }}
        >
          <div>
            <label className="block text-sm font-medium mb-1">Nome squadra</label>
            <Input placeholder="Nome squadra" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Parrocchia</label>
            <Input placeholder="Parrocchia" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Colori sociali</label>
            <Input placeholder="Es: Blu/Bianco" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Campo</label>
            <Input placeholder="Campo di gioco" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Logo (URL)</label>
            <Input placeholder="https://..." type="url" />
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