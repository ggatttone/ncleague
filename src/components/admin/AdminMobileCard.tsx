import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdminMobileCardProps {
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode; // For additional details
  actions: ReactNode;
}

export const AdminMobileCard = ({ title, subtitle, children, actions }: AdminMobileCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1 -mt-2 -mr-2">{actions}</div>
      </CardHeader>
      {children && (
        <CardContent>
          {children}
        </CardContent>
      )}
    </Card>
  );
};