import { useState, useMemo } from 'react';
import { useIsMobile } from './use-mobile';

interface UseAdminListPageOptions<T> {
  data: T[] | null | undefined;
  searchFields: (keyof T | string)[];
}

export function useAdminListPage<T extends object>({
  data,
  searchFields,
}: UseAdminListPageOptions<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const isMobile = useIsMobile();

  const filteredData = useMemo(() => {
    if (!data || !searchTerm) return data;

    const lowerSearchTerm = searchTerm.toLowerCase();

    return data.filter((item) =>
      searchFields.some((field) => {
        const fieldPath = String(field).split('.');
        let value: unknown = item;

        for (const key of fieldPath) {
          if (value && typeof value === 'object' && key in value) {
            value = (value as Record<string, unknown>)[key];
          } else {
            value = undefined;
            break;
          }
        }

        if (typeof value === 'string') {
          return value.toLowerCase().includes(lowerSearchTerm);
        }
        if (typeof value === 'number') {
          return String(value).includes(lowerSearchTerm);
        }
        return false;
      })
    );
  }, [data, searchTerm, searchFields]);

  return {
    searchTerm,
    setSearchTerm,
    filteredData,
    isMobile,
  };
}
