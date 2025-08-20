import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/supabase/auth-context";
import { useThemeContext } from "@/components/theme/ThemeProvider";
import { Button } from "./ui/button";
import { Menu, X, User, LogOut, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";

export const Navbar = () => {
  const location = useLocation();
  const { user, signOut, hasPermission, profile } = useAuth();
  const { theme } = useThemeContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useTranslation('components');

  const navLinks = [
    { to: "/", label: t('navbar.home') },
    { to: "/matches", label: t('navbar.matches') },
    { to: "/tables", label: t('navbar.tables') },
    { to: "/statistics", label: t('navbar.statistics') },
    { to: "/news", label: t('navbar.news') },
    { to: "/players", label: t('navbar.players') },
    { to: "/teams", label: t('navbar.teams') },
    { to: "/gallery", label: t('navbar.gallery') },
  ];

  const isAdminOrEditor = hasPermission(['admin', 'editor', 'captain']);

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    const initials = `${first}${last}`.toUpperCase();
    return initials || <User className="h-4 w-4" />;
  };

  const userMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url || ""} alt="User avatar" />
            <AvatarFallback>{getInitials(profile?.first_name, profile?.last_name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {profile?.first_name || 'Utente'} {profile?.last_name || ''}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile">
            <User className="mr-2 h-4 w-4" />
            <span>{t('userMenu.profile')}</span>
          </Link>
        </DropdownMenuItem>
        {isAdminOrEditor && (
          <DropdownMenuItem asChild>
            <Link to="/admin">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>{t('userMenu.admin')}</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('userMenu.logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="font-bold text-xl text-primary">
            {theme?.logo_url ? (
              <img src={theme.logo_url} alt="Logo" className="h-10 max-w-xs" />
            ) : (
              <span>NC League</span>
            )}
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
                      : "text-foreground/70 hover:bg-muted hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            {user ? userMenu : (
              <Link to="/login">
                <Button variant="outline" size="sm">
                  {t('userMenu.login')}
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md text-foreground/70 hover:bg-muted"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className={cn(
                      "block px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      location.pathname === link.to
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground/70 hover:bg-muted hover:text-foreground"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-end mb-4 gap-2">
                <LanguageSwitcher />
                <ThemeToggle />
              </div>
              {user ? (
                <div className="space-y-2">
                  <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <User className="mr-2 h-4 w-4" /> {t('userMenu.profile')}
                    </Button>
                  </Link>
                  {isAdminOrEditor && (
                    <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <LayoutDashboard className="mr-2 h-4 w-4" /> {t('userMenu.admin')}
                      </Button>
                    </Link>
                  )}
                  <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => {
                    signOut();
                    setIsMobileMenuOpen(false);
                  }}>
                    <LogOut className="mr-2 h-4 w-4" /> {t('userMenu.logout')}
                  </Button>
                </div>
              ) : (
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">
                    {t('userMenu.login')}
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