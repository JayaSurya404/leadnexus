export type VoiceNexusOutboxStatus =
  | "PENDING"
  | "PROCESSING"
  | "SENT"
  | "FAILED";

export type VoiceNexusLeadOption = {
  id: string;

  name: string;

  phone: string;

  email:
    | string
    | null;

  productName:
    | string
    | null;

  status: string;
};

export type VoiceNexusOutboxItem = {
  id: string;

  leadId:
    | string
    | null;

  leadName:
    string;

  status:
    VoiceNexusOutboxStatus;

  attemptCount:
    number;

  lastError:
    | string
    | null;

  createdAt:
    string;

  sentAt:
    | string
    | null;
};

export type VoiceNexusIntegrationStatus = {
  configured: boolean;

  connected: boolean;

  connectionStatus:
    string;

  apiEndpoint:
    string;

  pending: number;

  sent: number;

  failed: number;

  lastConnectedAt:
    | string
    | null;

  lastError:
    | string
    | null;

  leads:
    VoiceNexusLeadOption[];

  events:
    VoiceNexusOutboxItem[];
};