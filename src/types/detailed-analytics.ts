export type AnalyticsMetricSet = {
  visitors: number;

  visibleLeads: number;

  directContacts: number;

  recoveredLeads: number;

  qualifiedLeads: number;

  customers: number;

  conversionRate: number;
};

export type AnalyticsDay = {
  date: string;

  label: string;

  visitors: number;

  leads: number;
};

export type AnalyticsSource = {
  source: string;

  visitors: number;

  leads: number;
};

export type ProductAnalytics = {
  id: string;

  name: string;

  views: number;

  engagements: number;

  visibleLeads: number;

  customers: number;
};

export type DetailedAnalytics = {
  metrics:
    AnalyticsMetricSet;

  trend:
    AnalyticsDay[];

  sources:
    AnalyticsSource[];

  products:
    ProductAnalytics[];
};