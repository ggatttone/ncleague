import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    to: string;
    icon?: LucideIcon;
  };
}

export const EmptyState = ({ icon: Icon, title, subtitle, action }: EmptyStateProps) => (
  <div className="text-center py-12">
    <Icon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
    <p className="text-xl text-muted-foreground mb-2">{title}</p>
    {subtitle && <p className="text-muted-foreground mb-4">{subtitle}</p>}
    {action && (
      <Link to={action.to}>
        <Button>
          {action.icon && <action.icon className="mr-2 h-4 w-4" />}
          {action.label}
        </Button>
      </Link>
    )}
  </div>
);
