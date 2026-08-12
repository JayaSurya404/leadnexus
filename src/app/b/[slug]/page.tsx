import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import {
  PublicBusinessPage,
} from "@/components/public-business/public-business-page";

import {
  getPublicSeoSettings,
} from "@/features/seo/queries";

import {
  getPublicBusinessPage,
} from "@/features/tracking/public-business";

export const dynamic =
  "force-dynamic";

type PublicBusinessRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: PublicBusinessRouteProps): Promise<Metadata> {
  const {
    slug,
  } =
    await params;

  const data =
    await getPublicBusinessPage(
      slug,
    );

  if (!data) {
    return {
      title:
        "Business not found | LeadNexus",

      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const seo =
    await getPublicSeoSettings(
      data.business.id,
    );

  const appUrl =
    (
      process.env
        .NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000"
    ).replace(
      /\/$/,
      "",
    );

  const title =
    seo.title ||
    `${data.business.name} | LeadNexus`;

  const description =
    seo.description ||
    data.settings.subheadline ||
    data.settings.about ||
    data.business.description ||
    `Discover ${data.business.name} on LeadNexus.`;

  const canonical =
    seo.canonicalUrl ||
    `${appUrl}/b/${data.business.slug}`;

  return {
    title,

    description,

    keywords:
      seo.keywords.length >
      0
        ? seo.keywords
        : undefined,

    alternates: {
      canonical,
    },

    robots: {
      index:
        seo.indexable,

      follow:
        seo.indexable,
    },

    openGraph: {
      type: "website",

      url:
        canonical,

      title:
        seo.ogTitle ||
        title,

      description:
        seo.ogDescription ||
        description,

      siteName:
        "LeadNexus",
    },
  };
}

export default async function PublicBusinessRoute({
  params,
}: PublicBusinessRouteProps) {
  const {
    slug,
  } =
    await params;

  const data =
    await getPublicBusinessPage(
      slug,
    );

  if (!data) {
    notFound();
  }

  return (
    <PublicBusinessPage
      data={data}
    />
  );
}