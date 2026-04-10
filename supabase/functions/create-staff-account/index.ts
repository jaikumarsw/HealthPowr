// Supabase Edge Function: create-staff-account
// Owner/admin creates a staff user directly (no invite email required).
// A temporary password is generated and returned to the owner to share securely.
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

/** Generates a secure random temporary password: 12 chars, mixed case + digits + symbol. */
function generateTempPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "@#!$";
  const all = upper + lower + digits + symbols;
  const arr = new Uint8Array(12);
  crypto.getRandomValues(arr);
  let pass = upper[arr[0] % upper.length]
    + lower[arr[1] % lower.length]
    + digits[arr[2] % digits.length]
    + symbols[arr[3] % symbols.length];
  for (let i = 4; i < 12; i++) pass += all[arr[i] % all.length];
  // shuffle
  return pass.split("").sort(() => 0.5 - Math.random()).join("");
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
      error: "Invalid username. Use 3-24 chars: a-z, 0-9, dot, underscore, dash.",
    });
  }
  if (payload.membershipRole !== "admin" && payload.membershipRole !== "member") {
    return json(400, { error: "Invalid membershipRole." });
  }

  // Verify caller is authenticated and is owner/admin of the org
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

  // Ensure username is unique within the org
  const { data: existingU } = await admin
    .from("organization_members")
    .select("profile_id")
    .eq("organization_id", payload.organizationId)
    .eq("username", username)
    .maybeSingle();
  if (existingU) {
    return json(400, { error: "Username already exists in this organization." });
  }

  const loginEmail = toStaffLoginEmail(username, orgName);
  const tempPassword = generateTempPassword();

  // Create the user directly (no invite email — avoids rate limits entirely).
  // email_confirm: true so the account is immediately active.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: personalEmail,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      full_name: payload.fullName ?? undefined,
      role: "organization",
      created_by_org: payload.organizationId,
      staff_username: username,
      staff_login_email: loginEmail,
    },
  });

  if (createErr || !created?.user) {
    const msg = createErr?.message ?? "Failed to create user";
    return json(400, { error: msg });
  }

  const staffId = created.user.id;

  // Upsert profile
  const { error: profileErr } = await admin.from("profiles").upsert({
    id: staffId,
    email: personalEmail,
    full_name: payload.fullName ?? null,
    role: "organization",
  });
  if (profileErr) return json(500, { error: profileErr.message });

  // Insert organization membership
  const { error: memberErr } = await admin.from("organization_members").insert({
    organization_id: payload.organizationId,
    profile_id: staffId,
    role: payload.membershipRole,
    username,
  });
  if (memberErr) return json(500, { error: memberErr.message });

  return json(200, {
    login_email: loginEmail,
    personal_email: personalEmail,
    temp_password: tempPassword,
  });
});
