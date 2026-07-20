"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import "./ascent.css";

const MARQUEE =
  "TALENT & COACHES FROM  META  ✦  GOOGLE  ✦  UBER  ✦  DOORDASH  ✦  ANTHROPIC  ✦  SHOPIFY  ✦ ";

// Social Proof UI — suppressed until the stats are interesting enough to show.
const SHOW_SOCIAL_PROOF = false;

export default function AscentHome() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const lvl = root.querySelector<HTMLElement>("[data-hud-lvl]");
    const bar = root.querySelector<HTMLElement>("[data-hud-bar]");
    const lines = Array.from(root.querySelectorAll<SVGPathElement>(".bgl")).map((p) => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = String(len);
      p.style.strokeDashoffset = String(len);
      return { p, len, rate: parseFloat(p.dataset.rate || "1") };
    });

    function onScroll() {
      const d = document.documentElement;
      const max = d.scrollHeight - d.clientHeight;
      const pr = max > 0 ? Math.min(1, d.scrollTop / max) : 0;
      if (lvl) lvl.textContent = String(Math.round(1 + pr * 98)).padStart(3, "0");
      if (bar) bar.style.height = (pr * 100).toFixed(1) + "%";
      lines.forEach(({ p, len, rate }) => {
        const t = Math.min(1, 0.06 + pr * rate * 1.35);
        p.style.strokeDashoffset = String(len * (1 - t));
      });
    }
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const spot = root.querySelector<HTMLElement>(".spot");
    const onMove = (e: MouseEvent) => {
      if (spot) spot.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
    };
    addEventListener("mousemove", onMove, { passive: true });

    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12 }
    );
    root.querySelectorAll(".reveal").forEach((el) => io.observe(el));

    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("mousemove", onMove);
      io.disconnect();
    };
  }, []);

  return (
    <div className="ascent" ref={rootRef}>
      <div className="spot" aria-hidden="true" />
      <svg className="bg-lines" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
        <path className="bgl" data-rate="1.15" d="M -20 1020 C 200 960, 320 900, 460 760 C 600 620, 680 560, 1020 340" fill="none" stroke="#e8c987" strokeWidth="1.6" opacity=".16" />
        <path className="bgl" data-rate="0.9" d="M -20 940 C 260 900, 380 820, 520 660 C 660 500, 780 420, 1020 160" fill="none" stroke="#e8c987" strokeWidth="1" opacity=".1" />
        <path className="bgl" data-rate="0.72" d="M -20 1080 C 300 1040, 460 940, 620 820 C 780 700, 880 660, 1030 560" fill="none" stroke="#3a3a40" strokeWidth="1.4" opacity=".8" />
        <path className="bgl" data-rate="1.4" d="M -20 860 C 180 830, 330 750, 430 640 C 530 530, 640 470, 1020 20" fill="none" stroke="#e8c987" strokeWidth=".8" opacity=".07" />
      </svg>

      <nav className="nav">
        <span className="logo">onward/upward</span>
        <div className="nav-right">
          <Link className="nav-signin" href="/signin">Sign in</Link>
          <a className="btn btn-sm" href="#join">Join</a>
        </div>
      </nav>

      <div className="xp-rail" aria-hidden="true">
        <span className="xp-label">XP</span>
        <div className="xp-track"><div className="xp-fill" data-hud-bar /></div>
      </div>
      <div className="lvl-hud" aria-hidden="true">
        <span className="k">LVL</span><span className="v" data-hud-lvl>001</span><span className="max">/ 099</span>
      </div>

      <main>
        <header className="hero">
          <div className="glow-top" />
          <div className="eyebrow-hero">A PRIVATE GROWTH NETWORK FOR DESIGNERS</div>
          <h1>
            The best don&rsquo;t apply.<br />
            <span className="outline-gold">They ascend.</span>
          </h1>
          <div className="hero-row">
            <a className="btn btn-lg" href="#join">Start your ascent</a>
            <span className="hero-sub">
              Smart matching from where you are to where you want to be — hiring
              managers and the industry&rsquo;s best coaches, one profile away.
            </span>
          </div>
          <div className="scroll-cue">SCROLL TO LEVEL UP ↓</div>
        </header>

        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            <span>{MARQUEE}</span>
            <span>{MARQUEE}</span>
          </div>
        </div>

        <section className="levels">
          <div className="level reveal">
            <span className="level-num">01</span>
            <div className="level-body">
              <div className="level-tag">LEVEL ONE — CHART YOUR PATH</div>
              <h2>Where you are. Where you&rsquo;re headed.</h2>
              <p>
                Generate your designer player&rsquo;s card in two clicks and
                zero seconds. Smart matching reads the gap between your today
                and your next level, and plots the route.
              </p>
            </div>
          </div>
          <div className="level alt reveal">
            <span className="level-num">02</span>
            <div className="level-body">
              <div className="level-tag">LEVEL TWO — TRAIN WITH THE BEST</div>
              <h2>Coaches who&rsquo;ve made the climb.</h2>
              <p>
                Discover ways to work with the industry&rsquo;s best design
                coaches — leaders who&rsquo;ve built the teams you want to
                join. Portfolio reviews, leveling plans, straight talk without
                the hard sales pitch.
              </p>
            </div>
          </div>
          <div className="level reveal">
            <span className="level-num">03</span>
            <div className="level-body">
              <div className="level-tag">LEVEL THREE — GET FOUND</div>
              <h2>Hiring managers, searching for exactly you.</h2>
              <p>
                Founders, recruiters and design leaders most easily sift
                through the noise and proactively land on your door, right when
                you&rsquo;re ready. Confidential to your peers and no
                #opentowork badge.
              </p>
            </div>
          </div>
          <div className="level alt reveal">
            <span className="level-num gold">99</span>
            <div className="level-body">
              <div className="level-tag">LEVEL NINETY-NINE — ASCEND</div>
              <h2>Skip the queue. Take the meeting.</h2>
              <p>
                No applications, no ATS black hole. Direct intros to roles and
                freelance opportunities that match your trajectory — or a
                polite pass, on your terms.
              </p>
            </div>
          </div>
        </section>

        <section className="recruiter reveal">
          <div className="recruiter-body">
            <div className="level-tag">FOR RECRUITERS &amp; HIRING MANAGERS</div>
            <h2>See talent before the market does.</h2>
            <p>
              Proactive visibility into vetted candidates as they grow — watch
              trajectories, not just titles, and make the connection before the
              résumé exists.
            </p>
          </div>
          <Link className="btn-ghost" href="/signup">Search the network →</Link>
        </section>

        <section className="manifesto reveal">
          <p>
            Onward/Upward is not about jobs —{" "}
            <span className="lit">it&rsquo;s about growth.</span> Growth through
            under-the-radar opportunities and{" "}
            <span className="gold">the best mentors out there</span> to prepare
            you.
          </p>
        </section>

        {SHOW_SOCIAL_PROOF && (
          <section className="stats">
            <div className="stat reveal"><div className="n">1,200+</div><div className="l">vetted designers, invite-only</div></div>
            <div className="stat reveal d1"><div className="n">85</div><div className="l">hand-picked industry coaches</div></div>
            <div className="stat reveal d2"><div className="n">6 days</div><div className="l">median search → first intro</div></div>
            <div className="stat reveal d3"><div className="n gold">0</div><div className="l">applications submitted, ever</div></div>
          </section>
        )}

        <section className="cta" id="join">
          <div className="glow-bottom" />
          <div className="cta-inner reveal">
            <h2>
              Ready to<br />
              <span className="gold">level up?</span>
            </h2>
            <Link className="btn btn-xl" href="/signup">Request an invite</Link>
            <span className="fine">Free for designers. Always.</span>
          </div>
        </section>
      </main>

      <footer>
        <span className="logo" style={{ fontSize: 15 }}>onward/upward</span>
        <div className="links">
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/signup">For companies</Link>
        </div>
      </footer>
    </div>
  );
}
