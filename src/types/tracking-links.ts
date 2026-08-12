export type TrackingLinkProduct = {
  id: string;
  name: string;
};

export type OwnerTrackingLink = {
  id: string;

  name: string;

  code: string;

  source: string;

  medium:
    | string
    | null;

  campaign:
    | string
    | null;

  content:
    | string
    | null;

  term:
    | string
    | null;

  productId:
    | string
    | null;

  productName:
    | string
    | null;

  destinationPath:
    | string
    | null;

  active: boolean;

  clickCount: number;

  visitors: number;

  ownerVisibleLeads: number;

  lastClickedAt:
    | string
    | null;

  createdAt: string;

  publicUrl: string;
};