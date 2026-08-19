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
  ContactSection,
} from "@/components/public-business/contact-section";

import {
  getPublicSeoSettings,
} from "@/features/seo/queries";

import {
  buildBusinessStructuredData,
  serializeJsonLd,
} from "@/features/seo/structured-data";

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

function getAppUrl() {
  return (
    process.env
      .NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  ).replace(
    /\/$/,
    "",
  );
}

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
      title: {
        absolute:
          "Business not found | LeadNexus",
      },

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
    getAppUrl();

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
    title: {
      absolute:
        title,
    },

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
      type:
        "website",

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

  const seo =
    await getPublicSeoSettings(
      data.business.id,
    );

  const canonical =
    seo.canonicalUrl ||
    `${getAppUrl()}/b/${data.business.slug}`;

  const structuredData =
    buildBusinessStructuredData(
      data,
      canonical,
    );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            serializeJsonLd(
              structuredData,
            ),
        }}
      />

      <PublicBusinessPage
        data={
          data
        }
      />

      <div className="mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8">
        <ContactSection
          businessId={data.business.id}
          phone={data.settings.showPhone ? data.business.businessPhone : null}
          email={data.settings.showEmail ? data.business.businessEmail : null}
          whatsapp={data.settings.showWhatsapp ? data.business.whatsappNumber : null}
          website={data.contactAvailability.website ? data.business.website : null}
          socials={data.settings.showSocialLinks ? data.socials : []}
        />
      </div>
    </>
  );
}