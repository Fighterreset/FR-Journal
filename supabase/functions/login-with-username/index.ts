import { createClient } from "npm:@supabase/supabase-js@2";

// The embedded app is served from its Vercel origin. Include the main site for
// cases where the app itself is opened directly from the website.
const ALLOWED_ORIGINS = new Set([
  "https://fighterjournal.vercel.app",
  "https://fighterreset.hu",
  "https://www.fighterreset.hu",
  "http://localhost:5173",
]);

const COMMON_HEADERS = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Cache-Control": "no-store",
  "Vary": "Origin",
  "X-Content-Type-Options": "nosniff",
};

function responseHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  const headers: Record<string, string> = { ...COMMON_HEADERS };
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function json(request: Request, body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...responseHeaders(request), "Content-Type": "application/json; charset=utf-8" },
  });
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getClientIp(request: Request): string {
  // A Supabase/Cloudflare ingress által hozzáadott címeket részesítjük előnyben.
  const cloudflareIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cloudflareIp) return cloudflareIp;

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const entries = forwarded.split(",").map((part) => part.trim()).filter(Boolean);
    if (entries.length) return entries[entries.length - 1];
  }
  return "unknown";
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin");

  if (request.method === "OPTIONS") {
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return new Response("Origin not allowed", { status: 403, headers: COMMON_HEADERS });
    }
    return new Response("ok", { status: 200, headers: responseHeaders(request) });
  }

  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return json(request, { error: "Request not allowed" }, 403);
  }

  if (request.method !== "POST") {
    return json(request, { error: "Method not allowed" }, 405);
  }

  const contentLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > 4096) {
    return json(request, { error: "Invalid request" }, 413);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.error("Username login: required server environment is missing.");
      return json(request, { error: "Login service unavailable" }, 503);
    }

    const body = await request.json().catch(() => null);
    const username = typeof body?.username === "string"
      ? body.username.trim().toLowerCase()
      : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!/^[a-z0-9][a-z0-9._-]{0,31}$/.test(username) || password.length < 1 || password.length > 256) {
      return json(request, { error: "Invalid username or password" }, 401);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });

    const clientIp = getClientIp(request);
    const ipHash = await sha256Hex(`ip:${clientIp}`);
    const userIpHash = await sha256Hex(`username:${username}|ip:${clientIp}`);

    // 100 request / 15 minute per IP and 10 request / 15 minute per
    // username+IP. The database RPC is atomic, so parallel requests cannot
    // bypass the counter. Successful sign-in clears only the username bucket.
    if (clientIp !== "unknown") {
      const { data: ipLimit, error: ipLimitError } = await adminClient.rpc(
        "consume_username_login_attempt",
        { p_key_hash: ipHash, p_max_attempts: 100 },
      );
      if (ipLimitError) {
        console.error("Username login: IP rate-limit check failed.");
        return json(request, { error: "Login service unavailable" }, 503);
      }
      if (ipLimit?.allowed !== true) {
        return json(request, { error: "Too many attempts. Try again later." }, 429);
      }
    }

    const { data: userLimit, error: userLimitError } = await adminClient.rpc(
      "consume_username_login_attempt",
      { p_key_hash: userIpHash, p_max_attempts: 10 },
    );
    if (userLimitError) {
      console.error("Username login: account rate-limit check failed.");
      return json(request, { error: "Login service unavailable" }, 503);
    }
    if (userLimit?.allowed !== true) {
      return json(request, { error: "Too many attempts. Try again later." }, 429);
    }

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("email")
      .eq("username", username)
      .maybeSingle();

    if (profileError) {
      console.error("Username login: profile lookup failed.");
      return json(request, { error: "Login service unavailable" }, 503);
    }

    // Unknown names and wrong passwords receive the same response. No email,
    // profile details, or account-existence information is returned to caller.
    const emailForAuth = profile?.email || "unknown-username@invalid.invalid";
    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
    const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
      email: emailForAuth,
      password,
    });

    if (!profile?.email || authError || !authData.session) {
      return json(request, { error: "Invalid username or password" }, 401);
    }

    // Clear failed attempts for this username+IP after a successful login.
    const { error: resetError } = await adminClient.rpc(
      "reset_username_login_attempt",
      { p_key_hash: userIpHash },
    );
    if (resetError) console.error("Username login: rate-limit reset failed.");

    return json(request, {
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
      },
    });
  } catch {
    // Never log passwords, tokens, or submitted credentials.
    console.error("Username login: unexpected server error.");
    return json(request, { error: "Login service unavailable" }, 503);
  }
});
