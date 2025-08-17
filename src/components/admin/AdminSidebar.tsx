import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";

const adminMenuConfig = [
  {
    category: "Gestione Lega",
    links: [
      { to: "/admin", label: "Dashboard", roles: ['admin', 'editor', 'captain'], exact: true },
      { to: "/admin/teams", label: "Squadre", roles: ['admin', 'editor', 'captain'] },
      { to: "/admin/players", label: "Giocatori", roles: ['admin', 'editor', 'captain'] },
      { to: "/admin/fixtures", label: "Calendario e Risultati", roles: ['admin', 'editor'] },
      { to: "/admin/competitions", label: "Competizioni", roles: ['admin', 'editor'] },
      { to: "/admin/seasons", label: "Stagioni", roles: ['admin', 'editor'] },
      { to: "/admin/venues", label: "Campi da Gioco", roles: ['admin', 'editor'] },
      { to: "/admin/sponsors", label: "Sponsor", roles: ['admin', 'editor'] },
      { to: "/admin/honors", label: "Albo d'Oro", roles: ['admin', 'editor'] },
      // Le seguenti voci non hanno ancora una pagina, quindi sono commentate
      // { to: "/admin/results", label: "Risultati", roles: ['admin', 'editor'] },
      // { to: "/admin/penalties", label: "Penalità", roles: ['admin'] },
    ]
  },
  {
    category: "Gestione Contenuti",
    links: [
      { to: "/admin/articles", label: "Articoli", roles: ['admin', 'editor'] },
      { to: "/admin/albums", label: "Galleria", roles: ['admin', 'editor'] },
    ]
  },
  {
    category: "Configurazione Sito",
    links: [
      { to: "/admin/homepage", label: "Layout Homepage", roles: ['admin', 'editor'] },
      { to: "/admin/theme", label: "Aspetto", roles: ['admin'] },
      { to: "/admin/event", label: "Evento Countdown", roles: ['admin'] },
    ]
  },
  {
    category: "Amministrazione",
    links: [
      { to: "/admin/users", label: "Gestione Utenti", roles: ['admin'] },
      // { to: "/admin/audit-log", label: "Audit Log", roles: ['admin'] },
    ]
  }
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
      <nav className="flex-1 px-4 py-4 overflow-y-auto">
        <ul className="space-y-4">
          {adminMenuConfig.map((group) => {
            const visibleLinks = group.links.filter(link => hasPermission(link.roles as any));
            if (visibleLinks.length === 0) return null;

            return (
              <li key={group.category}>
                <h4 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.category}
                </h4>
                <ul className="space-y-1">
                  {visibleLinks.map((link) => {
                    const isActive = link.exact 
                      ? location.pathname === link.to 
                      : location.pathname.startsWith(link.to);
                    
                    return (
                      <li key={link.to}>
                        <Link
                          to={link.to}
                          className={cn(
                            "block px-3 py-2 rounded-md text-sm font-medium transition-colors",
                            isActive
                              ? "bg-sidebar-primary text-sidebar-primary-foreground"
                              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          )}
                          onClick={onLinkClick}
                        >
                          {link.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};