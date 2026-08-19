"use client";

import Link from "next/link";

import {
  BarChart3,
  Building2,
  ExternalLink,
  LayoutDashboard,
  Link2,
  Package,
  PhoneOutgoing,
  RefreshCcw,
  Sparkles,
  Users,
} from "lucide-react";

import {
  usePathname,
} from "next/navigation";

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
      "Business",

    href:
      "/business",

    icon:
      Building2,
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
      "VoiceNexus",

    href:
      "/voicenexus",

    icon:
      PhoneOutgoing,
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

type OwnerSidebarProps = {
  businessName: string;
  publicSlug: string;
};

export function OwnerSidebar({
  businessName,
  publicSlug,
}: OwnerSidebarProps) {
  const pathname =
    usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-background lg:flex lg:flex-col">
      <div className="flex h-16 items-center border-b px-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-3"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </span>

          <div className="min-w-0">
            <p className="font-semibold tracking-tight">
              LeadNexus
            </p>

            <p className="truncate text-xs text-muted-foreground">
              {businessName}
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
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

                <span>
                  {label}
                </span>
              </Link>
            );
          },
        )}
      </nav>

      <div className="border-t p-3">
        <Link
          href={`/b/${publicSlug}`}
          target="_blank"
          className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-medium transition hover:bg-muted"
        >
          <span>
            Public page
          </span>

          <ExternalLink className="size-4 text-muted-foreground" />
        </Link>
      </div>
    </aside>
  );
}