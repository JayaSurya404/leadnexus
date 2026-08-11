"use client";

import Link from "next/link";

import {
  BarChart3,
  Building2,
  ExternalLink,
  LayoutDashboard,
  Link2,
  Menu,
  Package,
  RefreshCcw,
  Search,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";

import {
  usePathname,
} from "next/navigation";

import {
  Button,
} from "@/components/ui/button";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navigation = [
  {
    label:
      "Dashboard",
    href:
      "/dashboard",
    icon:
      LayoutDashboard,
  },

  {
    label:
      "Leads",
    href:
      "/leads",
    icon:
      Users,
  },

  {
    label:
      "Recovered",
    href:
      "/recovered-leads",
    icon:
      RefreshCcw,
  },

  {
    label:
      "Products",
    href:
      "/products",
    icon:
      Package,
  },

  {
    label:
      "Tracking Links",
    href:
      "/links",
    icon:
      Link2,
  },

  {
    label:
      "Analytics",
    href:
      "/analytics",
    icon:
      BarChart3,
  },

  {
    label:
      "SEO",
    href:
      "/seo",
    icon:
      Search,
  },

  {
    label:
      "Business",
    href:
      "/business",
    icon:
      Building2,
  },

  {
    label:
      "Settings",
    href:
      "/settings",
    icon:
      Settings,
  },
] as const;

function isRouteActive(
  pathname: string,
  href: string,
) {
  if (
    href ===
    "/dashboard"
  ) {
    return (
      pathname ===
      "/dashboard"
    );
  }

  return (
    pathname === href ||
    pathname.startsWith(
      `${href}/`,
    )
  );
}

type OwnerMobileNavProps = {
  businessName: string;
  publicSlug: string;
};

export function OwnerMobileNav({
  businessName,
  publicSlug,
}: OwnerMobileNavProps) {
  const pathname =
    usePathname();

  return (
    <Sheet>
      <SheetTrigger
        asChild
      >
        <Button
          variant="outline"
          size="icon"
          className="lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-[290px] p-0"
      >
        <SheetHeader className="border-b p-5 text-left">
          <SheetTitle className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </span>

            <span className="min-w-0">
              <span className="block">
                LeadNexus
              </span>

              <span className="block truncate text-xs font-normal text-muted-foreground">
                {businessName}
              </span>
            </span>
          </SheetTitle>
        </SheetHeader>

        <nav className="space-y-1 p-3">
          {navigation.map(
            ({
              label,
              href,
              icon: Icon,
            }) => {
              const active =
                isRouteActive(
                  pathname,
                  href,
                );

              return (
                <Link
                  key={href}
                  href={href}
                  className={[
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  ].join(
                    " ",
                  )}
                >
                  <Icon className="size-4" />

                  {label}
                </Link>
              );
            },
          )}

          <div className="pt-3">
            <Link
              href={`/b/${publicSlug}`}
              target="_blank"
              className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-medium"
            >
              Public page

              <ExternalLink className="size-4" />
            </Link>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}