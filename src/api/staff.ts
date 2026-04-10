import { supabase } from "../lib/supabase";

export const staffApi = {
  async createStaffAccount(input: {
    organizationId: string;
    organizationName: string;
    username: string;
    personalEmail: string;
    fullName?: string;
    membershipRole: "admin" | "member";
  }): Promise<{ login_email: string; invited_email: string }> {
    // Ensure the Edge Function receives an auth JWT.
    // In some environments, `functions.invoke` may not attach it reliably.
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionError) {
      throw new Error(sessionError.message || "Failed to read session.");
    }
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      throw new Error("You must be signed in to create staff accounts.");
    }

    // Use fetch() so we can read the response body (Supabase SDK exposes it as a stream).
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
    if (!supabaseUrl || !anonKey) {
      throw new Error("Missing Supabase env vars (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).");
    }

    const res = await fetch(`${supabaseUrl}/functions/v1/create-staff-account`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    const text = await res.text();
    const maybeJson = (() => {
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    })();

    if (!res.ok) {
      console.error("[create-staff-account] error", {
        status: res.status,
        body: maybeJson ?? text,
      });
      if (res.status === 404) {
        throw new Error(
          "Staff account creation is not available yet — the server function has not been deployed. Contact your system administrator."
        );
      }
      const msg =
        (maybeJson && (maybeJson.error || maybeJson.message)) ||
        `Edge Function failed (${res.status}).`;
      throw new Error(String(msg));
    }

    return (maybeJson ?? {}) as { login_email: string; invited_email: string };
  },
};

