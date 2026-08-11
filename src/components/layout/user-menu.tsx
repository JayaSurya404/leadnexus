"use client";

import {
  LogOut,
  Settings,
  User,
} from "lucide-react";

import Link from "next/link";

import {
  logoutAction,
} from "@/actions/auth/logout";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

import {
  Button,
} from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getInitials(
  fullName: string | null,
  email: string | null,
) {
  if (
    fullName?.trim()
  ) {
    return fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(
        (part) =>
          part[0]
            ?.toUpperCase() ??
          "",
      )
      .join("");
  }

  if (email) {
    return email
      .slice(0, 2)
      .toUpperCase();
  }

  return "LN";
}

type UserMenuProps = {
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
};

export function UserMenu({
  fullName,
  email,
  avatarUrl,
}: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
      >
        <Button
          variant="ghost"
          className="h-10 gap-2 px-2"
        >
          <Avatar className="size-8">
            {avatarUrl ? (
              <AvatarImage
                src={avatarUrl}
                alt={
                  fullName ??
                  "User avatar"
                }
              />
            ) : null}

            <AvatarFallback>
              {getInitials(
                fullName,
                email,
              )}
            </AvatarFallback>
          </Avatar>

          <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">
            {fullName ??
              email ??
              "Account"}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-64"
      >
        <DropdownMenuLabel>
          <div className="space-y-1">
            <p className="truncate font-medium">
              {fullName ??
                "LeadNexus User"}
            </p>

            {email ? (
              <p className="truncate text-xs font-normal text-muted-foreground">
                {email}
              </p>
            ) : null}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          asChild
        >
          <Link href="/settings">
            <User className="size-4" />
            Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          asChild
        >
          <Link href="/business">
            <Settings className="size-4" />
            Business settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <form
          action={
            logoutAction
          }
        >
          <DropdownMenuItem
            asChild
          >
            <button
              type="submit"
              className="w-full"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}