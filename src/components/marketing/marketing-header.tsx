import Image from "next/image";
import Link from "next/link";

import {
  Button,
} from "@/components/ui/button";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center"
          aria-label="LeadNexus home"
        >
          <Image
            src="/brand/logo.svg"
            alt="LeadNexus"
            width={150}
            height={36}
            priority
            className="h-8 w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground lg:flex">
          <a
            href="#features"
            className="transition-colors hover:text-foreground"
          >
            Features
          </a>

          <a
            href="#how-it-works"
            className="transition-colors hover:text-foreground"
          >
            How it works
          </a>

          <a
            href="#businesses"
            className="transition-colors hover:text-foreground"
          >
            For businesses
          </a>

          <a
            href="#intelligence"
            className="transition-colors hover:text-foreground"
          >
            Lead intelligence
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            className="hidden sm:inline-flex"
          >
            <Link href="/login">
              Sign in
            </Link>
          </Button>

          <Button asChild>
            <Link href="/signup">
              Get started
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}