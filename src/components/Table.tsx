import { ReactNode } from "react";

interface TableProps {
  columns: { key: string; label: ReactNode }[];
  data: Record<string, ReactNode>[];
}

export const Table = ({ columns, data }: TableProps) => (
  <div className="overflow-x-auto rounded-lg border border-border bg-card">
    <table className="min-w-full divide-y divide-border">
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap"
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="px-4 py-6 text-center text-muted-foreground">
              Nessun dato disponibile.
            </td>
          </tr>
        ) : (
          data.map((row, i) => (
            <tr key={i} className="hover:bg-muted/50">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-2 whitespace-nowrap">
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);