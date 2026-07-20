export function assertAdminRoleResult(
  data: { role: string } | null,
  error: { message: string } | null,
): void {
  if (error) throw new Error(error.message);
  if (data?.role !== "admin") throw new Error("Forbidden");
}
