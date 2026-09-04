// Compare instants, not strings. Postgres returns timestamptz as
// "…T00:00:00+00:00" while callers pass Date#toISOString() ("…T00:00:00.000Z"),
// and those two formats do not order correctly under lexicographic comparison.
// Unparseable input returns false, so this access gate stays fail-closed.
function isAfter(value: string, reference: string): boolean {
  const at = Date.parse(value);
  const boundary = Date.parse(reference);
  return Number.isFinite(at) && Number.isFinite(boundary) && at > boundary;
}

export function membershipAllowsRecordingAccess(
  memberships: Array<{ status: string; access_ends_at: string | null }>,
  now: string,
): boolean {
  return memberships.some((membership) => {
    const endsAt = membership.access_ends_at;
    const notExpired = !endsAt || isAfter(endsAt, now);
    return (
      (membership.status === "active" && notExpired) ||
      (membership.status === "cancelled" && Boolean(endsAt) && isAfter(endsAt!, now))
    );
  });
}
