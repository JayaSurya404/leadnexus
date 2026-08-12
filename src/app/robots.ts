import type {
  MetadataRoute,
} from "next";

export default function robots(): MetadataRoute.Robots {
  const appUrl =
    (
      process.env
        .NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000"
    ).replace(
      /\/$/,
      "",
    );

  return {
    rules: {
      userAgent: "*",

      allow: [
        "/",
        "/b/",
      ],

      disallow: [
        "/admin/",
        "/dashboard",
        "/business",
        "/products",
        "/leads",
        "/recovered-leads",
        "/links",
        "/analytics",
        "/seo",
        "/settings",
        "/onboarding",
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
        "/api/",
      ],
    },

    sitemap:
      `${appUrl}/sitemap.xml`,

    host:
      appUrl,
  };
}