import Link from "next/link";

import {
  ArrowLeft,
  Sparkles,
} from "lucide-react";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,var(--color-muted),transparent_40%)]" />

      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-semibold tracking-tight"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </span>

            <span className="text-lg">
              LeadNexus
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Home
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center py-12">
          {children}
        </div>

        <footer className="text-center text-xs text-muted-foreground">
          LeadNexus · Lead intelligence
          and recovery platform
        </footer>
      </div>
    </main>
  );
}