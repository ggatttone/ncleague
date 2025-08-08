import { AdminLayout } from "@/components/admin/AdminLayout";
import { EntityCard } from "@/components/EntityCard";

const TeamDetailsAdmin = () => (
  <AdminLayout>
    <EntityCard
      title="FC Example"
      subtitle="Parrocchia: San Marco | Campo: Campo A"
      imageUrl="https://placehold.co/80x80"
    >
      <div className="mt-2">
        <div className="text-sm">Colori: Blu/Bianco</div>
        <div className="text-sm">Giocatori: 12</div>
      </div>
    </EntityCard>
    <div className="mt-8">
      <h3 className="font-semibold mb-2">Rosa</h3>
      <ul className="list-disc ml-6 text-sm">
        <li>Mario Rossi (Portiere)</li>
        <li>Luca Bianchi (Difensore)</li>
      </ul>
    </div>
  </AdminLayout>
);

export default TeamDetailsAdmin;