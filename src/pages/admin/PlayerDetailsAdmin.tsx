import { AdminLayout } from "@/components/admin/AdminLayout";
import { EntityCard } from "@/components/EntityCard";

const PlayerDetailsAdmin = () => (
  <AdminLayout>
    <EntityCard
      title="Mario Rossi"
      subtitle="Portiere | FC Example"
      imageUrl="https://placehold.co/80x80"
    >
      <div className="mt-2">
        <div className="text-sm">Data nascita: 01-01-1990</div>
        <div className="text-sm">Stato: Attivo</div>
      </div>
    </EntityCard>
  </AdminLayout>
);

export default PlayerDetailsAdmin;