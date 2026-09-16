/**
 * Client-only: remembers the previous in-app page for this tab, so close
 * buttons can go somewhere predictable. `router.back()` can't be trusted for
 * that: the prior history entry may be the sign-in page or an OAuth hop,
 * which redirects a signed-in user straight back (the X looks dead), or
 * another site entirely.
 */

const CURRENT = "ou:route:current";
const PREVIOUS = "ou:route:previous";

/** Screens that only bounce a signed-in user onward — never a close target. */
const PASS_THROUGH = /^\/(signin|signup|auth|onboarding|role|claim)(\/|$)/;

function storage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** Call on every route change. A reload of the same page keeps the previous entry. */
export function recordRoute(pathname: string) {
  const s = storage();
  if (!s) return;
  const current = s.getItem(CURRENT);
  if (current === pathname) return;
  if (current) s.setItem(PREVIOUS, current);
  s.setItem(CURRENT, pathname);
}

/** Where a close button should go from `pathname`: the last real in-app page, else home. */
export function closeTarget(pathname: string): string {
  const previous = storage()?.getItem(PREVIOUS);
  return previous && previous !== pathname && !PASS_THROUGH.test(previous) ? previous : "/";
}
