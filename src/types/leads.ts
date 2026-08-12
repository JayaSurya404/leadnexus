export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "RESPONDED"
  | "QUALIFIED"
  | "CUSTOMER"
  | "NO_RESPONSE"
  | "NOT_INTERESTED"
  | "LOST";

export type LeadContactIntent =
  | "NONE"
  | "DIRECT_CONTACT"
  | "RECOVERED";

export type LeadTemperature =
  | "UNKNOWN"
  | "COLD"
  | "WARM"
  | "HOT";

export type OwnerLeadSummary = {
  id: string;

  name: string;

  phone: string;

  email: string | null;

  status: LeadStatus;

  contactIntent:
    LeadContactIntent;

  productName:
    | string
    | null;

  temperature:
    LeadTemperature;

  score:
    | number
    | null;

  createdAt: string;

  ownerVisibleAt:
    | string
    | null;
};

export type LeadNoteItem = {
  id: string;

  text: string;

  createdAt: string;

  authorId:
    | string
    | null;
};

export type LeadActivityItem = {
  id: string;

  eventType: string;

  createdAt: string;

  productId:
    | string
    | null;
};

export type LeadIntelligenceView = {
  temperature:
    LeadTemperature;

  score:
    | number
    | null;

  primaryInterest:
    | string
    | null;

  reasons: string[];

  recommendedAction:
    | string
    | null;

  analyzedAt:
    | string
    | null;
};

export type OwnerLeadDetail = {
  id: string;

  name: string;

  phone: string;

  email:
    | string
    | null;

  status:
    LeadStatus;

  contactIntent:
    LeadContactIntent;

  productId:
    | string
    | null;

  productName:
    | string
    | null;

  createdAt: string;

  ownerVisibleAt:
    | string
    | null;

  notes:
    LeadNoteItem[];

  activity:
    LeadActivityItem[];

  intelligence:
    LeadIntelligenceView | null;
};