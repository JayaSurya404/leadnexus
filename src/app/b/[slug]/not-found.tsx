import Link from "next/link";

import {
  SearchX,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

export default function PublicBusinessNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/20 px-5">
      <div className="max-w-md text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted">
          <SearchX className="size-6 text-muted-foreground" />
        </div>

        <h1 className="mt-5 text-2xl font-bold">
          Business page unavailable
        </h1>

        <p className="mt-3 leading-7 text-muted-foreground">
          This LeadNexus business page
          does not exist or is currently
          unpublished.
        </p>

        <Button
          asChild
          className="mt-6"
        >
          <Link href="/">
            LeadNexus
          </Link>
        </Button>
      </div>
    </main>
  );
}