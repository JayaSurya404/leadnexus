import type {
  LeadTemperature,
} from "@/types/leads";

type RecoveryDecision =
  | "PENDING"
  | "SENT_TO_OWNER"
  | "IGNORED";

export type RecoveryCandidateInput = {
  visibility:
    | "ADMIN_ONLY"
    | "OWNER_VISIBLE";

  recoveryDecision:
    | RecoveryDecision
    | null;

  temperature:
    LeadTemperature;

  score:
    | number
    | null;
};

export function isRecoveryCandidate(
  lead: RecoveryCandidateInput,
) {
  if (
    lead.visibility !==
    "ADMIN_ONLY"
  ) {
    return false;
  }

  if (
    lead.recoveryDecision ===
      "IGNORED" ||
    lead.recoveryDecision ===
      "SENT_TO_OWNER"
  ) {
    return false;
  }

  return (
    lead.temperature ===
      "HOT" ||
    lead.temperature ===
      "WARM" ||
    (
      lead.score !==
        null &&
      lead.score >= 40
    )
  );
}