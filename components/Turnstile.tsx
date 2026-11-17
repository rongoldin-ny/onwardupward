"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cloudflare Turnstile, the CAPTCHA Supabase checks on password sign-up,
 * sign-in and reset once "Enable Captcha protection" is on. Mounted inside a
 * form, it adds a hidden `cf-turnstile-response` field that the auth actions
 * hand to Supabase as `captchaToken`.
 *
 * Usually invisible: it only shows a checkbox when Cloudflare isn't sure.
 * Renders nothing without NEXT_PUBLIC_TURNSTILE_SITE_KEY, so local dev works
 * as long as Supabase's captcha setting is off for that project.
 *
 * A token is good for one Supabase call, so pass the form's latest action
 * result as `resetKey`: each failed attempt fetches a fresh one.
 */

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptLoad: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  scriptLoad ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("no turnstile")));
    script.onerror = () => {
      scriptLoad = null; // let a later mount try again
      reject(new Error("turnstile failed to load"));
    };
    document.head.appendChild(script);
  });
  return scriptLoad;
}

export default function Turnstile({ resetKey }: { resetKey?: unknown }) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  // Whether Cloudflare is showing its checkbox; only then does it need a gap.
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;
    loadTurnstile()
      .then((api) => {
        if (cancelled || !container.current) return;
        widgetId.current = api.render(container.current, {
          sitekey: SITE_KEY,
          theme: "dark",
          size: "flexible",
          appearance: "interaction-only",
          // Once shown it stays on screen (with its success tick), so the gap stays.
          "before-interactive-callback": () => setShown(true),
        });
      })
      .catch(() => {
        // Blocked or offline: the action's "couldn't verify" message covers it.
      });
    return () => {
      cancelled = true;
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
      widgetId.current = null;
    };
  }, []);

  useEffect(() => {
    if (widgetId.current) window.turnstile?.reset(widgetId.current);
  }, [resetKey]);

  if (!SITE_KEY) return null;
  // Zero height until Cloudflare needs to ask, so it takes no gap of its own
  // in the form's space-y stack (Tailwind v4's :where margins lose to mb-0).
  return <div ref={container} className={shown ? undefined : "mb-0"} />;
}
