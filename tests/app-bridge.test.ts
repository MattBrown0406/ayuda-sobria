import test from "node:test";
import assert from "node:assert/strict";
import {
  APP_ACCESS_FRESH_MS,
  appAccessIsCurrent,
  fetchAppMembers,
  parseExportPage,
  redeemAppSsoToken,
} from "../src/lib/app-bridge.server.ts";
import { weeklyAutomationPlan } from "../src/lib/zoom/time.ts";

test("membership-export pages are validated strictly", () => {
  assert.deepEqual(
    parseExportPage({
      members: [{ email: " Ana@Example.com ", tier: "premium", expires_at: null }],
      next_cursor: null,
    }),
    {
      members: [{ email: "ana@example.com", tier: "premier", expires_at: null }],
      nextCursor: null,
    },
  );
  assert.throws(() => parseExportPage({ members: [{ email: "x", tier: "essential" }] }));
  assert.throws(() => parseExportPage({ members: [{ email: "a@b.co", tier: "gold" }] }));
  assert.throws(() => parseExportPage({ nope: true }));
});

test("a partial export never counts as the full list", async () => {
  let calls = 0;
  const fetchImpl = (async () => {
    calls += 1;
    if (calls === 1) {
      return Response.json({
        members: [{ email: "a@b.co", tier: "essential", expires_at: null }],
        next_cursor: "c1",
      });
    }
    return new Response("boom", { status: 500 });
  }) as typeof fetch;
  await assert.rejects(fetchAppMembers("secret", fetchImpl), /membership-export failed/);
});

test("app access counts only while recently confirmed and unexpired", () => {
  const now = Date.parse("2026-10-10T12:00:00Z");
  const fresh = new Date(now - 60_000).toISOString();
  const stale = new Date(now - APP_ACCESS_FRESH_MS - 1).toISOString();
  assert.equal(appAccessIsCurrent({ expires_at: null, synced_at: fresh }, now), true);
  assert.equal(appAccessIsCurrent({ expires_at: null, synced_at: stale }, now), false);
  assert.equal(
    appAccessIsCurrent({ expires_at: "2026-10-09T00:00:00Z", synced_at: fresh }, now),
    false,
  );
  assert.equal(appAccessIsCurrent(null, now), false);
});

test("app sign-in tokens: valid, spent, and refused secret", async () => {
  const reply = (status: number, body: unknown) =>
    (async () => Response.json(body, { status })) as typeof fetch;
  assert.deepEqual(
    await redeemAppSsoToken(
      "t",
      "s",
      reply(200, {
        valid: true,
        email: "Ana@Example.com",
        first_name: "Ana",
        tier: "essential",
        member: true,
      }),
    ),
    { email: "ana@example.com", firstName: "Ana", tier: "essential", member: true },
  );
  assert.equal(
    await redeemAppSsoToken("t", "s", reply(200, { valid: false, reason: "invalid" })),
    null,
  );
  await assert.rejects(redeemAppSsoToken("t", "s", reply(401, { valid: false })), /refused/);
});

test("app memberships are mirrored once a night at 3 AM Pacific", () => {
  assert.equal(weeklyAutomationPlan(new Date("2026-10-10T10:00:00Z")).appMembers, true); // 3:00 PDT
  assert.equal(weeklyAutomationPlan(new Date("2026-10-10T10:15:00Z")).appMembers, false);
  assert.equal(weeklyAutomationPlan(new Date("2026-11-10T11:00:00Z")).appMembers, true); // 3:00 PST
});
