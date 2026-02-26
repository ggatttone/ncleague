import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export const TeamCardSkeleton = () => (
  <Card>
    <CardHeader className="pb-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-5 w-16" />
      </div>
    </CardContent>
  </Card>
);

export const MatchCardSkeleton = () => (
  <Card>
    <CardHeader className="pb-2">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-6 w-12" />
        <div className="flex items-center gap-3 flex-1 justify-end">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      </div>
      <div className="flex justify-between mt-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </CardContent>
  </Card>
);

export const ArticlePostSkeleton = () => (
  <div className="p-4 border-b last:border-b-0">
    <div className="flex items-center gap-3 mb-3">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="space-y-1">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
    <div className="space-y-2 mb-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
    </div>
    <Skeleton className="h-48 w-full rounded-lg" />
  </div>
);

export const AlbumCardSkeleton = () => (
  <Card className="overflow-hidden">
    <CardHeader className="p-0">
      <Skeleton className="aspect-video w-full" />
    </CardHeader>
    <CardContent className="p-4 space-y-2">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/3" />
    </CardContent>
  </Card>
);

export const GalleryItemSkeleton = () => (
  <Card className="overflow-hidden">
    <CardContent className="p-0">
      <Skeleton className="aspect-square w-full" />
    </CardContent>
  </Card>
);

export const StandingsTableSkeleton = () => (
  <div className="rounded-lg border border-border bg-card p-4 space-y-3">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <Skeleton className="h-5 w-6" />
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-32 flex-1" />
        {Array.from({ length: 8 }).map((_, j) => (
          <Skeleton key={j} className="h-4 w-8" />
        ))}
      </div>
    ))}
  </div>
);

export const DetailPageSkeleton = () => (
  <div className="container mx-auto py-8 px-4 space-y-6">
    <Skeleton className="h-8 w-1/4" />
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-6">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-6 space-y-3">
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
  </div>
);
