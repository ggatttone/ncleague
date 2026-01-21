import { AdminLayout } from "@/components/admin/AdminLayout";
import { Table } from "@/components/Table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVenues, useDeleteVenue } from "@/hooks/use-venues";
import { Link } from "react-router-dom";
import { Search, Loader2, Plus, Edit } from "lucide-react";
import { useAdminListPage } from "@/hooks/use-admin-list-page";
import { AdminMobileCard } from "@/components/admin/AdminMobileCard";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { useTranslation } from "react-i18next";
import { Venue } from "@/types/database";

const VenuesAdmin = () => {
  const { data: venues, isLoading, error } = useVenues();
  const deleteVenueMutation = useDeleteVenue();
  const { t } = useTranslation();

  const { searchTerm, setSearchTerm, filteredData: filteredVenues, isMobile } = useAdminListPage<Venue>({
    data: venues,
    searchFields: ['name', 'struttura', 'address', 'city'],
  });

  const handleDeleteVenue = async (venueId: string) => {
    await deleteVenueMutation.mutateAsync(venueId);
  };

  const columns = [
    { key: "name", label: t('pages.admin.venues.table.name') },
    { key: "struttura", label: t('pages.admin.venues.table.structure') },
    { key: "address", label: t('pages.admin.venues.table.address') },
    { key: "city", label: t('pages.admin.venues.table.city') },
    { key: "actions", label: t('pages.admin.venues.table.actions') },
  ];

  const data = filteredVenues?.map(venue => ({
    name: venue.name,
    struttura: venue.struttura || "-",
    address: venue.address || "-",
    city: venue.city || "-",
    actions: (
      <div className="flex items-center gap-2">
        <Link to={`/admin/venues/${venue.id}/edit`}>
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        </Link>
        <DeleteConfirmDialog
          title={t('pages.admin.venues.deleteDialogTitle')}
          description={t('pages.admin.venues.deleteDialogDescription', { name: venue.name })}
          onConfirm={() => handleDeleteVenue(venue.id)}
          isPending={deleteVenueMutation.isPending}
        />
      </div>
    ),
  })) || [];

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{t('pages.admin.venues.errorLoading')}</p>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </AdminLayout>
    );
  }

  const renderMobileList = () => (
    <div className="space-y-4">
      {filteredVenues?.map(venue => (
        <AdminMobileCard
          key={venue.id}
          title={venue.name}
          subtitle={venue.city || "Città non specificata"}
          actions={
            <>
              <Link to={`/admin/venues/${venue.id}/edit`}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
              <DeleteConfirmDialog
                title={t('pages.admin.venues.deleteDialogTitle')}
                description={t('pages.admin.venues.deleteDialogDescription', { name: venue.name })}
                onConfirm={() => handleDeleteVenue(venue.id)}
                isPending={deleteVenueMutation.isPending}
                triggerSize="icon"
              />
            </>
          }
        >
          <div className="mt-2 text-sm text-muted-foreground">{venue.address}</div>
        </AdminMobileCard>
      ))}
    </div>
  );

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">{t('pages.admin.venues.title')}</h1>
        <Link to="/admin/venues/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            {t('pages.admin.venues.newVenue')}
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t('pages.admin.venues.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        isMobile ? renderMobileList() : <Table columns={columns} data={data} />
      )}
    </AdminLayout>
  );
};

export default VenuesAdmin;
