import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

import {
  Skeleton,
} from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({
          length: 6,
        }).map(
          (_, index) => (
            <Card
              key={index}
              className="border-border/60"
            >
              <CardContent className="space-y-4 p-5">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="size-10 rounded-xl" />
                </div>

                <Skeleton className="h-9 w-16" />

                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ),
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({
          length: 2,
        }).map(
          (_, index) => (
            <Card
              key={index}
            >
              <CardHeader className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-52" />
              </CardHeader>

              <CardContent>
                <Skeleton className="h-[280px] w-full" />
              </CardContent>
            </Card>
          ),
        )}
      </div>
    </div>
  );
}