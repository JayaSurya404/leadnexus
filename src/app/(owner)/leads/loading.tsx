import {
  Card,
  CardContent,
} from "@/components/ui/card";

import {
  Skeleton,
} from "@/components/ui/skeleton";

export default function LeadsLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />

        <Skeleton className="h-9 w-36" />

        <Skeleton className="h-5 w-full max-w-xl" />
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-[1fr_220px_90px]">
          <Skeleton className="h-9" />

          <Skeleton className="h-9" />

          <Skeleton className="h-9" />
        </CardContent>
      </Card>

      <div className="space-y-2">
        {Array.from({
          length: 6,
        }).map(
          (_, index) => (
            <Skeleton
              key={index}
              className="h-20 w-full"
            />
          ),
        )}
      </div>
    </div>
  );
}