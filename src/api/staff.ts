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
    // Force a token refresh so the JWT sent to the Edge Function is always fresh.
    // getSession() can return a cached (expired) token; refreshSession() guarantees a new one.
    const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
    if (refreshErr || !refreshed.session) {
      throw new Error(
        refreshErr?.message || "Session expired — please sign in again."
      );
    }

    // Use the Supabase SDK's functions.invoke() which attaches the fresh JWT automatically.
    const { data, error } = await supabase.functions.invoke<{
      login_email: string;
      invited_email: string;
    }>("create-staff-account", { body: input });

    if (error) {
      console.error("[create-staff-account] error", error);

      // The SDK wraps the response body in error.message or error.context.
      // Try to extract a human-readable message from the JSON body.
      let msg = error.message || "Failed to create staff account.";
      try {
        const ctx = (error as any).context;
        if (ctx && typeof ctx.json === "function") {
          const body = await ctx.json();
          if (body?.error) msg = body.error;
          else if (body?.message) msg = body.message;
        }
      } catch {
        // ignore — use msg as-is
      }

      if (msg.toLowerCase().includes("not_found") || msg.toLowerCase().includes("404")) {
        throw new Error(
          "Staff account creation is unavailable — the server function is not deployed. Contact your system administrator."
        );
      }

      throw new Error(String(msg));
    }

    if (!data?.login_email) {
      throw new Error("Unexpected response from server. Please try again.");
    }

    return data;
  },
};
