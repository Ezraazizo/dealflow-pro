// supabase/functions/deadline-digest/index.ts
// Deploy: supabase functions deploy deadline-digest
// Schedule: Set up a cron job in Supabase Dashboard → Database → Extensions → pg_cron
//   SELECT cron.schedule('deadline-digest', '0 8 * * *', $$
//     SELECT net.http_post(
//       url := '<YOUR_SUPABASE_URL>/functions/v1/deadline-digest',
//       headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb
//     );
//   $$);

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// Use Resend, SendGrid, or Postmark for transactional email
const EMAIL_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "DealFlow Pro <notifications@yourdomain.com>";

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all users who want email digests
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("user_id, digest_frequency")
      .eq("email_digest", true);

    if (!prefs || prefs.length === 0) {
      return new Response(JSON.stringify({ message: "No users with digest enabled" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ...

    for (const pref of prefs) {
      // Skip weekly users on non-scheduled days
      if (pref.digest_frequency === "weekly" && dayOfWeek !== 1) continue;

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", pref.user_id)
        .single();

      if (!profile) continue;

      // Get user's org memberships
      const { data: memberships } = await supabase
        .from("org_members")
        .select("org_id")
        .eq("user_id", pref.user_id);

      if (!memberships || memberships.length === 0) continue;

      const orgIds = memberships.map((m) => m.org_id);

      // Get upcoming deadlines (next 7 days)
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + 7);

      const { data: deadlines } = await supabase
        .from("deadlines")
        .select(`
          id, title, due_date, is_done,
          deals:deal_id (id, name, address, stage, org_id)
        `)
        .eq("is_done", false)
        .gte("due_date", today.toISOString().split("T")[0])
        .lte("due_date", futureDate.toISOString().split("T")[0])
        .order("due_date", { ascending: true });

      // Filter to user's orgs
      const userDeadlines = (deadlines || []).filter(
        (dl) => dl.deals && orgIds.includes(dl.deals.org_id)
      );

      if (userDeadlines.length === 0) continue;

      // Build email
      const emailHtml = buildDigestEmail(profile.full_name, userDeadlines, today);

      // Send via Resend
      if (EMAIL_API_KEY) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${EMAIL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: EMAIL_FROM,
            to: profile.email,
            subject: `DealFlow: ${userDeadlines.length} upcoming deadline${userDeadlines.length > 1 ? "s" : ""} this week`,
            html: emailHtml,
          }),
        });
      }
    }

    return new Response(JSON.stringify({ message: "Digest sent" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

function buildDigestEmail(name, deadlines, today) {
  const rows = deadlines
    .map((dl) => {
      const due = new Date(dl.due_date);
      const diff = Math.ceil((due - today) / 86400000);
      const urgency =
        diff <= 1 ? "#ef4444" : diff <= 3 ? "#f59e0b" : "#10b981";
      const label = diff === 0 ? "TODAY" : diff === 1 ? "TOMORROW" : `${diff} days`;
      return `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #2a2d3e;">
            <strong style="color:#e4e5eb;">${dl.title}</strong><br/>
            <span style="color:#8b8fa3;font-size:13px;">${dl.deals?.name || "Unknown deal"}</span>
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid #2a2d3e;text-align:right;">
            <span style="background:${urgency}22;color:${urgency};padding:4px 10px;border-radius:4px;font-size:12px;font-weight:600;">${label}</span>
          </td>
        </tr>`;
    })
    .join("");

  return `
    <div style="background:#0f1117;padding:40px 20px;font-family:'DM Sans',system-ui,sans-serif;">
      <div style="max-width:560px;margin:0 auto;background:#181a22;border-radius:12px;border:1px solid #2a2d3e;overflow:hidden;">
        <div style="padding:24px;border-bottom:1px solid #2a2d3e;">
          <h1 style="color:#f59e0b;font-size:20px;margin:0;">DealFlow Pro</h1>
          <p style="color:#8b8fa3;font-size:14px;margin:8px 0 0;">Deadline Digest for ${name || "you"}</p>
        </div>
        <div style="padding:8px 0;">
          <table style="width:100%;border-collapse:collapse;">${rows}</table>
        </div>
        <div style="padding:16px 24px;background:#1e2030;text-align:center;">
          <a href="${Deno.env.get("APP_URL") || "https://dealflow.yourdomain.com"}" style="color:#f59e0b;text-decoration:none;font-size:14px;">Open DealFlow Pro →</a>
        </div>
      </div>
    </div>
  `;
}
