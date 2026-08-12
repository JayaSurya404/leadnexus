import type {
  PublicActivityEvent,
  PublicContactChannel,
} from "@/types/public-business";

const sessionPromises =
  new Map<
    string,
    Promise<string>
  >();

function getAnonymousId() {
  const key =
    "leadnexus:anonymous-id";

  const existing =
    window.localStorage.getItem(
      key,
    );

  if (existing) {
    return existing;
  }

  const id =
    crypto.randomUUID();

  window.localStorage.setItem(
    key,
    id,
  );

  return id;
}

async function postJson<T>(
  url: string,
  body: unknown,
  options?: {
    keepalive?: boolean;
  },
): Promise<T> {
  const response =
    await fetch(
      url,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            body,
          ),

        keepalive:
          options?.keepalive ??
          false,
      },
    );

  const result =
    (await response.json()) as
      | T
      | {
          error?: string;
        };

  if (!response.ok) {
    const errorValue =
      (
        result as {
          error?: unknown;
        }
      ).error;

    throw new Error(
      typeof errorValue ===
        "string"
        ? errorValue
        : "Request failed.",
    );
  }

  return result as T;
}

export async function ensurePublicSession({
  businessId,
  source,
  landingPath,
}: {
  businessId: string;

  source:
    | string
    | null;

  landingPath: string;
}) {
  const storageKey =
    `leadnexus:session:${businessId}`;

  const stored =
    window.sessionStorage.getItem(
      storageKey,
    );

  const promiseKey =
    stored
      ? `${businessId}:${stored}`
      : businessId;

  const existingPromise =
    sessionPromises.get(
      promiseKey,
    );

  if (existingPromise) {
    return existingPromise;
  }

  const promise =
    postJson<{
      sessionId: string;
    }>(
      "/api/public/session",
      {
        businessId,

        existingSessionId:
          stored,

        anonymousId:
          getAnonymousId(),

        source,

        referrer:
          document.referrer ||
          null,

        landingPath,
      },
    ).then(
      (result) => {
        window.sessionStorage.setItem(
          storageKey,
          result.sessionId,
        );

        return result.sessionId;
      },
    );

  sessionPromises.set(
    promiseKey,
    promise,
  );

  try {
    return await promise;
  } finally {
    sessionPromises.delete(
      promiseKey,
    );
  }
}

export async function trackPublicActivity({
  businessId,
  sessionId,
  leadId = null,
  productId = null,
  eventType,
  pagePath = null,
  keepalive = false,
}: {
  businessId: string;
  sessionId: string;

  leadId?:
    | string
    | null;

  productId?:
    | string
    | null;

  eventType:
    PublicActivityEvent;

  pagePath?:
    | string
    | null;

  keepalive?: boolean;
}) {
  await postJson<{
    success: true;
  }>(
    "/api/public/activity",
    {
      businessId,
      sessionId,
      leadId,
      productId,
      eventType,
      pagePath,
    },
    {
      keepalive,
    },
  );
}

export async function submitPublicLead({
  businessId,
  sessionId,
  productId,
  name,
  phone,
  email,
}: {
  businessId: string;
  sessionId: string;

  productId:
    | string
    | null;

  name: string;
  phone: string;
  email: string;
}) {
  return postJson<{
    leadId: string;
  }>(
    "/api/public/lead",
    {
      businessId,
      sessionId,
      productId,
      name,
      phone,
      email,
    },
  );
}

export async function createPublicContact({
  businessId,
  sessionId,
  leadId,
  productId,
  channel,
}: {
  businessId: string;
  sessionId: string;
  leadId: string;

  productId:
    | string
    | null;

  channel:
    PublicContactChannel;
}) {
  return postJson<{
    url: string;
  }>(
    "/api/public/contact",
    {
      businessId,
      sessionId,
      leadId,
      productId,
      channel,
    },
  );
}