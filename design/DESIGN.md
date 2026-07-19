# O&U Design Spec — "After Hours" Direction
Supersedes PRD §3 (Design System). Logic/data/behavior in the PRD are unchanged.
Pass this file to Claude Code alongside the screen screenshots (2a–2j). Screenshots are the source of truth for layout.

## Concept
Dark atelier / quiet luxury. Near-black surfaces, warm cream text, a single gold accent used sparingly (CTAs, active states, tags). Copy is concierge-toned ("Good evening. Who shall we find for you?"). No teal — the PRD's #22D3EE palette is replaced entirely.

## Fonts
Single family: **Schibsted Grotesk** (Google Fonts), weights 400 / 500 / 700 / 900.

```html
<link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;700;900&display=swap" rel="stylesheet">
```
No Space Grotesk, no Plus Jakarta Sans, no substitutions.

## Typography Scale
| Token | Size / LH | Weight | Letter-spacing | Usage |
|---|---|---|---|---|
| Display | 34–40px / 1.08 | 900 | -0.02em | Hero headlines, screen titles |
| Header 1 | 27–30px / 1.1 | 900 | -0.02em | Candidate name, page titles |
| Header 2 | 18–20px / 1.2 | 700–900 | -0.02em | Drawer titles, card headings |
| Eyebrow | 11px / 1 | 700 | +0.14em, UPPERCASE | Section labels (THE DREAM JOB, HUMBLEBRAGS) |
| Body 1 | 14–15px / 1.5 | 400 | 0 | Primary body, inputs |
| Body 2 | 12.5–13px / 1.5 | 400 | 0 | Card content, secondary text |
| Body 3 | 11–12px / 1.4 | 400–500 | 0 | Captions, meta, footer links |

Two-tone headline pattern: lead line in `text-primary`, continuation in `text-secondary` (see 2e, 2g).

## Color Palette
| Token | Hex | Usage |
|---|---|---|
| bg-page | #101012 | App/page background |
| surface-1 | #17171A | Screen background, phone canvas |
| surface-2 | #1E1E22 | Cards, inputs, drawer |
| surface-disabled | #1A1A1D | "Coming soon" cards (with dashed border, 60–70% opacity) |
| border-1 | #2E2E34 | Default card/input borders, dividers |
| border-2 | #3A3A40 | Secondary buttons, icon-button rings |
| text-primary | #EFE9DD | Headlines, primary text (warm cream) |
| text-body | #DCD5C5 / #C9C2B2 | Body copy on cards |
| text-secondary | #8D8677 | Supporting text, eyebrows |
| text-muted | #6E6A5E | Placeholders, disabled, footer |
| gold | #E8C987 | Accent text, links, tag borders/text, numerals |
| gold-deep | #C9A35C | Gradient end |
| gold-gradient | linear-gradient(135deg,#E8C987,#C9A35C) | Primary CTAs, avatar fallback |
| gold-border | rgba(232,201,135,.35) | Tag/pill outlines |
| gold-active | rgba(232,201,135,.5) | Focused input / selected card border |
| gold-tint | rgba(232,201,135,.08) | Highlight banner backgrounds |
| success | #9DB78A | Positive deltas ("▲ 12%") |
| on-gold | #17130A | Text on gold CTAs |

Links: `a { color:#E8C987 }`.

## Components
- **Primary CTA**: full-width pill (`rounded-full`), gold-gradient bg, on-gold text, 700 weight, 15px, ~52px tall, glow `box-shadow: 0 8px 32px rgba(210,170,95,.25)`.
- **Secondary CTA**: full-width pill, transparent bg, 1px border-2, text-primary.
- **Inverted CTA** (L2 "Get in touch"): cream (#EFE9DD) bg, dark text — the one non-gold CTA, so it reads distinct at the bottom of a profile.
- **Inputs**: pill (`rounded-full`), surface-2 bg, 1px border-1, 15–16px vertical padding. Focus: border gold-active. Textareas: `rounded-[20px]` instead of pill.
- **Cards**: surface-2, 1px border-1, `rounded-[20px]`, padding 20–22px. No drop shadows on cards — elevation comes from border + surface contrast. Highlighted card (top match, selected role): border gold-active or gold-border.
- **Tags / company chips**: pill, transparent bg, 1px gold-border, gold text, 10.5–11px.
- **Avatar fallback**: `linear-gradient(135deg,#E8C987,#6E5A33)`; vary the second stop per user (hash of id) among #6E5A33 / #3A3A40 / #2E2E34. Halo ring on large avatars: `box-shadow: 0 0 0 6px rgba(232,201,135,.08)`.
- **Glow**: hero screens get a radial gold glow at top center: `radial-gradient(closest-side, rgba(232,201,135,.14–.18), transparent)`, absolutely positioned, pointer-events none.
- **Progress (onboarding)**: 6 equal 3px bars, gap 6px; done/current = gold-gradient, rest border-1.
- **Coming soon**: dashed border-1, surface-disabled, 60–70% opacity, gold outlined "COMING SOON" micro-pill.
- **Drawer**: surface-2, `rounded-t-[28px]`, top border gold-border, grab handle (36×4px, border-2), scrim rgba(10,10,12,.55), content behind blurred/dimmed.
- **Toast**: surface-2, gold-border, "Message sent ✓".
- **Phone/page radius**: screens are flat surface-1; on web the app container may use `rounded-[28px]`.
- **Portfolio image placeholder**: `rounded-xl`, diagonal-stripe pattern in #26262B/#2C2C31 until image loads.
- **Touch targets**: min 44px, unchanged from PRD.
- **Icons**: Lucide, 1.5px stroke, colored text-secondary by default, gold when interactive/active.

## Copy tone
Concierge, understated, second person. Time-aware greeting ("Good evening"). Examples: "Who shall we find for you?", "Describe them. The taste, the track record, the temperament…", "Write to Maya". No exclamation marks, no emoji, no rocket icons — the PRD's "Let's go 🚀" becomes "Begin".

## Screen index (screenshots)
- 2a Landing · 2b Sign in · 2c Role select · 2d Onboarding step 1 · 2e Candidate dashboard · 2f Subscribe gate · 2g L0 search · 2h L1 results · 2i L2 candidate detail · 2j Contact drawer
