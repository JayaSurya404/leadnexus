export type SeoSettings = {
  title:
    | string
    | null;

  description:
    | string
    | null;

  keywords:
    string[];

  canonicalUrl:
    | string
    | null;

  ogTitle:
    | string
    | null;

  ogDescription:
    | string
    | null;

  indexable: boolean;
};