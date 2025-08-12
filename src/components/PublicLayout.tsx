import { ReactNode } from "react";

export const PublicLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="bg-background text-foreground">
      {children}
    </div>
  );
};