import { supabase } from "@/integrations/supabase/client";

// Pages the Sober Helpline app opens carry ?from_app=1 (and ?sso_token=… when the member
// is signed in to the app). Same contract as soberhelpline.com.

const FROM_APP_KEY = "ayuda_from_app";

/** True when this visit started in the Sober Helpline app (for this browser tab). */
export function openedFromApp(): boolean {
  // The address bar counts too: pages read this before the root's hand-off runs.
  if (new URLSearchParams(window.location.search).get("from_app") === "1") return true;
  try {
    return sessionStorage.getItem(FROM_APP_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Runs once per page load in the browser: remembers that the visit came from the app,
 * removes the single-use sign-in token from the address bar, and exchanges it for a
 * session. Resolves true when a session was opened.
 */
export async function completeAppHandoff(): Promise<boolean> {
  const url = new URL(window.location.href);
  if (url.searchParams.get("from_app") === "1") {
    try {
      sessionStorage.setItem(FROM_APP_KEY, "1");
    } catch {
      /* storage optional */
    }
  }
  const token = url.searchParams.get("sso_token");
  if (!token) return false;
  // Never leave the token in history, bookmarks or shared links.
  url.searchParams.delete("sso_token");
  window.history.replaceState(window.history.state, "", url.toString());
  try {
    // Someone already signed in here keeps their session: a token in a link must not
    // switch the browser to a different account.
    const { data } = await supabase.auth.getSession();
    if (data.session) return false;
    const response = await fetch("/api/app-sso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!response.ok) return false;
    const { tokenHash } = (await response.json()) as { tokenHash?: string };
    if (!tokenHash) return false;
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
    return !error;
  } catch {
    return false;
  }
}
