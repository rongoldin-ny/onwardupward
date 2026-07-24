import { redirect } from "next/navigation";
import { currentUser, homeFor } from "@/lib/auth";
import AscentHome from "./AscentHome";

/*
 * The ribbon runs as a document-level vanilla script (below), NOT inside
 * React: browser-extension-induced hydration churn was remounting the
 * landing's client component on some machines, resetting the trail's point
 * buffer every few frames so the ribbon never appeared. A parse-time inline
 * script with a window-level guard is immune to React's lifecycle entirely.
 * Ported verbatim from the design handoff (RIBBON-PATCH.md).
 */
const TRAIL_SCRIPT = `
(() => {
  if (window.__ouTrail) return;
  window.__ouTrail = true;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let cv = null, ctx = null;
  const fit = () => { if (!cv) return; cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; };
  // React can replace the canvas node after hydration; re-bind to whichever
  // canvas is live right now instead of capturing one forever.
  const ensure = () => {
    const found = document.querySelector('canvas.trail');
    if (!found) { cv = null; ctx = null; return false; }
    if (found !== cv) { cv = found; ctx = cv.getContext('2d'); fit(); }
    return true;
  };
  addEventListener('resize', fit, { passive: true });
  const pts = []; const MAX = 44;
  const onMove = e => {
    const p = pts[pts.length - 1];
    if (p) { const dx = e.clientX - p.x, dy = e.clientY - p.y; if (dx * dx + dy * dy < 36) return; }
    pts.push({ x: e.clientX, y: e.clientY, life: 1, sway: Math.random() * Math.PI * 2 });
    if (pts.length > MAX) pts.shift();
  };
  addEventListener('mousemove', onMove, { passive: true });
  addEventListener('pointermove', onMove, { passive: true });
  let tick = 0;
  const step = () => {
    requestAnimationFrame(step);
    if (!ensure()) return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (pts.length < 3) { if (pts.length && --pts[0].life <= 0) pts.shift(); return; }
    tick += 0.03;
    for (let i = 0; i < pts.length; i++) {
      const t = pts[i];
      t.life -= 0.007;
      t.y -= 0.5 + (1 - t.life) * 0.6;
      t.x += Math.sin(tick + t.sway) * 0.35 + 0.15;
    }
    while (pts.length && pts[0].life <= 0) pts.shift();
    for (let i = 1; i < pts.length - 1; i++) {
      pts[i].x += (pts[i - 1].x + pts[i + 1].x - 2 * pts[i].x) * 0.08;
      pts[i].y += (pts[i - 1].y + pts[i + 1].y - 2 * pts[i].y) * 0.08;
    }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 1; i < pts.length - 1; i++) {
      const p0 = pts[i - 1], p1 = pts[i], p2 = pts[i + 1];
      const a = Math.max(0, p1.life) * (0.45 + 0.55 * i / pts.length);
      if (a <= 0.005) continue;
      ctx.strokeStyle = 'rgba(232,201,135,' + a.toFixed(3) + ')';
      ctx.lineWidth = (2.2 + 4.2 * (i / pts.length)) * dpr;
      ctx.beginPath();
      ctx.moveTo((p0.x + p1.x) / 2 * dpr, (p0.y + p1.y) / 2 * dpr);
      ctx.quadraticCurveTo(p1.x * dpr, p1.y * dpr, (p1.x + p2.x) / 2 * dpr, (p1.y + p2.y) / 2 * dpr);
      ctx.stroke();
    }
  };
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) step();
})();
`;

export default async function Landing({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  // ?preview=1 shows the signed-out landing even while logged in.
  const { preview } = await searchParams;
  if (preview !== "1") {
    const user = await currentUser();
    if (user) redirect(homeFor(user));
  }
  return (
    <>
      <AscentHome />
      <script dangerouslySetInnerHTML={{ __html: TRAIL_SCRIPT }} />
    </>
  );
}
