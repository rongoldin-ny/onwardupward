/**
 * Password-protected demo portfolio, for exercising the extractor's unlock
 * flow. GET serves a password gate; POST with password "velvet" (or a cookie
 * from a prior unlock) serves the real page.
 */

const PASSWORD = "velvet";
const COOKIE = "demo_unlocked=1";

const GATE = `<!doctype html>
<html><head><title>Protected — enter password</title></head>
<body>
  <h1>This portfolio is protected</h1>
  <form method="post" action="/demo-locked">
    <input type="hidden" name="csrf" value="demo-token" />
    <input type="password" name="site_password" placeholder="Password" />
    <button type="submit">Enter</button>
  </form>
</body></html>`;

const CONTENT = `<!doctype html>
<html lang="en">
<head>
  <title>Nils Vinter — Design Director</title>
  <meta name="description" content="Design director with 14 years of experience across fintech, B2B SaaS, and marketplaces. I build teams and payment products people trust." />
  <meta property="og:site_name" content="Nils Vinter" />
</head>
<body>
  <h1>Nils Vinter</h1>
  <p>Design director based in Copenhagen, Denmark. 14 years of experience in fintech and enterprise SaaS.</p>
  <p>Currently a Design Director at Pleo, previously a Design Manager at Zendesk,
     and before that a Senior Product Designer at Trustpilot.</p>
</body></html>`;

const html = (body: string) =>
  new Response(body, { headers: { "Content-Type": "text/html; charset=utf-8" } });

export async function GET(req: Request) {
  const unlocked = (req.headers.get("cookie") ?? "").includes(COOKIE);
  return html(unlocked ? CONTENT : GATE);
}

export async function POST(req: Request) {
  const form = new URLSearchParams(await req.text());
  if (form.get("site_password") === PASSWORD && form.get("csrf") === "demo-token") {
    const res = html(CONTENT);
    res.headers.set("Set-Cookie", `${COOKIE}; Path=/demo-locked; HttpOnly`);
    return res;
  }
  return html(GATE);
}
