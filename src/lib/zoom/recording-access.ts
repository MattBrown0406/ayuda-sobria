export function membershipAllowsRecordingAccess(
  memberships: Array<{ status: string; access_ends_at: string | null }>,
  now: string,
): boolean {
  return memberships.some((membership) => {
    const notExpired = !membership.access_ends_at || membership.access_ends_at > now;
    return (
      (membership.status === "active" && notExpired) ||
      (membership.status === "cancelled" &&
        Boolean(membership.access_ends_at) &&
        membership.access_ends_at! > now)
    );
  });
}
