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
    // Force a fresh token — getSession() can return a stale cached token.
    const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
    if (refreshErr || !refreshed.session) {
      throw new Error(refreshErr?.message || "Session expired — please sign in again.");
    }
    const accessToken = refreshed.session.access_token;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
    if (!supabaseUrl || !anonKey) {
      throw new Error("Missing Supabase configuration.");
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

    let body: Record<string, unknown> | null = null;
    try {
      body = await res.json();
    } catch {
      // non-JSON response
    }

    if (!res.ok) {
      console.error("[create-staff-account] error", { status: res.status, body });
      if (res.status === 404) {
        throw new Error("Staff account creation unavailable — server function not deployed. Contact your system administrator.");
      }
      const msg = (body?.error as string) || (body?.message as string) || `Request failed (${res.status}).`;
      throw new Error(msg);
    }

    const data = body as { login_email: string; invited_email: string } | null;
    if (!data?.login_email) {
      throw new Error("Unexpected response from server. Please try again.");
    }
    return data;
  },
};
