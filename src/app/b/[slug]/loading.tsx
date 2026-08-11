import {
  Skeleton,
} from "@/components/ui/skeleton";

export default function PublicBusinessLoading() {
  return (
    <main className="min-h-screen bg-muted/20">
      <Skeleton className="h-52 w-full rounded-none sm:h-72" />

      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="-mt-14 rounded-3xl border bg-background p-8">
          <div className="flex gap-5">
            <Skeleton className="size-24 rounded-2xl" />

            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-9 w-64" />
              <Skeleton className="h-5 w-full max-w-xl" />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <Skeleton className="h-52 rounded-2xl" />

            <div className="grid gap-5 sm:grid-cols-2">
              <Skeleton className="h-80 rounded-2xl" />
              <Skeleton className="h-80 rounded-2xl" />
            </div>
          </div>

          <Skeleton className="h-[520px] rounded-2xl" />
        </div>
      </div>
    </main>
  );
}