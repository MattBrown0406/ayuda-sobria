import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

// Execute the actual route code with all external effects replaced. No real
// database, Zoom, mail or hub requests are possible in these tests.
function loadModule(path: string, mocks: Record<string, unknown>, extra: Record<string, unknown> = {}) {
  const exports: Record<string, any> = {};
  const source = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, {
    exports, Response, Request, Headers, TextEncoder, AbortSignal, console,
    process: { env: {} },
    require: (id: string) => {
      if (!(id in mocks)) throw new Error(`Unexpected dependency: ${id}`);
      return mocks[id];
    },
    ...extra,
  });
  return exports;
}

const router = { createFileRoute: () => (options: unknown) => options };
const payload = { nombre: "Ana", email: "Ana@Example.com", telefono: "+15555550100", relacion: "Mi hijo/a", formMs: 5000, newsletter: true };
const request = (body = payload) => new Request("https://example.test/api/register", {
  method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" },
});

test("Zoom successes forward consent and Spanish form contact fields, preserving the response", async () => {
  for (const newsletter of [false, true]) {
    const events: any[] = [];
    const response = Response.json({ ok: true, emailSent: true });
    const module = loadModule("src/routes/api.zoom.register.ts", {
      "@tanstack/react-router": router,
      "@/lib/zoom/abuse.server": { checkPublicRegistrationAbuse: async () => ({ allowed: true }) },
      "@/lib/zoom/registration.server": { createRegistrationHandler: () => async () => response },
      "@/lib/zoom/client.server": { zoomClientFromEnv: () => ({}) },
      "@/lib/zoom/email.server": { registrationMailerFromEnv: () => ({}) },
      "@/lib/zoom/supabase-store.server": { createSupabaseZoomStore: () => ({}) },
      "@/integrations/supabase/client.server": { supabaseAdmin: {} },
      "@/lib/spine.server": { sendSpineEvent: async (evt: unknown) => { events.push(evt); } },
    });
    assert.equal(await module['Route'].server.handlers.POST({ request: request({ ...payload, newsletter }) }), response);
    assert.equal(events.length, 1);
    assert.equal(events[0].event, "lead_captured");
    assert.equal(events[0].name, "Ana");
    assert.equal(events[0].phone, "+15555550100");
    assert.equal(events[0].props.source, "zoom_sobremesa_registration");
    assert.equal(events[0].props.marketing_consent, newsletter);
  }
});

test("Zoom failures and honeypot fake successes do not reach the hub", async () => {
  for (const trapped of [false, true]) {
    let events = 0;
    const module = loadModule("src/routes/api.zoom.register.ts", {
      "@tanstack/react-router": router,
      "@/lib/zoom/abuse.server": { checkPublicRegistrationAbuse: async () => ({ allowed: !trapped, trapped }) },
      "@/lib/zoom/registration.server": { createRegistrationHandler: () => async () => Response.json({}, { status: 502 }) },
      "@/lib/zoom/client.server": { zoomClientFromEnv: () => ({}) },
      "@/lib/zoom/email.server": { registrationMailerFromEnv: () => ({}) },
      "@/lib/zoom/supabase-store.server": { createSupabaseZoomStore: () => ({}) },
      "@/integrations/supabase/client.server": { supabaseAdmin: {} },
      "@/lib/spine.server": { sendSpineEvent: async () => { events += 1; } },
    });
    await module['Route'].server.handlers.POST({ request: request() });
    assert.equal(events, 0);
  }
});

test("fallback forwards only after mail success, with explicit newsletter consent", async () => {
  for (const status of [200, 502]) {
    for (const newsletter of [true, false]) {
      const events: any[] = [];
      const module = loadModule("src/routes/api.registro.ts", {
        "@tanstack/react-router": router,
        "@/lib/rate-limit.server": { limitKey: () => "test", requestIp: () => "test", withinRateLimit: async () => true },
        "@/lib/spine.server": { sendSpineEvent: async (evt: unknown) => { events.push(evt); } },
      }, {
        process: { env: { RESEND_API_KEY: "test-only", LOVABLE_API_KEY: "test-only" } },
        fetch: async () => new Response(null, { status }),
        console: { error: () => {} },
      });
      const response = await module['Route'].server.handlers.POST({ request: request({ ...payload, newsletter }) });
      assert.equal(response.status, status);
      assert.equal(events.length, status === 200 ? 1 : 0);
      if (status === 200) {
        assert.equal(events[0].email, "ana@example.com");
        assert.equal(events[0].props.source, "registro_form");
        assert.equal(events[0].props.marketing_consent, newsletter);
        assert.equal(events[0].props.request_followup, false);
      }
    }
  }
});

test("hub helper normalizes email, tags property, bounds delivery and never throws", async () => {
  let calls = 0;
  let sent: any;
  const env: Record<string, string> = { HUB_INGEST_URL: "https://hub.example.test/ingest", HUB_INGEST_KEY: "test-only" };
  const module = loadModule("src/lib/spine.server.ts", {}, {
    process: { env }, console: { error: () => {} },
    fetch: async (_url: string, init: RequestInit) => {
      calls += 1;
      sent = JSON.parse(String(init.body));
      assert.ok(init.signal);
      if (calls === 2) throw new Error("simulated outage");
      return new Response(null, { status: 503 });
    },
  });
  await module['sendSpineEvent']({ email: " Ana@Example.com ", event: "lead_captured" });
  assert.equal(sent.email, "ana@example.com");
  assert.equal(sent.property, "ayudasobria");
  await assert.doesNotReject(module['sendSpineEvent']({ email: "ana@example.com", event: "lead_captured" }));
  delete env['HUB_INGEST_KEY'];
  await module['sendSpineEvent']({ email: "ana@example.com", event: "lead_captured" });
  env['HUB_INGEST_KEY'] = "test-only";
  await module['sendSpineEvent']({ email: " ", event: "lead_captured" });
  assert.equal(calls, 2);
});