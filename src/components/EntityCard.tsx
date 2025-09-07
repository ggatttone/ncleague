import { ReactNode } from "react";

interface EntityCardProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  imageUrl?: string;
}

export const EntityCard = ({ title, subtitle, children, imageUrl }: EntityCardProps) => (
  <div className="bg-card rounded-lg shadow p-6 flex items-center gap-6">
    {imageUrl && (
      <img
        src={imageUrl}
        alt={title}
        className="w-20 h-20 rounded-full object-cover border border-border"
      />
    )}
    <div>
      <h2 className="text-2xl font-bold mb-1">{title}</h2>
      {subtitle && <div className="text-muted-foreground mb-2">{subtitle}</div>}
      {children}
    </div>
  </div>
);