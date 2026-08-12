import type {
  Metadata,
} from "next";

import Image from "next/image";
import Link from "next/link";

import type {
  ReactNode,
} from "react";

import {
  BrainCircuit,
  Building2,
  LayoutDashboard,
  LogOut,
  RotateCcw,
  Users,
} from "lucide-react";

import {
  logoutAction,
} from "@/actions/auth/logout";

import {
  Button,
} from "@/components/ui/button";

import {
  requireAdmin,
} from "@/lib/auth/require-admin";

export const metadata: Metadata = {
  title: {
    default:
      "Admin | LeadNexus",

    template:
      "%s | LeadNexus Admin",
  },
};

const navigation = [
  {
    href:
      "/admin",

    label:
      "Overview",

    icon:
      LayoutDashboard,
  },
  {
    href:
      "/admin/businesses",

    label:
      "Businesses",

    icon:
      Building2,
  },
  {
    href:
      "/admin/leads",

    label:
      "All Leads",

    icon:
      Users,
  },
  {
    href:
      "/admin/intelligence",

    label:
      "Intelligence",

    icon:
      BrainCircuit,
  },
  {
    href:
      "/admin/recovery",

    label:
      "Recovery",

    icon:
      RotateCcw,
  },
];

export default async function AdminLayout({
  children,
}: Readonly<{
  children:
    ReactNode;
}>) {
  const admin =
    await requireAdmin();

  return (
    <div className="min-h-screen bg-muted/20">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-background lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b px-5">
          <Link
            href="/admin"
            className="flex items-center"
          >
            <Image
              src="/brand/logo.svg"
              alt="LeadNexus"
              width={145}
              height={34}
              priority
              className="h-8 w-auto"
            />
          </Link>
        </div>

        <div className="px-4 pt-5">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Platform Admin
          </p>
        </div>

        <nav className="mt-3 flex-1 space-y-1 px-3">
          {navigation.map(
            (item) => {
              const Icon =
                item.icon;

              return (
                <Link
                  key={
                    item.href
                  }
                  href={
                    item.href
                  }
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Icon className="size-4" />

                  {
                    item.label
                  }
                </Link>
              );
            },
          )}
        </nav>

        <div className="border-t p-4">
          <div className="mb-3 px-2">
            <p className="truncate text-sm font-medium">
              {admin.fullName ??
                "Platform Admin"}
            </p>

            <p className="mt-1 truncate text-xs text-muted-foreground">
              {admin.email ??
                "LeadNexus"}
            </p>
          </div>

          <form
            action={
              logoutAction
            }
          >
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="w-full justify-start"
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <Link
              href="/admin"
              className="lg:hidden"
            >
              <Image
                src="/brand/logo.svg"
                alt="LeadNexus"
                width={130}
                height={32}
                className="h-7 w-auto"
              />
            </Link>

            <div className="hidden lg:block">
              <p className="text-sm font-medium">
                LeadNexus
                Administration
              </p>

              <p className="text-xs text-muted-foreground">
                Platform control
                center
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium">
                  {admin.fullName ??
                    "Platform Admin"}
                </p>

                <p className="text-xs text-muted-foreground">
                  PLATFORM_ADMIN
                </p>
              </div>

              <form
                action={
                  logoutAction
                }
                className="lg:hidden"
              >
                <Button
                  type="submit"
                  size="icon"
                  variant="ghost"
                >
                  <LogOut className="size-4" />

                  <span className="sr-only">
                    Sign out
                  </span>
                </Button>
              </form>
            </div>
          </div>

          <nav className="flex gap-1 overflow-x-auto border-t px-3 py-2 lg:hidden">
            {navigation.map(
              (item) => {
                const Icon =
                  item.icon;

                return (
                  <Button
                    key={
                      item.href
                    }
                    asChild
                    size="sm"
                    variant="ghost"
                    className="shrink-0"
                  >
                    <Link
                      href={
                        item.href
                      }
                    >
                      <Icon className="size-4" />

                      {
                        item.label
                      }
                    </Link>
                  </Button>
                );
              },
            )}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}