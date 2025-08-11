import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/supabase/auth-context";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

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
  const { user, signOut, hasPermission } = useAuth(); // Get hasPermission
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdminOrEditor = hasPermission(['admin', 'editor', 'captain']); // Check if user has admin, editor or captain role

  return (
    <nav className="bg-white border-b border-gray-200 dark:bg-background dark:border-border sticky top-0 z-30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="font-bold text-xl text-primary">
            NC League
          </Link>

          {/* Desktop Navigation */}
          <ul className="hidden md:flex gap-4">
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

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                {isAdminOrEditor && ( // Only show Admin button if user has admin, editor or captain role
                  <Link to="/admin">
                    <Button variant="outline" size="sm">
                      Admin
                    </Button>
                  </Link>
                )}
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

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-muted"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-border">
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className={cn(
                      "block px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      location.pathname === link.to
                        ? "bg-primary text-primary-foreground"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-muted"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-border">
              {user ? (
                <div className="space-y-2">
                  {isAdminOrEditor && ( // Only show Admin button if user has admin, editor or captain role
                    <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full">
                        Admin
                      </Button>
                    </Link>
                  )}
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => {
                    signOut();
                    setIsMobileMenuOpen(false);
                  }}>
                    Logout
                  </Button>
                </div>
              ) : (
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};