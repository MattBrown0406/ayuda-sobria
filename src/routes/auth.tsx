import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { PageHero } from "@/components/site/SiteLayout";

type AuthSearch = { redirect?: string; reset?: string };

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Ingresar o registrarse — Ayuda Sobria" },
      {
        name: "description",
        content: "Ingresa a tu cuenta o crea una nueva para acceder a la membresía familiar.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): AuthSearch => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
    reset: typeof s.reset === "string" ? s.reset : undefined,
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const redirectTo = sanitize(search.redirect) ?? "/membresia";
  // "forgot" asks for a reset link; "update" sets the new password after following it.
  const [mode, setMode] = useState<"signin" | "signup" | "forgot" | "update">(
    search.reset ? "update" : "signin",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    // The recovery link signs the person in; stay here so they can set a new password.
    if (search.reset) {
      // An expired or already-used link (email scanners often open it first) arrives
      // with an error and no session: say so and offer a new link instead of a form
      // that can never save.
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      const expired = /error_code=|error=/.test(hash);
      void supabase.auth.getSession().then(({ data }) => {
        if (expired || !data.session) {
          setMode("forgot");
          setError("El enlace para cambiar la contraseña venció o ya se usó. Pide uno nuevo aquí.");
        }
      });
      return;
    }
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setMode("update");
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: redirectTo });
    });
  }, [navigate, redirectTo, search.reset]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("update");
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          // A non-numeric value: the router JSON-parses search params, so "1" would
          // arrive as a number and be dropped by validateSearch.
          redirectTo: `${window.location.origin}/auth?reset=password`,
        });
        if (error) throw error;
        setInfo(
          "Si existe una cuenta con ese correo, te enviamos un enlace para crear una nueva contraseña.",
        );
      } else if (mode === "update") {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setInfo("Listo. Tu contraseña fue actualizada.");
        navigate({ to: redirectTo });
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${redirectTo}`,
            data: { first_name: firstName, last_name: lastName },
          },
        });
        if (error) throw error;
        if (data.session) {
          // Auto-confirm is enabled: the user is already signed in.
          navigate({ to: redirectTo });
        } else {
          setInfo("Cuenta creada. Revisa tu correo para confirmar y luego ingresa.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: redirectTo });
      }
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    try {
      sessionStorage.setItem("post_auth_redirect", redirectTo);
    } catch {
      /* ignore */
    }
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("No se pudo iniciar sesión con Google. Inténtalo de nuevo.");
      return;
    }
    if (result.redirected) return;
    try {
      sessionStorage.removeItem("post_auth_redirect");
    } catch {
      /* ignore */
    }
    navigate({ to: redirectTo });
  }

  return (
    <>
      <PageHero
        eyebrow="Acceso de miembros"
        title={
          mode === "signin"
            ? "Ingresa a tu cuenta"
            : mode === "signup"
              ? "Crea tu cuenta"
              : mode === "forgot"
                ? "Recupera tu contraseña"
                : "Crea una nueva contraseña"
        }
        description="Accede a la membresía familiar, tus sesiones y recursos privados."
      />
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          {(mode === "signin" || mode === "signup") && (
            <>
              <button
                type="button"
                onClick={handleGoogle}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Continuar con Google
              </button>
              <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" /> o con correo{" "}
                <div className="h-px flex-1 bg-border" />
              </div>
            </>
          )}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-2">
                <input
                  required
                  aria-label="Nombre"
                  placeholder="Nombre"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <input
                  required
                  aria-label="Apellido"
                  placeholder="Apellido"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            )}
            {mode !== "update" && (
              <input
                required
                type="email"
                aria-label="Correo electrónico"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            )}
            {mode !== "forgot" && (
              <input
                required
                type="password"
                minLength={8}
                aria-label={mode === "update" ? "Nueva contraseña" : "Contraseña"}
                placeholder={
                  mode === "update" ? "Nueva contraseña (mín. 8)" : "Contraseña (mín. 8)"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            {info && <p className="text-sm text-emerald-700">{info}</p>}
            <button
              disabled={loading}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading
                ? "Procesando..."
                : mode === "signin"
                  ? "Ingresar"
                  : mode === "signup"
                    ? "Crear cuenta"
                    : mode === "forgot"
                      ? "Enviar enlace"
                      : "Guardar contraseña"}
            </button>
          </form>
          {mode === "signin" && (
            <p className="mt-3 text-center text-sm">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setInfo(null);
                  setMode("forgot");
                }}
                className="text-primary hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </p>
          )}
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
            <button
              type="button"
              onClick={() => {
                setError(null);
                setInfo(null);
                setMode(mode === "signin" ? "signup" : "signin");
              }}
              className="font-medium text-primary hover:underline"
            >
              {mode === "signin" ? "Regístrate" : "Ingresa"}
            </button>
          </p>
        </div>
      </div>
    </>
  );
}

function authErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : "";
  if (/invalid login credentials/i.test(msg)) return "Correo o contraseña incorrectos.";
  if (/auth session missing|session.*expired|otp.*expired/i.test(msg))
    return "El enlace para cambiar la contraseña venció. Pide uno nuevo con «¿Olvidaste tu contraseña?».";
  if (/already registered/i.test(msg))
    return "Ya existe una cuenta con este correo. Intenta ingresar.";
  if (/email not confirmed/i.test(msg))
    return "Confirma tu correo antes de ingresar. Revisa tu bandeja de entrada.";
  if (/rate limit/i.test(msg)) return "Demasiados intentos. Espera unos minutos.";
  if (/password should be/i.test(msg)) return "La contraseña debe tener al menos 8 caracteres.";
  return "No se pudo completar la solicitud. Inténtalo de nuevo.";
}

function sanitize(path?: string): string | null {
  if (!path) return null;
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  return path;
}
