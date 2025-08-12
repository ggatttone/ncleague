import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/supabase/auth-context";

const adminLinks = [
  { to: "/admin/teams", label: "Squadre", roles: ['admin', 'editor', 'captain'] },
  { to: "/admin/players", label: "Giocatori", roles: ['admin', 'editor', 'captain'] },
  { to: "/admin/fixtures", label: "Calendario", roles: ['admin', 'editor'] },
  { to: "/admin/results", label: "Risultati", roles: ['admin', 'editor'] },
  { to: "/admin/articles", label: "Articoli", roles: ['admin', 'editor'] },
  { to: "/admin/penalties", label: "Penalità", roles: ['admin'] },
  { to: "/admin/audit-log", label: "Audit Log", roles: ['admin'] },
  { to: "/admin/users", label: "Gestione Utenti", roles: ['admin'] },
];

export const AdminSidebar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const { hasPermission } = useAuth();

  const sidebarContent = (
    <aside className={cn(
      "bg-sidebar px-4 py-8 border-r border-sidebar-border",
      isMobile ? "w-full" : "w-56 min-h-screen"
    )}>
      <div className="font-bold text-lg mb-8 text-sidebar-primary">Admin NC League</div>
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
                onClick={() => isMobile && setIsOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          )
        ))}
      </ul>
    </aside>
  );

  if (isMobile) {
    return (
      <>
        <button
          className="fixed top-20 left-4 z-50 p-2 bg-primary text-primary-foreground rounded-md shadow-lg"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        
        {isOpen && (
          <div className="fixed inset-0 z-40">
            <div 
              className="absolute inset-0 bg-black/50" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full w-64">
              {sidebarContent}
            </div>
          </div>
        )}
      </>
    );
  }

  return sidebarContent;
};