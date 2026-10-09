import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export function safeEqualUtf8(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left, "utf8");
  const rightBytes = Buffer.from(right, "utf8");
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

export function verifyAutomationAuthorization(header: string | null, secret: string): boolean {
  if (!secret || !header?.startsWith("Bearer ")) return false;
  return safeEqualUtf8(header.slice(7), secret);
}

export function zoomWebhookSignature(secret: string, timestamp: string, rawBody: string): string {
  return `v0=${createHmac("sha256", secret).update(`v0:${timestamp}:${rawBody}`).digest("hex")}`;
}

export function verifyZoomWebhookSignature(input: {
  secret: string;
  timestamp: string | null;
  signature: string | null;
  rawBody: string;
  nowMs?: number;
  freshnessSeconds?: number;
}): boolean {
  const { secret, timestamp, signature, rawBody } = input;
  if (!secret || !timestamp || !signature || !/^\d+$/.test(timestamp)) return false;
  const nowMs = input.nowMs ?? Date.now();
  const freshnessMs = (input.freshnessSeconds ?? 300) * 1000;
  const signedAtMs = Number(timestamp) * 1000;
  if (!Number.isSafeInteger(signedAtMs) || Math.abs(nowMs - signedAtMs) > freshnessMs) return false;
  return safeEqualUtf8(signature, zoomWebhookSignature(secret, timestamp, rawBody));
}

export function endpointValidationToken(secret: string, plainToken: string): string {
  return createHmac("sha256", secret).update(plainToken).digest("hex");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Signs the one-click "stop weekly registration" link for an email address. */
export function optOutToken(secret: string, email: string): string {
  return createHmac("sha256", secret)
    .update(`la-sobremesa-optout:v1:${email.trim().toLowerCase()}`)
    .digest("hex");
}

export function verifyOptOutToken(secret: string, email: string, token: string): boolean {
  if (!secret || !email || !/^[0-9a-f]{64}$/.test(token)) return false;
  return safeEqualUtf8(token, optOutToken(secret, email));
}
