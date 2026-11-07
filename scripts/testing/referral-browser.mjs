import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const origin = "http://127.0.0.1:4173";
for (let i = 0; i < 60; i++) {
  try {
    if ((await fetch(origin)).ok) break;
  } catch {}
  await new Promise(resolve => setTimeout(resolve, 500));
}
await mkdir("test-results", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.setDefaultTimeout(15000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
let featureEnabled = true,
  role = "admin",
  events = [],
  noCandidates = false;
const now = new Date().toISOString();
const referral = {
  id: 9001,
  handymanId: 7,
  createdByAdminId: 1,
  title: "TEST ceiling repair",
  description: "Synthetic scope only",
  category: "Repairs",
  homeownerName: "Synthetic Customer",
  homeownerPhone: "3065550100",
  address: "Test address",
  photos: [],
  status: "accepted",
  commissionRate: "20.00",
  createdAt: now,
  updatedAt: now,
};
const eligible = {
  userId: 7,
  userName: "Eligible fixture",
  userType: "handyman",
  identityVerificationStatus: "approved",
  referralAccess: "active",
  serviceArea: "Saskatoon",
  ineligibleReason: null,
};
const candidates = [
  eligible,
  {
    ...eligible,
    userId: 8,
    userName: "Pending fixture",
    identityVerificationStatus: "pending",
    ineligibleReason: "ID Name Matched required",
  },
  {
    ...eligible,
    userId: 9,
    userName: "Blocked fixture",
    referralAccess: "blocked",
    ineligibleReason: "Referral access blocked",
  },
];
await page.route("**/api/trpc/**", async route => {
  const names = new URL(route.request().url()).pathname
    .split("/api/trpc/")[1]
    .split(",");
  const results = names.map(name => {
    let json = [];
    if (name === "auth.me")
      json = {
        id: role === "admin" ? 1 : 7,
        name: "Synthetic User",
        role,
        userType: role === "admin" ? "homeowner" : "handyman",
        email: "fixture@example.invalid",
        emailVerified: true,
      };
    if (name === "admin.getStats" || name === "payments.getHandymanEarnings")
      json = {};
    if (name === "handymanProfiles.get")
      json = {
        userId: 7,
        identityVerificationStatus: "approved",
        categories: '["Repairs"]',
        bio: "Synthetic handyman profile for browser checks",
        serviceArea: "Saskatoon",
      };
    if (name === "admin.getInsuranceQueue") json = candidates;
    if (name === "admin.getReferralJobs" || name === "referralJobs.getMine")
      json = [referral];
    if (name === "referralAssignments.list")
      json = noCandidates
        ? candidates.filter(c => c.ineligibleReason)
        : candidates;
    if (name === "referralWorkflow.config") json = { enabled: featureEnabled };
    if (name === "referralWorkflow.summary")
      json = [
        {
          id: 9001,
          title: referral.title,
          nextAction: "Contact the homeowner to confirm scope and availability",
        },
      ];
    if (name === "referralWorkflow.get")
      json = {
        events,
        quotes: [
          { id: 55, status: "draft", totalAmount: "200.00", expiresAt: null },
        ],
        nextAction: "Draft quote saved — review and send it",
        canUpdate: true,
      };
    if (name === "referralWorkflow.add") {
      json = { success: true };
      events = [
        {
          id: 1,
          kind: "customer_contacted",
          note: "Confirmed scope",
          scheduledAt: null,
          createdAt: now,
          candidateId: null,
          candidateName: null,
        },
      ];
    }
    if (name === "notifications.getUnreadCount") json = 0;
    return { result: { data: { json } } };
  });
  await route.fulfill({
    contentType: "application/json",
    body: JSON.stringify(results),
  });
});
// Prevent third-party analytics or provider traffic from this synthetic UI check.
await page.route(/https:\/\//, route => route.abort());
try {
  await page.goto(`${origin}/admin`);
  await page.getByText("Referral next actions", { exact: true }).waitFor();
  await page.getByLabel(/^Assign to handyman/).locator('option[value="7"]').waitFor({ state: "attached" });
  const options = await page
    .getByLabel(/^Assign to handyman/)
    .locator("option")
    .allTextContents();
  assert(options.some(s => s.includes("Eligible fixture")));
  assert(
    !options.some(
      s => s.includes("Pending fixture") || s.includes("Blocked fixture")
    )
  );
  await page
    .getByText("Progress, outreach and linked quotes", { exact: true })
    .click();
  await page.getByText("Quote #55", { exact: false }).waitFor();
  await page
    .getByLabel("Private admin note", { exact: true })
    .fill("Confirmed scope");
  await page
    .getByRole("button", { name: "Save progress", exact: true })
    .click();
  await page.getByText("Confirmed scope", { exact: true }).waitFor();
  await page
    .getByLabel(/^Update/)
    .selectOption("outreach_sent");
  await page
    .getByText("Records outreach you have already made.", { exact: false })
    .waitFor();
  await page
    .locator("#referral-9001")
    .screenshot({ path: "test-results/admin-referral.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  assert(
    !(await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth
    )),
    "Mobile horizontal overflow"
  );
  await page
    .locator("#referral-9001")
    .screenshot({ path: "test-results/admin-referral-mobile.png" });
  noCandidates = true;
  await page.reload();
  await page
    .getByText("No ID-matched handymen available.", { exact: true })
    .waitFor();
  await page.getByText("Review assigned handyman:", { exact: false }).waitFor();
  assert(
    await page
      .getByRole("button", { name: "Send referral", exact: true })
      .isDisabled()
  );
  featureEnabled = false;
  await page.reload();
  await page
    .getByText("No ID-matched handymen available.", { exact: true })
    .waitFor();
  assert.equal(
    await page.getByText("Referral next actions", { exact: true }).count(),
    0
  );
  assert.equal(
    await page
      .getByText("Progress, outreach and linked quotes", { exact: true })
      .count(),
    0
  );
  role = "user";
  featureEnabled = true;
  await page.goto(`${origin}/handyman/dashboard`);
  await page
    .getByText("Progress, outreach and linked quotes", { exact: true })
    .click();
  await page.getByLabel("Note for SaskHandy", { exact: true }).waitFor();
  const kinds = await page
    .getByLabel(/^Update/)
    .locator("option")
    .allTextContents();
  assert.deepEqual(kinds, ["Customer contacted", "Visit booked", "Note"]);
  await page.getByLabel(/^Update/).selectOption("visit_booked");
  await page
    .getByLabel("Visit date and time (your local time)", { exact: true })
    .waitFor();
  await page
    .getByText("Progress, outreach and linked quotes", { exact: true })
    .locator("..")
    .screenshot({ path: "test-results/handyman-progress.png" });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: eligible-only assignment, empty state, preserved referral warning, progress saving, outreach guidance, mobile layout, feature off, handyman controls"
  );
} catch (error) {
  await page.screenshot({ path: "test-results/failure.png", fullPage: true });
  console.error(await page.locator("body").innerText());
  throw error;
} finally {
  await browser.close();
}
