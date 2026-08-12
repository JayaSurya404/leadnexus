import type {
  LeadActivityItem,
  LeadContactIntent,
  LeadIntelligenceView,
  LeadStatus,
  LeadTemperature,
} from "@/types/leads";

export type AdminLeadVisibility =
  | "ADMIN_ONLY"
  | "OWNER_VISIBLE";

export type RecoveryDecision =
  | "PENDING"
  | "SENT_TO_OWNER"
  | "IGNORED";

export type AdminLeadSummary = {
  id: string;

  businessId: string;
  businessName: string;
  businessSlug: string;

  name: string;
  phone: string;
  email: string | null;

  status: LeadStatus;

  visibility:
    AdminLeadVisibility;

  contactIntent:
    LeadContactIntent;

  productId: string | null;
  productName: string | null;

  visitorSessionId:
    | string
    | null;

  source: string | null;
  campaign: string | null;

  temperature:
    LeadTemperature;

  score: number | null;

  primaryInterest:
    | string
    | null;

  buyingIntent:
    | string
    | null;

  reasons: string[];

  recommendedAction:
    | string
    | null;

  recoveryDecision:
    RecoveryDecision | null;

  createdAt: string;

  ownerVisibleAt:
    | string
    | null;
};

export type AdminRecoveryCandidate =
  AdminLeadSummary & {
    lastActivityAt:
      | string
      | null;

    activityCount: number;
  };

export type AdminLeadDetail =
  AdminLeadSummary & {
    activity:
      LeadActivityItem[];

    intelligence:
      LeadIntelligenceView | null;
  };

export type AdminBusinessSummary = {
  id: string;

  name: string;

  slug: string;

  status: string;

  category:
    | string
    | null;

  businessType:
    | string
    | null;

  email:
    | string
    | null;

  phone:
    | string
    | null;

  location:
    string | null;

  totalLeads: number;

  adminOnlyLeads: number;

  ownerVisibleLeads: number;

  recoveredLeads: number;

  customers: number;
};