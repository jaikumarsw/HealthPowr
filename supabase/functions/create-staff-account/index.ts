// Supabase Edge Function: create-staff-account
// Owner/admin creates a staff user and sends a Supabase invite email
// (built-in) to the staff member's PERSONAL email address.
//
// Required secrets (set in Supabase function env, NOT in frontend):
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function toOrgSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function toStaffLoginEmail(username: string, orgName: string) {
  const u = username.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "");
  const orgSlug = toOrgSlug(orgName) || "org";
  return `${u}@${orgSlug}.healthpowr.app`;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
        "access-control-allow-methods": "POST, OPTIONS",
      },
    });
  }
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader) return json(401, { error: "Missing Authorization header" });
  const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return json(401, { error: "Missing bearer token" });

  // IMPORTANT: do NOT forward the caller JWT as the client's Authorization header.
  // If we do, admin operations (inviteUserByEmail) will run as the caller instead of service role.
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const payload = await req.json().catch(() => null) as null | {
    organizationId: string;
    organizationName: string;
    username: string;
    personalEmail: string;
    fullName?: string;
    membershipRole: "admin" | "member";
  };
  if (!payload?.organizationId || !payload.organizationName || !payload.username || !payload.personalEmail) {
    return json(400, { error: "Missing required fields" });
  }

  const personalEmail = payload.personalEmail.trim().toLowerCase();
  const username = normalizeUsername(payload.username);
  const orgName = String(payload.organizationName ?? "").trim();

  if (!isValidEmail(personalEmail)) {
    return json(400, { error: "Invalid personalEmail. Provide a valid email address." });
  }
  if (!orgName) {
    return json(400, { error: "Invalid organizationName." });
  }
  if (!username || username.length < 3 || username.length > 24 || !/^[a-z0-9._-]+$/.test(username)) {
    return json(400, {
      error:
        "Invalid username. Use 3-24 chars: a-z, 0-9, dot, underscore, dash.",
    });
  }
  if (payload.membershipRole !== "admin" && payload.membershipRole !== "member") {
    return json(400, { error: "Invalid membershipRole." });
  }

  // Verify caller
  const { data: caller, error: callerErr } = await admin.auth.getUser(jwt);
  if (callerErr || !caller?.user) return json(401, { error: "Not authenticated" });

  const callerId = caller.user.id;
  const { data: membership, error: membershipErr } = await admin
    .from("organization_members")
    .select("role")
    .eq("organization_id", payload.organizationId)
    .eq("profile_id", callerId)
    .maybeSingle();
  if (membershipErr) return json(500, { error: membershipErr.message });
  if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
    return json(403, { error: "Only org owner/admin can create staff accounts" });
  }

  // Ensure username unique within org
  const { data: existingU, error: existingUErr } = await admin
    .from("organization_members")
    .select("profile_id")
    .eq("organization_id", payload.organizationId)
    .eq("username", username)
    .maybeSingle();
  if (existingUErr) return json(500, { error: existingUErr.message });
  if (existingU) {
    return json(400, { error: "Username already exists in this organization." });
  }

  const loginEmail = toStaffLoginEmail(username, orgName);

  // Create auth user + send Supabase invite email to PERSONAL email.
  // Staff will set their password via invite link.
  const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(
    personalEmail,
    {
      data: {
        full_name: payload.fullName ?? undefined,
        role: "organization",
        created_by_org: payload.organizationId,
        staff_username: username,
        staff_login_email: loginEmail,
      },
    },
  );
  if (inviteErr || !invited?.user) {
    const msg = inviteErr?.message ?? "Failed to invite user";
    // Common when signups/invites are disabled in Auth settings.
    if (msg.toLowerCase().includes("user not allowed")) {
      return json(400, {
        error:
          "Supabase Auth blocked inviting users (User not allowed). Enable Email provider and allow signups/invites in Auth settings.",
      });
    }
    return json(400, { error: msg });
  }

  const staffId = invited.user.id;

  // Upsert profile + membership
  const { error: profileErr } = await admin.from("profiles").upsert({
    id: staffId,
    email: personalEmail,
    full_name: payload.fullName ?? null,
    role: "organization",
  });
  if (profileErr) return json(500, { error: profileErr.message });

  const { error: memberErr } = await admin.from("organization_members").insert({
    organization_id: payload.organizationId,
    profile_id: staffId,
    role: payload.membershipRole,
    username,
  });
  if (memberErr) return json(500, { error: memberErr.message });

  return json(200, {
    login_email: loginEmail,
    invited_email: personalEmail,
  });
});

