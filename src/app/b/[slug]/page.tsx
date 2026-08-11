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
  getPublicBusinessPage,
} from "@/features/tracking/public-business";

export const dynamic =
  "force-dynamic";

type PublicPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: PublicPageProps): Promise<Metadata> {
  const { slug } =
    await params;

  const data =
    await getPublicBusinessPage(
      slug,
    );

  if (!data) {
    return {
      title:
        "Business not found | LeadNexus",
    };
  }

  const title =
    data.settings.headline ||
    data.business.name;

  const description =
    data.settings.subheadline ||
    data.settings.about ||
    data.business.description ||
    `Discover ${data.business.name} on LeadNexus.`;

  return {
    title:
      `${title} | LeadNexus`,

    description:
      description.slice(
        0,
        160,
      ),

    openGraph: {
      title,
      description:
        description.slice(
          0,
          160,
        ),

      type:
        "website",

      images:
        data.business.coverUrl
          ? [
              data.business
                .coverUrl,
            ]
          : undefined,
    },
  };
}

export default async function PublicBusinessRoute({
  params,
}: PublicPageProps) {
  const { slug } =
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