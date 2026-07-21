/**
 * App-sent email (member-vetting notifications etc.) via the Resend REST
 * API — Supabase SMTP only covers auth emails. Requires RESEND_API_KEY;
 * without it, sends are skipped with a warning so flows never break.
 */

const FROM = "onward/upward <hello@onwardupward.io>";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(`RESEND_API_KEY missing — skipped email "${opts.subject}" to ${opts.to}`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [opts.to], subject: opts.subject, html: opts.html }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) console.error("sendEmail failed:", res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.error("sendEmail failed:", e);
    return false;
  }
}

/** Shared dark-theme shell for app emails. */
export function emailShell(title: string, bodyHtml: string, cta?: { label: string; url: string }) {
  return `
  <div style="background:#101012;padding:40px 24px;font-family:'Helvetica Neue',Arial,sans-serif">
    <div style="max-width:520px;margin:0 auto;background:#17171a;border:1px solid #2e2e34;border-radius:24px;padding:36px">
      <p style="margin:0;font-size:18px;font-weight:800;color:#efe9dd">onward<span style="color:#e8c987">↗</span>upward</p>
      <h1 style="margin:28px 0 0;font-size:26px;line-height:1.15;font-weight:800;color:#efe9dd">${title}</h1>
      <div style="margin-top:14px;font-size:15px;line-height:1.6;color:#c9c2b2">${bodyHtml}</div>
      ${
        cta
          ? `<a href="${cta.url}" style="display:inline-block;margin-top:28px;background:#e8c987;color:#17130a;font-weight:700;font-size:15px;padding:14px 28px;border-radius:999px;text-decoration:none">${cta.label}</a>`
          : ""
      }
      <p style="margin:32px 0 0;font-size:12px;color:#6e6a5e">onward/upward — a growth network for product designers and PMs</p>
    </div>
  </div>`;
}
