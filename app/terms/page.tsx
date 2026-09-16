import Link from "next/link";
import { LegalDoc, LegalList, LegalSection } from "@/components/legal/LegalDoc";

export const metadata = { title: "Terms of Service — onward/upward" };

const UPDATED = "September 16, 2026";

const SECTIONS: [string, string][] = [
  ["agreement", "Agreeing to these terms"],
  ["eligibility", "Who can use onward/upward"],
  ["membership", "Membership and approval"],
  ["your-content", "Your profile and content"],
  ["ai-features", "AI features"],
  ["coaches", "Coaches and coaching"],
  ["listings", "Coach listings and claims"],
  ["reviews", "Reviews"],
  ["acceptable-use", "Acceptable use"],
  ["member-information", "Respecting member information"],
  ["fees", "Fees"],
  ["our-property", "Our property and feedback"],
  ["third-parties", "Links and third-party services"],
  ["ending", "Ending your use"],
  ["disclaimers", "Disclaimers"],
  ["liability", "Limitation of liability"],
  ["indemnity", "Indemnity"],
  ["disputes", "Governing law and disputes"],
  ["changes", "Changes to these terms"],
  ["contact", "Contact us"],
];

export default function TermsPage() {
  return (
    <LegalDoc
      eyebrow="onward/upward"
      title="Terms of Service"
      updated={UPDATED}
      sections={SECTIONS}
      summary={
        <ul className="list-disc space-y-1.5 pl-5 marker:text-gold">
          <li>Be truthful about who you are and only share work you have the right to show.</li>
          <li>Coaches are independent. Sessions, pricing and payment are between you and the coach.</li>
          <li>AI suggestions and coach matches can be wrong, so review them before relying on them.</li>
          <li>Keep other members&apos; information private and use it only to connect on onward/upward.</li>
          <li>onward/upward is free during the beta and provided as-is.</li>
        </ul>
      }
    >
      <LegalSection id="agreement" title="Agreeing to these terms">
        <p>
          These terms are an agreement between you and Formative Labs dba Ron Goldin{" "}
          (&ldquo;onward/upward,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;), which operates
          onwardupward.io. By creating an account or using the site, you agree to these terms and to our{" "}
          <Link href="/privacy">Privacy Policy</Link>. If you don&apos;t agree, don&apos;t use
          onward/upward.
        </p>
      </LegalSection>

      <LegalSection id="eligibility" title="Who can use onward/upward">
        <LegalList>
          <li>You must be at least 18 and able to form a binding contract.</li>
          <li>You sign in with a Google account and are responsible for keeping it secure.</li>
          <li>You may have one account, and the information you provide must be accurate and about you.</li>
          <li>
            If you use onward/upward on behalf of a company, you confirm you&apos;re authorized to accept
            these terms for it.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="membership" title="Membership and approval">
        <p>
          onward/upward is a curated network. We review new members and coach listings and may approve,
          decline or later remove any account or listing at our discretion, including when we believe
          these terms have been broken. Some features are available only after approval.
        </p>
      </LegalSection>

      <LegalSection id="your-content" title="Your profile and content">
        <p>
          You own what you add to onward/upward: your profile, résumé, portfolio images, coach listing,
          requests and reviews (&ldquo;your content&rdquo;). You give us a worldwide, non-exclusive,
          royalty-free license to host, store, copy, display, format and share your content to operate,
          promote and improve onward/upward: for example, showing your profile to members, sending your
          request to a coach, creating summaries and matches, and displaying your share link or coach
          page. This license ends when your content is deleted, except for copies already shared with
          others or kept in backups for a limited time.
        </p>
        <p>You&apos;re responsible for your content and confirm that:</p>
        <LegalList>
          <li>It&apos;s accurate and doesn&apos;t misrepresent your experience, credentials or results.</li>
          <li>
            You have the right to share it, including portfolio work that may be covered by client or
            employer confidentiality.
          </li>
          <li>People you list as references have agreed to be listed.</li>
          <li>It doesn&apos;t violate anyone&apos;s rights or the law.</li>
        </LegalList>
      </LegalSection>

      <LegalSection id="ai-features" title="AI features">
        <p>
          onward/upward uses AI to read your links and résumé, fill in your profile, summarize profiles
          and recommend coaches. AI output can be incomplete or wrong. Review anything added to your
          profile before relying on it, since you&apos;re responsible for your profile once it&apos;s
          saved. Recommendations and &ldquo;top match&rdquo; labels are suggestions, not endorsements
          or guarantees.
        </p>
      </LegalSection>

      <LegalSection id="coaches" title="Coaches and coaching">
        <p>
          Coaches on onward/upward are independent. They aren&apos;t our employees, agents or partners,
          and we don&apos;t supervise their coaching. We may review listings, but we don&apos;t verify
          every credential or claim and don&apos;t guarantee any coach&apos;s availability, quality or
          results.
        </p>
        <p>
          Scheduling, pricing, payment, cancellations and the coaching itself are agreed directly
          between members and coaches. onward/upward isn&apos;t a party to those arrangements and
          isn&apos;t responsible for them. Use your own judgment before booking.
        </p>
        <p>If you coach on onward/upward, you also agree to:</p>
        <LegalList>
          <li>Keep your listing accurate, including pricing, credentials and how to book you</li>
          <li>Respond to requests professionally, or not at all, without harassment or pressure</li>
          <li>
            Use information you receive from members, including their email address and profile summary,
            only to respond about coaching them
          </li>
          <li>Follow the laws and professional obligations that apply to your coaching</li>
        </LegalList>
      </LegalSection>

      <LegalSection id="listings" title="Coach listings and claims">
        <p>
          Some coach listings are created from publicly available information before the coach joins.
          If a listing is about you, you can claim it by signing up and verifying it&apos;s yours, or
          ask us to change or remove it by emailing{" "}
          <a href="mailto:hello@onwardupward.io">hello@onwardupward.io</a>. Claiming a listing that
          isn&apos;t yours is not allowed.
        </p>
      </LegalSection>

      <LegalSection id="reviews" title="Reviews">
        <p>
          Reviews must reflect your own, genuine experience with a coach. Don&apos;t review yourself,
          someone you have a close personal or financial relationship with, or a coach you haven&apos;t
          worked with, and don&apos;t offer or accept anything in exchange for a review. Reviews show your
          name and photo publicly. We may remove reviews that break these terms, but we don&apos;t edit
          what they say.
        </p>
      </LegalSection>

      <LegalSection id="acceptable-use" title="Acceptable use">
        <p>Don&apos;t:</p>
        <LegalList>
          <li>Impersonate anyone or create fake or duplicate accounts</li>
          <li>Harass, threaten, discriminate against or spam other people</li>
          <li>Scrape, bulk-download or copy member profiles or coach listings, by automated means or otherwise</li>
          <li>Get around limits, approval, access controls or security measures, or probe for vulnerabilities</li>
          <li>Upload malware or anything that interferes with the service</li>
          <li>Use onward/upward for anything illegal, deceptive or infringing</li>
        </LegalList>
      </LegalSection>

      <LegalSection id="member-information" title="Respecting member information">
        <p>
          Profiles, share links and résumés are shared so people can connect on onward/upward. Don&apos;t
          copy, sell, publish or reuse other members&apos; information outside the platform, add them to
          mailing or recruiting lists without their consent, or share their résumés or portfolio
          passwords.
        </p>
      </LegalSection>

      <LegalSection id="fees" title="Fees">
        <p>
          onward/upward is free during the beta. We may introduce paid features, such as supporter or
          hiring plans, later. We&apos;ll show the price and any additional terms before you&apos;re
          charged, and won&apos;t start charging for something you already use without telling you
          first.
        </p>
      </LegalSection>

      <LegalSection id="our-property" title="Our property and feedback">
        <p>
          onward/upward&apos;s name, logo, design, software and content (other than your content) belong
          to us or our licensors, and these terms don&apos;t give you any right to use them beyond using
          the service. If you send us feedback or ideas, we may use them without any obligation to you.
        </p>
      </LegalSection>

      <LegalSection id="third-parties" title="Links and third-party services">
        <p>
          onward/upward links to sites we don&apos;t control, such as portfolios, booking pages,
          newsletters and LinkedIn. We aren&apos;t responsible for their content or practices. Sign-in,
          hosting, email and AI features rely on third-party providers described in our{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </LegalSection>

      <LegalSection id="ending" title="Ending your use">
        <p>
          You can stop using onward/upward at any time and ask us to delete your account by emailing{" "}
          <a href="mailto:hello@onwardupward.io">hello@onwardupward.io</a>. We may suspend, remove or
          archive your account or listing, or limit features, if you break these terms, if we&apos;re
          required to by law, or to protect members or the service. We may also change or discontinue
          features. Sections that by their nature should continue after your account ends (such as
          content licenses already used, disclaimers, limitation of liability, indemnity and disputes)
          will continue.
        </p>
      </LegalSection>

      <LegalSection id="disclaimers" title="Disclaimers">
        <p>
          onward/upward is in beta and is provided &ldquo;as is&rdquo; and &ldquo;as available.&rdquo;
          To the fullest extent allowed by law, we disclaim all warranties, express or implied, including
          merchantability, fitness for a particular purpose, title and non-infringement. We don&apos;t
          promise the service will be uninterrupted, error-free or secure, or that any member, coach,
          match, content or career outcome will meet your expectations. Nothing on onward/upward is
          professional, legal, financial or medical advice.
        </p>
      </LegalSection>

      <LegalSection id="liability" title="Limitation of liability">
        <p>
          To the fullest extent allowed by law, we won&apos;t be liable for any indirect, incidental,
          special, consequential or punitive damages, or for lost profits, revenue, data, opportunities
          or goodwill, arising from your use of onward/upward or from interactions with other members or
          coaches. Our total liability for any claim related to onward/upward is limited to the greater
          of $100 or the amount you paid us in the 12 months before the claim. Some places don&apos;t
          allow these limits, so they may not apply to you.
        </p>
      </LegalSection>

      <LegalSection id="indemnity" title="Indemnity">
        <p>
          You agree to defend and compensate us for claims, losses and expenses (including reasonable
          legal fees) arising from your content, your use of onward/upward, your dealings with other
          members or coaches, or your breach of these terms or the law.
        </p>
      </LegalSection>

      <LegalSection id="disputes" title="Governing law and disputes">
        <p>
          These terms are governed by the laws of the State of New York, without regard to
          conflict-of-law rules. Before filing a claim, you agree to email us and try to resolve the
          dispute informally for 30 days. Any claim that isn&apos;t resolved will be brought in the state
          or federal courts located in Kings County, New York, and you and we consent to their
          jurisdiction. Nothing here limits rights you have under the consumer protection laws of the
          place you live.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="Changes to these terms">
        <p>
          We may update these terms. We&apos;ll change the date at the top, and for significant changes
          we&apos;ll notify you by email or on the site before they take effect. Continuing to use
          onward/upward after changes take effect means you accept them.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="Contact us">
        <p>
          Formative Labs dba Ron Goldin
          <br />
          Brooklyn, New York
          <br />
          <a href="mailto:hello@onwardupward.io">hello@onwardupward.io</a>
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
