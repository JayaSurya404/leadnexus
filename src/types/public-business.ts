export type PublicSocialLink = {
  platform:
    | "INSTAGRAM"
    | "FACEBOOK"
    | "LINKEDIN"
    | "YOUTUBE"
    | "X"
    | "WEBSITE"
    | "EMAIL"
    | "PHONE"
    | "WHATSAPP"
    | "OTHER";

  label: string;
  url: string;
};

export type PublicBusinessHour = {
  dayOfWeek: number;
  isClosed: boolean;
  opensAt: string | null;
  closesAt: string | null;
};

export type PublicProduct = {
  id: string;

  itemType:
    | "PRODUCT"
    | "SERVICE";

  name: string;
  slug: string;

  description: string | null;
  priceText: string | null;

  featured: boolean;

  imageUrl: string | null;
};

export type PublicBusinessPageData = {
  business: {
    id: string;
    name: string;
    slug: string;

    category: string | null;
    businessType: string | null;
    description: string | null;

    city: string | null;
    state: string | null;
    country: string | null;
    serviceArea: string | null;

    logoUrl: string | null;
    coverUrl: string | null;
    businessPhone?: string | null;
    businessEmail?: string | null;
    whatsappNumber?: string | null;
    website?: string | null;
  };

  settings: {
    headline: string | null;
    subheadline: string | null;
    about: string | null;

    primaryCtaText: string;

    showProducts: boolean;
    showBusinessHours: boolean;
    showSocialLinks: boolean;
    showLocation: boolean;
    showPhone: boolean;
    showEmail: boolean;
    showWhatsapp: boolean;
  };

  products: PublicProduct[];

  socials: PublicSocialLink[];

  hours: PublicBusinessHour[];

  contactAvailability: {
    whatsapp: boolean;
    email: boolean;
    phone: boolean;
    website: boolean;
  };
};

export type PublicActivityEvent =
  | "SESSION_STARTED"
  | "PAGE_VIEW"
  | "LEAD_FORM_VIEW"
  | "LEAD_FORM_STARTED"
  | "LEAD_FORM_SUBMITTED"
  | "PRODUCT_VIEW"
  | "PRODUCT_ENGAGED"
  | "CTA_CLICK"
  | "WHATSAPP_CLICK"
  | "INSTAGRAM_CLICK"
  | "FACEBOOK_CLICK"
  | "LINKEDIN_CLICK"
  | "TELEGRAM_CLICK"
  | "YOUTUBE_CLICK"
  | "X_CLICK"
  | "PHONE_CLICK"
  | "EMAIL_CLICK"
  | "WEBSITE_CLICK"
  | "RETURN_VISIT"
  | "PAGE_EXIT";

export type PublicContactChannel =
  | "WHATSAPP"
  | "EMAIL"
  | "PHONE"
  | "WEBSITE"
  | "INSTAGRAM"
  | "FACEBOOK"
  | "LINKEDIN";
