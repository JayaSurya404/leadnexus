export type DashboardMetrics = {
  visitors: number;
  visibleLeads: number;
  directContacts: number;
  recoveredLeads: number;
  qualifiedLeads: number;
  customers: number;
};

export type VisitorTrendPoint = {
  date: string;
  label: string;
  visitors: number;
};

export type LeadFunnelPoint = {
  status:
    | "NEW"
    | "CONTACTED"
    | "RESPONDED"
    | "QUALIFIED"
    | "CUSTOMER";

  label: string;
  value: number;
};

export type SourcePerformancePoint = {
  source: string;
  visitors: number;
};

export type RecentLeadItem = {
  id: string;
  name: string;
  phone: string;
  email: string | null;

  status:
    | "NEW"
    | "CONTACTED"
    | "RESPONDED"
    | "QUALIFIED"
    | "CUSTOMER"
    | "NO_RESPONSE"
    | "NOT_INTERESTED"
    | "LOST";

  contactIntent:
    | "NONE"
    | "DIRECT_CONTACT"
    | "RECOVERED";

  productName: string | null;
  createdAt: string;
};

export type RecoveredLeadItem = {
  id: string;
  name: string;

  status:
    RecentLeadItem["status"];

  productName: string | null;
  ownerVisibleAt: string;
};

export type OwnerDashboardData = {
  metrics: DashboardMetrics;

  visitorTrend:
    VisitorTrendPoint[];

  funnel:
    LeadFunnelPoint[];

  sources:
    SourcePerformancePoint[];

  recentLeads:
    RecentLeadItem[];

  recoveredLeads:
    RecoveredLeadItem[];
};