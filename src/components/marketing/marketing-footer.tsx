import Image from "next/image";
import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="border-t bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1fr_auto_auto]">
          <div className="max-w-md">
            <Image
              src="/brand/logo.svg"
              alt="LeadNexus"
              width={150}
              height={36}
              className="h-8 w-auto"
            />

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Capture, understand,
              recover and manage
              business leads from one
              connected platform.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold">
              Product
            </p>

            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <a
                href="#features"
                className="block hover:text-foreground"
              >
                Features
              </a>

              <a
                href="#how-it-works"
                className="block hover:text-foreground"
              >
                How it works
              </a>

              <a
                href="#intelligence"
                className="block hover:text-foreground"
              >
                Lead intelligence
              </a>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold">
              Account
            </p>

            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <Link
                href="/login"
                className="block hover:text-foreground"
              >
                Sign in
              </Link>

              <Link
                href="/signup"
                className="block hover:text-foreground"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} LeadNexus.
            All rights reserved.
          </p>

          <p>
            Lead intelligence and
            recovery platform for
            businesses.
          </p>
        </div>
      </div>
    </footer>
  );
}