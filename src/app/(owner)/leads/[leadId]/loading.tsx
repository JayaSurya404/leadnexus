import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

import {
  Skeleton,
} from "@/components/ui/skeleton";

export default function LeadDetailLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-8 w-28" />

        <Skeleton className="h-10 w-64" />

        <Skeleton className="h-5 w-72" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {Array.from({
            length: 4,
          }).map(
            (_, index) => (
              <Card
                key={index}
              >
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                </CardHeader>

                <CardContent>
                  <Skeleton className="h-36 w-full" />
                </CardContent>
              </Card>
            ),
          )}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>

          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}