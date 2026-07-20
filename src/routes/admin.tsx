import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  adminGetOverview,
  adminCheckAccess,
  adminDeleteRegistration,
} from "@/lib/admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Panel de administración | Ayuda Sobria" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: AdminPage,
});

type Overview = Awaited<ReturnType<typeof adminGetOverview>>;

function AdminPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [data, setData] = useState<Overview | null>(null);

  async function load() {
    setLoading(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        navigate({ to: "/ingresar", search: { redirect: "/admin" } as any });
        return;
      }
      const check = await adminCheckAccess();
      if (!check.isAdmin) {
        setAuthorized(false);
        setLoading(false);
        return;
      }
      setAuthorized(true);
      const overview = await adminGetOverview();
      setData(overview);
    } catch (e: any) {
      toast.error(e?.message ?? "Error al cargar el panel");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta inscripción?")) return;
    try {
      await adminDeleteRegistration({ data: { id } });
      toast.success("Inscripción eliminada");
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Error al eliminar");
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Panel de administración</h1>
            <p className="text-sm text-muted-foreground">Ayuda Sobria — vista interna</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            Cerrar sesión
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Cargando…</p>
        ) : !authorized ? (
          <Card className="p-6">
            <h2 className="text-lg font-semibold">Acceso restringido</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Tu cuenta no tiene permisos de administrador. Si crees que esto es un error,
              escribe a matt@soberhelpline.com.
            </p>
          </Card>
        ) : (
          data && (
            <Tabs defaultValue="registrations" className="w-full">
              <TabsList className="flex flex-wrap">
                <TabsTrigger value="registrations">
                  Inscripciones ({data.registrations.length})
                </TabsTrigger>
                <TabsTrigger value="memberships">
                  Membresías ({data.memberships.length})
                </TabsTrigger>
                <TabsTrigger value="coaching">
                  Coaching ({data.coachingOrders.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="registrations" className="mt-4">
                <Card className="overflow-x-auto p-0">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/60 text-left">
                      <tr>
                        <th className="p-3">Fecha</th>
                        <th className="p-3">Nombre</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Teléfono</th>
                        <th className="p-3">Ubicación</th>
                        <th className="p-3">Relación</th>
                        <th className="p-3">Situación</th>
                        <th className="p-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.registrations.map((r: any) => (
                        <tr key={r.id} className="border-t border-border align-top">
                          <td className="p-3 whitespace-nowrap">
                            {new Date(r.created_at).toLocaleString("es-MX")}
                          </td>
                          <td className="p-3">{r.full_name}</td>
                          <td className="p-3">
                            <a href={`mailto:${r.email}`} className="text-primary">
                              {r.email}
                            </a>
                          </td>
                          <td className="p-3">{r.phone ?? "—"}</td>
                          <td className="p-3">{r.location ?? "—"}</td>
                          <td className="p-3">{r.relationship ?? "—"}</td>
                          <td className="p-3 max-w-xs">
                            <span className="line-clamp-3">{r.situation ?? "—"}</span>
                          </td>
                          <td className="p-3">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(r.id)}
                            >
                              Eliminar
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {data.registrations.length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-6 text-center text-muted-foreground">
                            Aún no hay inscripciones.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </Card>
              </TabsContent>

              <TabsContent value="memberships" className="mt-4">
                <Card className="overflow-x-auto p-0">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/60 text-left">
                      <tr>
                        <th className="p-3">Fecha</th>
                        <th className="p-3">Plan</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3">Monto (USD)</th>
                        <th className="p-3">Próximo cobro</th>
                        <th className="p-3">Suscripción PayPal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.memberships.map((m: any) => (
                        <tr key={m.id} className="border-t border-border">
                          <td className="p-3 whitespace-nowrap">
                            {new Date(m.created_at).toLocaleDateString("es-MX")}
                          </td>
                          <td className="p-3 capitalize">{m.plan_type}</td>
                          <td className="p-3 capitalize">{m.status}</td>
                          <td className="p-3">${Number(m.amount).toFixed(2)}</td>
                          <td className="p-3">
                            {m.next_billing_date
                              ? new Date(m.next_billing_date).toLocaleDateString("es-MX")
                              : "—"}
                          </td>
                          <td className="p-3 font-mono text-xs">{m.paypal_subscription_id}</td>
                        </tr>
                      ))}
                      {data.memberships.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-muted-foreground">
                            Aún no hay membresías.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </Card>
              </TabsContent>

              <TabsContent value="coaching" className="mt-4">
                <Card className="overflow-x-auto p-0">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/60 text-left">
                      <tr>
                        <th className="p-3">Fecha</th>
                        <th className="p-3">Cliente</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Sesión</th>
                        <th className="p-3">Monto (USD)</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3">Orden PayPal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.coachingOrders.map((o: any) => (
                        <tr key={o.id} className="border-t border-border">
                          <td className="p-3 whitespace-nowrap">
                            {new Date(o.created_at).toLocaleDateString("es-MX")}
                          </td>
                          <td className="p-3">{o.customer_name ?? "—"}</td>
                          <td className="p-3">{o.customer_email ?? "—"}</td>
                          <td className="p-3">{o.session_type}</td>
                          <td className="p-3">${Number(o.amount).toFixed(2)}</td>
                          <td className="p-3 capitalize">{o.status}</td>
                          <td className="p-3 font-mono text-xs">{o.paypal_order_id}</td>
                        </tr>
                      ))}
                      {data.coachingOrders.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-muted-foreground">
                            Aún no hay pagos de coaching.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </Card>
              </TabsContent>
            </Tabs>
          )
        )}
      </div>
    </SiteLayout>
  );
}