const BREVO_API_KEY = process.env.BREVO_API_KEY ?? "";
const BREVO_HOMEOWNERS_LIST_ID = Number(process.env.BREVO_HOMEOWNERS_LIST_ID ?? "0");
const BREVO_HANDYMEN_LIST_ID = Number(process.env.BREVO_HANDYMEN_LIST_ID ?? "0");

type UserType = "homeowner" | "handyman";

function getBrevoListId(userType: UserType) {
  return userType === "homeowner" ? BREVO_HOMEOWNERS_LIST_ID : BREVO_HANDYMEN_LIST_ID;
}

function getOppositeBrevoListId(userType: UserType) {
  return userType === "homeowner" ? BREVO_HANDYMEN_LIST_ID : BREVO_HOMEOWNERS_LIST_ID;
}

function isBrevoConfigured() {
  return Boolean(
    BREVO_API_KEY &&
      BREVO_HOMEOWNERS_LIST_ID > 0 &&
      BREVO_HANDYMEN_LIST_ID > 0
  );
}

export async function syncUserToBrevo(params: {
  email: string;
  name?: string | null;
  userType: UserType;
  marketingOptIn?: boolean;
}) {
  if (!isBrevoConfigured()) {
    console.warn("[Brevo] Skipping sync because Brevo env vars are not fully configured.");
    return;
  }

  const listId = getBrevoListId(params.userType);
  const oppositeListId = getOppositeBrevoListId(params.userType);

  const response = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": BREVO_API_KEY,
      accept: "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      attributes: {
        FIRSTNAME: params.name ?? "",
        USERTYPE: params.userType,
        EMAIL_FREQ: "biweekly",
      },
      listIds: [listId],
      updateEnabled: true,
      emailBlacklisted: params.marketingOptIn === false,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Brevo contact upsert failed: ${response.status} ${text}`);
  }

  const removeResponse = await fetch(
    `https://api.brevo.com/v3/contacts/lists/${oppositeListId}/contacts/remove`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
        accept: "application/json",
      },
      body: JSON.stringify({
        emails: [params.email],
      }),
    }
  );

  if (!removeResponse.ok && removeResponse.status !== 404) {
    const text = await removeResponse.text().catch(() => "");
    console.warn(
      `[Brevo] Could not remove ${params.email} from opposite list: ${removeResponse.status} ${text}`
    );
  }
}