/**
 * Curated coach directory, seeded from Ron's research CSV (July 2026).
 * Every entry is status "unclaimed": they haven't agreed to be on the
 * platform, so the UI must never expose direct contact routes — contact
 * fields live here only for the future claim flow.
 */

export type Coach = {
  slug: string;
  name: string;
  org: string;
  status: "unclaimed" | "claimed";
  photoUrl: string | null;
  bio: string;
  offerings: string;
  price: string;
  bestFor: string;
  /** Not rendered while unclaimed. */
  contact: string;
  source: string;
};

const STORAGE = "https://ziaylaegutxikckewwnq.supabase.co/storage/v1/object/public/profile-assets/coaches";

export const COACHES: Coach[] = [
  {
    slug: "jesse-james-garrett",
    name: "Jesse James Garrett",
    org: "Intentional Associates",
    status: "unclaimed",
    photoUrl: `${STORAGE}/8c6f5736-0039-4eb0-b52c-66986e2ed8e3.jpg`,
    bio: "Co-founder of Adaptive Path and author of The Elements of User Experience. Shifted to leadership coaching in 2018 and founded his executive coaching practice in 2020. Co-hosts the Finding Our Way podcast with Peter Merholz. Now also works on AI transformation for design orgs.",
    offerings:
      "Private 1:1 executive coaching for design leaders (Head of Design through CxO); Design Leadership Studio, a 6-week small-group coaching program; executive leadership skills development; AI transformation consulting.",
    price: "Not published",
    bestFor: "Director/VP/CDO-level leaders wanting a peer-level thinking partner",
    contact: "https://jessejamesgarrett.com/coaching/ · linkedin.com/in/jessejamesgarrett",
    source: "jessejamesgarrett.com",
  },
  {
    slug: "peter-merholz",
    name: "Peter Merholz",
    org: "Org Design for Design Orgs",
    status: "unclaimed",
    photoUrl: null,
    bio: "25+ years at the intersection of design, technology and business. Adaptive Path co-founder, co-author of Org Design for Design Orgs, independent consultant focused on the effectiveness of design organizations. Co-hosts Finding Our Way.",
    offerings:
      "Masterclasses (UX/Design Leadership Demystified, career architecture, org design), internal team training, org effectiveness consulting, leadership skills and practices assessment.",
    price: "Masterclasses $209–399 by situation; consulting quoted separately",
    bestFor: "Leaders working on org structure, career ladders, and design's operating model",
    contact: "https://www.petermerholz.com/ · linkedin.com/in/petermerholz",
    source: "petermerholz.com",
  },
  {
    slug: "andy-polaine",
    name: "Andy Polaine",
    org: "Independent",
    status: "unclaimed",
    photoUrl: `${STORAGE}/66414e4e-4840-4d68-8db5-b9c9da1c5a49.jpg`,
    bio: "Design leader, educator, author and host of the Power of Ten podcast. Has coached 160+ designers in leadership and management roles since 2020. Based in Europe, works globally.",
    offerings:
      "1:1 design leadership coaching — mid-career and mid-life inflection points, boundaries, managing up, storytelling and pitching, building design capability, design leadership in the age of AI. Small group coaching by arrangement.",
    price: "Packages of 6 or 12 sessions over 3–12 months; free 30-min fit call",
    bestFor: "Leaders at a career or life inflection point who want depth, not frameworks",
    contact: "https://www.polaine.com/coaching/ · linkedin.com/in/apolaine",
    source: "polaine.com",
  },
  {
    slug: "mia-blume",
    name: "Mia Blume",
    org: "Design Dept.",
    status: "unclaimed",
    photoUrl: `${STORAGE}/5aad33e4-635f-4912-96f3-e51ae230c017.jpg`,
    bio: "Founder of Design Dept., a design leadership coaching and development company started in 2016. Previously held design leadership roles at Pinterest, Square and IDEO.",
    offerings:
      "1:1 coaching matched to an experienced coach on the Design Dept. bench; cohort courses including Design Leadership Fundamentals; team and org development; retreats.",
    price: "Not published; courses priced per cohort",
    bestFor: "Leaders who want a matched coach plus structured curriculum, or team-wide programs",
    contact: "https://www.designdept.co/contact-coaching",
    source: "designdept.co",
  },
  {
    slug: "sally-grisedale",
    name: "Sally Grisedale",
    org: "Independent",
    status: "unclaimed",
    photoUrl: `${STORAGE}/8944a2e2-0965-4764-b732-bbffcca54af7.jpg`,
    bio: "Executive coach for user experience and design leaders, working with creative leaders in tech on career direction, brand and influence.",
    offerings:
      "1:1 creative leadership coaching — values and purpose alignment, healthy work habits, personal brand, stakeholder communication, promotion and negotiation, career transitions.",
    price: "Not published; free intro consultation",
    bestFor: "Leaders focused on positioning, negotiation and next-chapter decisions",
    contact: "https://sallygrisedale.com/",
    source: "sallygrisedale.com",
  },
  {
    slug: "nick-finck",
    name: "Nick Finck",
    org: "Craft & Rigor",
    status: "unclaimed",
    photoUrl: null,
    bio: "24+ years in UX and product design. Managed design and research teams for 14+ years, led orgs of 30+ people at Fortune 500 companies, ran an agency for five years and taught 250+ design grads.",
    offerings:
      "1:1 coaching and mentoring by career stage — career path and progression, portfolio and resume review, mock interviews, offer and comp negotiation, business acumen and stakeholder buy-in. Team mentoring via Craft & Rigor.",
    price: "$150–200 per session; 4 for $540, 6 for $810; pro-bono slots for underrepresented groups",
    bestFor: "IC to senior IC designers, job seekers, career changers",
    contact: "https://www.nickfinck.com/mentoring.html · linkedin.com/in/nickfinck",
    source: "nickfinck.com",
  },
  {
    slug: "judd-garratt",
    name: "Judd Garratt",
    org: "Guide + Mentor",
    status: "unclaimed",
    photoUrl: `${STORAGE}/43580ad2-795c-4b12-8209-5c873af8daba.png`,
    bio: "Design leader and 10-year Atlassian veteran who now coaches design people-leaders and design craft leaders. Remote-first, works with clients worldwide.",
    offerings:
      "1:1 coaching in design leadership and management — people management as a craft, leading without managing, influencing senior stakeholders, measuring design impact, critique and quality standards. Also team workshops.",
    price: "Not published; free 30-min intro call",
    bestFor: "New and mid-level design managers, and senior ICs leading through craft",
    contact: "https://guideplusmentor.com/design-leadership-coaching",
    source: "guideplusmentor.com",
  },
  {
    slug: "good-maven",
    name: "Good Maven",
    org: "Coaching collective",
    status: "unclaimed",
    photoUrl: `${STORAGE}/f61df05e-8ff3-4839-9dd4-e25cdc17e329.jpg`,
    bio: "Coaching collective founded by Meg, a coach and recruiter who was Meta's first international design recruiter. Bench includes leaders from Meta, Instagram, Apple and Microsoft, coaching in English, French and Spanish.",
    offerings:
      "Full spectrum from career coaching to hard-skill development — leadership craft, product thinking, design feedback, CV and portfolio, interview practice, communication. Mentoring packages for founders and leaders.",
    price: "£350–500 per session; six sessions from £1,950; twelve from £4,000",
    bestFor: "People who want a choice of coaches and published, predictable pricing",
    contact: "https://goodmaven.com/coaching-for-designers",
    source: "goodmaven.com",
  },
  {
    slug: "julia-whitney",
    name: "Julia Whitney",
    org: "Whitney & Associates · Leading Design",
    status: "unclaimed",
    photoUrl: null,
    bio: "Former Executive Creative Director and General Manager of UX & Design at the BBC, now an executive coach working with senior design leaders.",
    offerings:
      "Group coaching for experienced design leaders — five online sessions with a small cohort, participant-led agenda covering influence, conflict, career journey, values and purpose. Also 1:1 executive coaching.",
    price: "Not published; cohort-based via Leading Design",
    bestFor: "Experienced leaders who want peer cohort learning rather than solo coaching",
    contact: "https://leadingdesign.com/coaching/group-coaching-for-experienced-design-leaders",
    source: "leadingdesign.com",
  },
  {
    slug: "design-leadership-guild",
    name: "Design Leadership Guild",
    org: "Designlab",
    status: "unclaimed",
    photoUrl: null,
    bio: "Curated mastermind program for design leaders at Director, VP and CxO level, combining peer groups with professional leadership coaches.",
    offerings:
      "3-month programs with twice-monthly facilitated mastermind sessions in groups of 6–10 peers, a guest speaker series, and a 24/7 virtual community.",
    price: "Not published; program-based",
    bestFor: "Senior leaders wanting network plus coaching, roughly 90 min every two weeks",
    contact: "https://designlab.com/design-leadership-guild",
    source: "designlab.com",
  },
  {
    slug: "kat-take",
    name: "Kat Take",
    org: "Independent",
    status: "unclaimed",
    photoUrl: null,
    bio: "Design leader in tech with 15+ years of experience and 100+ interviews conducted at Amazon. Coaches working professionals and mentors design students, with a focus on women of color in design.",
    offerings:
      "1:1 coaching for career transitions, senior-role targeting and breaking into top tech — mock whiteboard and portfolio interviews, self-advocacy and promotion strategy. Structured five-session program plus 60-minute deep dives.",
    price: "Session and multi-session packages; not published",
    bestFor: "Designers interviewing at big tech, or pushing for promotion",
    contact: "https://www.kattake.com/coach",
    source: "kattake.com",
  },
  {
    slug: "mike-dekker",
    name: "Mike Dekker",
    org: "Independent",
    status: "unclaimed",
    photoUrl: null,
    bio: "UX/UI and product design career coach who deliberately positions outside the big-tech and agency-prestige track, emphasizing real work, impact and creative autonomy.",
    offerings:
      "Fully tailored 1:1 sessions on portfolio building, landing a first role, stakeholder management, using design to solve business problems, communicating value and pricing, and leveraging AI in design work.",
    price: "Not published",
    bestFor: "Independent designers, freelancers and people building a practice outside big tech",
    contact: "https://www.mikedekker.com/service-career-coaching",
    source: "mikedekker.com",
  },
  {
    slug: "alexis-specter",
    name: "Alexis",
    org: "Specter",
    status: "unclaimed",
    photoUrl: null,
    bio: "Product designer running a coaching practice built around a tailored curriculum for aspiring and early-career product designers.",
    offerings:
      "Design career coaching with a custom curriculum, long-term portfolio projects, feedback cycles, and help defining what kind of designer you want to be — from foundational craft to inclusive design and basic coding.",
    price: "Not published; described by clients as unusually affordable",
    bestFor: "Career changers and juniors, not senior leaders",
    contact: "https://www.specter.coach/",
    source: "specter.coach",
  },
  {
    slug: "mentorcruise",
    name: "MentorCruise",
    org: "Marketplace",
    status: "unclaimed",
    photoUrl: null,
    bio: "Vetted marketplace of product design, UX and design leadership coaches, including practitioners currently at Snap, Meta, Amazon and Microsoft. Average mentor rating reported as 4.9 out of 5.",
    offerings:
      "1:1 mentorship and coaching subscriptions, portfolio and resume review, career change support, design leadership, UX research, accessibility. Filterable by specialty and price.",
    price: "Varies by coach; typically monthly subscriptions in the low hundreds USD",
    bestFor: "Fast, low-commitment matching when you want a specific skill",
    contact: "https://mentorcruise.com/coach/productdesign/",
    source: "mentorcruise.com",
  },
];
