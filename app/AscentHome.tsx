"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { CollapsingLogoMark, LogoMark } from "@/components/logo";
import "./ascent.css";

const MARQUEE =
  "TALENT & COACHES FROM  META  ✦  GOOGLE  ✦  UBER  ✦  DOORDASH  ✦  ANTHROPIC  ✦  SHOPIFY  ✦  PINTEREST  ✦  AMAZON  ✦  SQUARE  ✦ ";

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

    const nav = root.querySelector<HTMLElement>(".nav");

    function onScroll() {
      const d = document.documentElement;
      // Mobile keeps sign-up CTAs out of the first screen; the nav's Join
      // fades in once the reader starts scrolling (same threshold as the logo
      // collapse, so it slides into the room the lockup frees up).
      nav?.classList.toggle("scrolled", d.scrollTop > 40);
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
      io.disconnect();
    };
  }, []);

  return (
    <div className="ascent" ref={rootRef}>
      <canvas className="trail" aria-hidden="true" />
      <svg className="bg-lines" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
        <path className="bgl" data-rate="1.15" d="M -20 1020 C 200 960, 320 900, 460 760 C 600 620, 680 560, 1020 340" fill="none" stroke="#e8c987" strokeWidth="1.6" opacity=".16" />
        <path className="bgl" data-rate="0.9" d="M -20 940 C 260 900, 380 820, 520 660 C 660 500, 780 420, 1020 160" fill="none" stroke="#e8c987" strokeWidth="1" opacity=".1" />
        <path className="bgl" data-rate="0.72" d="M -20 1080 C 300 1040, 460 940, 620 820 C 780 700, 880 660, 1030 560" fill="none" stroke="#3a3a40" strokeWidth="1.4" opacity=".8" />
        <path className="bgl" data-rate="1.4" d="M -20 860 C 180 830, 330 750, 430 640 C 530 530, 640 470, 1020 20" fill="none" stroke="#e8c987" strokeWidth=".8" opacity=".07" />
      </svg>

      <nav className="nav">
        <span className="logo ou-logo"><CollapsingLogoMark /></span>
        <div className="nav-right">
          <Link className="nav-signin" href="/signin">Sign in</Link>
          <a className="btn btn-sm" href="#join">Join</a>
        </div>
      </nav>

      {/* <div className="xp-rail" aria-hidden="true">
        <span className="xp-label">XP</span>
        <div className="xp-track"><div className="xp-fill" data-hud-bar /></div>
      </div>
      <div className="lvl-hud" aria-hidden="true">
        <span className="k">LVL</span><span className="v" data-hud-lvl>001</span><span className="max">/ 099</span>
      </div> */}

      <main>
        <header className="hero">
          <div className="glow-top" />
          <div className="eyebrow-hero">A growth network for people in tech</div>
          <h1>
            Don&rsquo;t go it alone.<br />
            <span className="outline-gold">Get a coach.</span>
          </h1>
          <div className="hero-row">
            <a className="btn btn-lg hero-signup" href="#join">Sign up</a>
            <span className="hero-sub">
              Get started exploring potential mentors, advertising your coaching
              practice, or both.
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

        <p className="open-note reveal">
          Currently open to <span className="gold">product managers</span>,{" "}
          <span className="gold">product and content designers</span>, and{" "}
          <span className="gold">user researchers</span> at all levels. More
          coming soon.
        </p>

        <section className="levels">
          <div className="level reveal">
            <span className="level-num">01</span>
            <div className="level-body">
              <div className="level-tag">LEVEL ONE — CHART YOUR PATH</div>
              <h2>Where you are. Where you&rsquo;re headed.</h2>
              <p>
                Generate your player&rsquo;s card in two clicks and
                zero seconds. Use it to tell your story quickly and connect
                the dots to potential mentors and coaches.
              </p>
            </div>
          </div>
          <div className="level alt reveal">
            <span className="level-num">02</span>
            <div className="level-body">
              <div className="level-tag">LEVEL TWO — TRAIN WITH THE BEST</div>
              <h2>Coaches and mentors who&rsquo;ve made the climb.</h2>
              <p>
                Discover ways to work with the industry&rsquo;s best
                coaches — leaders who&rsquo;ve built the teams you want to
                join. Portfolio reviews, leveling plans, straight talk without
                the hard sales pitch.
              </p>
            </div>
          </div>
          <div className="level reveal">
            <span className="level-num">03</span>
            <div className="level-body">
              <div className="level-tag">LEVEL UP</div>
              <h2>Get discovered for gigs and collaborations.</h2>
              <p>
                Coming soon: make yourself available to hiring managers and
                recruiters looking for self-aware, growth-oriented candidates
                on an upward trajectory.
              </p>
            </div>
          </div>
        </section>

        {/* <section className="recruiter reveal">
          <div className="recruiter-body">
            <div className="level-tag">FOR RECRUITERS &amp; HIRING MANAGERS</div>
            <h2>A more visual way to discover talent and make connections.</h2>
            <p>
              Connect with self-aware, growth-oriented candidates that are on an
              upward trajectory.
            </p>
          </div>
          <Link className="btn-ghost" href="/signup">Search the network →</Link>
        </section> */}

        <section className="manifesto reveal">
          <p>
            Onward/Upward is{" "}
            <span className="lit">a growth space.</span> Growth through{" "}
            <span className="gold">the best mentors out there</span> to prepare
            you for the next chapter in your personal career journey.
          </p>
        </section>

        {SHOW_SOCIAL_PROOF && (
          <section className="stats">
            <div className="stat reveal"><div className="n">1,200+</div><div className="l">vetted designers & PMs, invite-only</div></div>
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
            <Link className="btn btn-xl" href="/signup">Sign up</Link>
            <span className="fine">Free during the Beta</span>
          </div>
        </section>
      </main>

      <footer>
        <span className="logo ou-logo" style={{ fontSize: 15 }}><LogoMark /></span>
        <div className="links">
          {/* Contact now lives in the shared SiteFooter. */}
          {/* <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/signup">For companies</Link> */}
        </div>
      </footer>
    </div>
  );
}
