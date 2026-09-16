<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Mobile is a first-class target

Every UI change must be checked at 375×812 before it ships, not just on desktop. Rules learned from the mobile polish pass:

- **Floating chrome must not cover page content.** Global fixed elements (the mobile hamburger, footer buttons) collide with each page's own corner controls. Pages with their own header actions (profile, coach detail, share links) opt out of the hamburger in `SiteNavClient`, and must then provide their own close/back button. Every mobile screen needs a visible way out.
- **Nothing important pinned to the bottom edge.** Mobile browser chrome clips it. Secondary links like "New here? Create an account" belong inside the main content. Fine print like the copyright goes in the page flow, not `position: fixed`.
- **Content first on utility pages.** Directory and list pages (reads, coaches) show only the eyebrow title on mobile. The desktop H1 and subhead are `hidden md:block`.
- **Filter and chip rows don't wrap on mobile.** Use `FilterRow` (`components/MultiSelect.tsx`), a single swipeable line that bleeds off the right edge. Dropdowns inside a horizontal scroller must be `position: fixed`, or the scroller clips them.
- **Shorten copy for phones.** Status lines and button labels that fit on desktop wrap badly at 375px. Keep a short mobile variant ("3 matches", "Done", "Reading…") or icon-only buttons with an `aria-label`.
- **Key CTAs stay near the top of single-column layouts.** When a two-column desktop layout stacks, right-column CTAs (e.g. claim a coach profile) end up screens away. Surface them under the identity info below `lg`.
- **Form controls span their container.** A select or input inside a flex row needs `min-w-0 flex-1` (or `w-full`) on its wrapper, or it shrinks to its content width.
- **Centering in flex columns.** An `inline-flex` child of a `flex-col` stretches and left-aligns its contents. Wrap it in `self-center`.
- **One CTA on the first screen.** The signed-out home shows no sign-up button until the visitor scrolls. Keep competing CTAs off the first mobile viewport.
- **Logo:** subpages use the compact O↗U mark on mobile (`<Logo />`); only role home screens pass `<Logo full />`.
