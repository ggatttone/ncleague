import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/supabase/auth-context";
import { Button } from "./ui/button";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/matches", label: "Matches" },
  { to: "/tables", label: "Table" },
  { to: "/statistics", label: "Statistics" },
  { to: "/news", label: "News" },
  { to: "/players", label: "Players" },
  { to: "/teams", label: "Clubs" },
];

export const Navbar = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 dark:bg-background dark:border-border sticky top-0 z-30">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="font-bold text-xl text-primary">NC League</div>
        <ul className="flex gap-4">
          {navLinks.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location.pathname === link.to
                    ? "bg-primary text-primary-foreground"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link to="/admin">
                <Button variant="outline" size="sm">
                  Admin
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                Logout
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="sm">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};