import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { adminCheckAccess, adminGetOverview, adminDeleteRegistration } from "@/lib/admin.functions";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Portal de administración — Ayuda Sobria" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

type Overview = Awaited<ReturnType<typeof adminGetOverview>>;

function AdminPage() {
  const navigate = useNavigate();
  const check = useServerFn(adminCheckAccess);
  const load = useServerFn(adminGetOverview);
  const del = useServerFn(adminDeleteRegistration);

  const [status, setStatus] = useState<"loading" | "unauth" | "forbidden" | "ready">("loading");
  const [data, setData] = useState<Overview | null>(null);

  async function refresh() {
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        setStatus("unauth");
        return;
      }
      const access = await check();
      if (!access.isAdmin) {
        setStatus("forbidden");
        return;
      }
      const overview = await load();
      setData(overview);
      setStatus("ready");
    } catch (e) {
      console.error(e);
      setStatus("forbidden");
    }
  }

  useEffect(() => {
    void refresh();
    // The access and overview check should run once when the portal mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta inscripción?")) return;
    try {
      await del({ data: { id } });
      toast.success("Inscripción eliminada");
      refresh();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar");
    }
  }

  if (status === "loading") {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted-foreground">
          Cargando…
        </div>
      </SiteLayout>
    );
  }

  if (status === "unauth") {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-md px-4 py-16 text-center space-y-4">
          <h1 className="text-2xl font-semibold">Portal de administración</h1>
          <p className="text-muted-foreground">Inicia sesión para continuar.</p>
          <Button onClick={() => navigate({ to: "/auth" })}>Iniciar sesión</Button>
        </div>
      </SiteLayout>
    );
  }

  if (status === "forbidden") {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-md px-4 py-16 text-center space-y-4">
          <h1 className="text-2xl font-semibold">Sin acceso</h1>
          <p className="text-muted-foreground">Tu cuenta no tiene permisos de administrador.</p>
          <Link to="/" className="text-primary underline">
            Volver al inicio
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const d = data!;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-semibold">Portal de administración</h1>
          <p className="text-muted-foreground">Ayuda Sobria — panel interno</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Inscripciones</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">{d.stats.registrations}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Miembros activos</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">{d.stats.activeMembers}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Pagos de coaching</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">{d.stats.coachingOrders}</CardContent>
          </Card>
        </div>

        <Tabs defaultValue="registrations">
          <TabsList>
            <TabsTrigger value="registrations">Inscripciones</TabsTrigger>
            <TabsTrigger value="memberships">Membresías</TabsTrigger>
            <TabsTrigger value="coaching">Coaching</TabsTrigger>
          </TabsList>

          <TabsContent value="registrations">
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Nombre</th>
                      <th className="p-3">Correo</th>
                      <th className="p-3">Teléfono</th>
                      <th className="p-3">Relación</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.registrations.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-muted-foreground">
                          Sin inscripciones aún.
                        </td>
                      </tr>
                    )}
                    {d.registrations.map((r) => (
                      <tr key={r.id} className="border-t">
                        <td className="p-3">{new Date(r.created_at).toLocaleString("es")}</td>
                        <td className="p-3">{r.full_name}</td>
                        <td className="p-3">{r.email}</td>
                        <td className="p-3">{r.phone ?? "—"}</td>
                        <td className="p-3">{r.relationship ?? "—"}</td>
                        <td className="p-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)}>
                            Eliminar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="memberships">
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Usuario</th>
                      <th className="p-3">Plan</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3">Monto</th>
                      <th className="p-3">Próximo cobro</th>
                      <th className="p-3">PayPal ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.memberships.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-muted-foreground">
                          Sin membresías aún.
                        </td>
                      </tr>
                    )}
                    {d.memberships.map((m) => (
                      <tr key={m.id} className="border-t">
                        <td className="p-3">{new Date(m.created_at).toLocaleDateString("es")}</td>
                        <td className="p-3">
                          {m.profile
                            ? `${m.profile.first_name ?? ""} ${m.profile.last_name ?? ""}`.trim() ||
                              m.user_id.slice(0, 8)
                            : m.user_id.slice(0, 8)}
                        </td>
                        <td className="p-3">{m.plan_type ?? "monthly"}</td>
                        <td className="p-3">{m.status}</td>
                        <td className="p-3">${m.amount}</td>
                        <td className="p-3">
                          {m.next_billing_date
                            ? new Date(m.next_billing_date).toLocaleDateString("es")
                            : "—"}
                        </td>
                        <td className="p-3 font-mono text-xs">{m.paypal_subscription_id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coaching">
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Cliente</th>
                      <th className="p-3">Correo</th>
                      <th className="p-3">Sesión</th>
                      <th className="p-3">Monto</th>
                      <th className="p-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.coaching.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-muted-foreground">
                          Sin pagos aún.
                        </td>
                      </tr>
                    )}
                    {d.coaching.map((c) => (
                      <tr key={c.id} className="border-t">
                        <td className="p-3">{new Date(c.created_at).toLocaleDateString("es")}</td>
                        <td className="p-3">{c.customer_name ?? "—"}</td>
                        <td className="p-3">{c.customer_email ?? "—"}</td>
                        <td className="p-3">{c.session_type}</td>
                        <td className="p-3">${c.amount}</td>
                        <td className="p-3">{c.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SiteLayout>
  );
}
