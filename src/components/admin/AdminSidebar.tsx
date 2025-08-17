import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";

const adminLinks = [
  { to: "/admin/teams", label: "Squadre", roles: ['admin', 'editor', 'captain'] },
  { to: "/admin/players", label: "Giocatori", roles: ['admin', 'editor', 'captain'] },
  { to: "/admin/fixtures", label: "Calendario", roles: ['admin', 'editor'] },
  { to: "/admin/competitions", label: "Competizioni", roles: ['admin', 'editor'] },
  { to: "/admin/seasons", label: "Stagioni", roles: ['admin', 'editor'] },
  { to: "/admin/venues", label: "Campi", roles: ['admin', 'editor'] },
  { to: "/admin/sponsors", label: "Sponsor", roles: ['admin', 'editor'] },
  { to: "/admin/honors", label: "Albo d'oro", roles: ['admin', 'editor'] },
  { to: "/admin/results", label: "Risultati", roles: ['admin', 'editor'] },
  { to: "/admin/articles", label: "Articoli", roles: ['admin', 'editor'] },
  { to: "/admin/albums", label: "Album Galleria", roles: ['admin', 'editor'] },
  { to: "/admin/event", label: "Gestione Evento", roles: ['admin'] },
  { to: "/admin/penalties", label: "Penalità", roles: ['admin'] },
  { to: "/admin/audit-log", label: "Audit Log", roles: ['admin'] },
  { to: "/admin/users", label: "Gestione Utenti", roles: ['admin'] },
  { to: "/admin/theme", label: "Aspetto", roles: ['admin'] },
];

/**
 * This component renders the content of the admin sidebar.
 * The responsive layout logic (static on desktop, sheet on mobile) is handled in AdminLayout.
 */
export const AdminSidebar = ({ onLinkClick }: { onLinkClick?: () => void }) => {
  const location = useLocation();
  const { hasPermission } = useAuth();

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-sidebar-border">
        <Link to="/admin" className="flex items-center gap-2" onClick={onLinkClick}>
          <Shield className="h-6 w-6 text-sidebar-primary" />
          <span className="font-bold text-lg text-sidebar-primary">Admin NC League</span>
        </Link>
      </div>
      <nav className="flex-1 px-4 py-4">
        <ul className="space-y-2">
          {adminLinks.map((link) => (
            hasPermission(link.roles as any) && (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={cn(
                    "block px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    location.pathname.startsWith(link.to)
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  onClick={onLinkClick}
                >
                  {link.label}
                </Link>
              </li>
            )
          ))}
        </ul>
      </nav>
    </div>
  );
};