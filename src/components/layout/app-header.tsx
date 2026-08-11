import Link from "next/link";

import { ExternalLink } from "lucide-react";

import { OwnerMobileNav } from "@/components/layout/owner-mobile-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";

type AppHeaderProps = {
  businessName: string;
  businessSlug: string;
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
};

export default function AppHeader({
  businessName,
  businessSlug,
  fullName,
  email,
  avatarUrl,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex w-full items-center gap-3">
        <OwnerMobileNav
          businessName={businessName}
          publicSlug={businessSlug}
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {businessName}
          </p>

          <p className="hidden text-xs text-muted-foreground sm:block">
            Business workspace
          </p>
        </div>

        <Button
          asChild
          variant="outline"
          size="sm"
          className="hidden md:inline-flex"
        >
          <Link
            href={`/b/${businessSlug}`}
            target="_blank"
          >
            View public page
            <ExternalLink className="size-4" />
          </Link>
        </Button>

        <UserMenu
          fullName={fullName}
          email={email}
          avatarUrl={avatarUrl}
        />
      </div>
    </header>
  );
}