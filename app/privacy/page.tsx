import { Fill, LegalDoc, LegalList, LegalSection } from "@/components/legal/LegalDoc";

export const metadata = { title: "Privacy Policy — onward/upward" };

const UPDATED = "September 16, 2026";

const SECTIONS: [string, string][] = [
  ["who-we-are", "Who we are"],
  ["information-you-give-us", "Information you give us"],
  ["information-we-collect", "Information we collect automatically"],
  ["other-sources", "Information from other sources"],
  ["how-we-use", "How we use information"],
  ["ai", "How we use AI"],
  ["who-can-see", "Who can see your information"],
  ["service-providers", "Service providers"],
  ["retention", "How long we keep information"],
  ["your-choices", "Your choices and rights"],
  ["security", "Security"],
  ["children", "Children"],
  ["international", "Where information is processed"],
  ["changes", "Changes to this policy"],
  ["contact", "Contact us"],
];

export default function PrivacyPage() {
  return (
    <LegalDoc
      eyebrow="onward/upward"
      title="Privacy Policy"
      updated={UPDATED}
      sections={SECTIONS}
      summary={
        <ul className="list-disc space-y-1.5 pl-5 marker:text-gold">
          <li>We collect what you give us to build your profile, plus how you use the site.</li>
          <li>
            Other signed-in members can see your profile. Share links, coach listings and reviews can
            be seen by anyone.
          </li>
          <li>
            We use Claude, by Anthropic, to read your portfolio and résumé, fill in your profile and
            match you with coaches.
          </li>
          <li>We don&apos;t sell your information or use it for advertising.</li>
          <li>If your browser sends Do Not Track or Global Privacy Control, we don&apos;t record analytics about you.</li>
          <li>
            Email hello@onwardupward.io to see, correct, download or delete your information.
          </li>
        </ul>
      }
    >
      <LegalSection id="who-we-are" title="Who we are">
        <p>
          onward/upward (&ldquo;onward/upward,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) is a growth
          network for people in tech, operated by <Fill>legal entity name, e.g. Formative Labs LLC</Fill>.
          This policy explains what we collect when you use onwardupward.io, how we use it, and the
          choices you have. It applies to members, coaches, hiring managers and visitors.
        </p>
      </LegalSection>

      <LegalSection id="information-you-give-us" title="Information you give us">
        <LegalList>
          <li>
            <strong>Account details.</strong> When you sign in with Google, we receive your name, email
            address and profile photo.
          </li>
          <li>
            <strong>Your profile.</strong> Location, role, career stage, years of experience,
            background, LinkedIn, portfolio and website links, work history, career highlights, your
            last role, the dream job, where you hope to grow, industries, AI skills and portfolio
            images.
          </li>
          <li>
            <strong>Résumé and portfolio password.</strong> If you upload a résumé or add a password for
            a protected portfolio, we store them so we can read your work and show it as described
            below.
          </li>
          <li>
            <strong>References.</strong> Names, titles and LinkedIn links for people who can vouch for
            you. Only add people who are comfortable being listed.
          </li>
          <li>
            <strong>Coach listings.</strong> If you coach: your offering, who you work with, pricing,
            credentials, booking or contact link, company and newsletter.
          </li>
          <li>
            <strong>Things you send.</strong> Requests to coaches, reviews, claims for a coach listing,
            and feedback or bug reports.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="information-we-collect" title="Information we collect automatically">
        <p>When you use onward/upward, we record how the product is used, including:</p>
        <LegalList>
          <li>Pages you view, the coaches you&apos;re shown and open, and links and buttons you click</li>
          <li>Filters and searches you use, recorded as general topics rather than the exact words you type</li>
          <li>The page that referred you, and basic device and browser information</li>
          <li>When you&apos;re signed in, this activity is associated with your account</li>
        </LegalList>
        <p>
          <strong>Cookies.</strong> We use cookies that keep you signed in, and a short-lived cookie
          when you claim a coach listing. We also use a first-party analytics identifier to understand
          visits. We don&apos;t use advertising cookies or third-party ad trackers.
        </p>
        <p>
          <strong>Do Not Track and Global Privacy Control.</strong> If your browser sends a Do Not
          Track or Global Privacy Control signal, we don&apos;t record analytics about your visit.
          Cookies needed to sign in, and records needed to run the service (such as limits on how many
          requests you can send), still apply.
        </p>
      </LegalSection>

      <LegalSection id="other-sources" title="Information from other sources">
        <LegalList>
          <li>
            <strong>Your links.</strong> When you add a portfolio, website or LinkedIn link, we fetch
            those pages (and linked pages and images on the same site) to fill in your profile. We can
            only read what&apos;s publicly available, or protected pages you give us the password for.
          </li>
          <li>
            <strong>Public coach information.</strong> Some coach listings are created from publicly
            available information, such as a coach&apos;s name, photo, company, website, description and
            newsletter. Coaches can claim their listing or ask us to remove it.
          </li>
          <li>
            <strong>Company logos.</strong> To illustrate work history, we look up company logos using
            public icon services. Those services receive a company&apos;s web address, not information
            about you.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="how-we-use" title="How we use information">
        <LegalList>
          <li>To run onward/upward: create your account, show your profile, and let you find and contact coaches</li>
          <li>To pre-fill your profile from your links and résumé, and recommend coaches who fit your goals</li>
          <li>To review membership applications and coach listings</li>
          <li>
            To send you email: account and request emails, plus a weekly digest and product updates you
            can turn off in Settings → Notifications
          </li>
          <li>To keep the service safe, enforce our Terms and prevent abuse and spam</li>
          <li>
            To understand how people use the product and improve it, including research on combined,
            de-identified usage data
          </li>
        </LegalList>
        <p>
          We don&apos;t sell your personal information, share it for cross-context behavioral
          advertising, or use it to show you ads.
        </p>
      </LegalSection>

      <LegalSection id="ai" title="How we use AI">
        <p>We use Claude, an AI model made by Anthropic, to:</p>
        <LegalList>
          <li>
            Read your portfolio, résumé and public links and suggest profile content, automatically after
            sign-up and when you use &ldquo;Fill with AI&rdquo;
          </li>
          <li>Write a short summary of your profile</li>
          <li>Match members with coaches, using your profile and the goals you share</li>
          <li>Group usage data and free text into general topics for product research</li>
        </LegalList>
        <p>
          AI-generated content can be wrong, so review what it adds to your profile. Anthropic processes
          this information on our behalf. Under Anthropic&apos;s commercial terms, information sent
          through its API isn&apos;t used to train its models.
        </p>
      </LegalSection>

      <LegalSection id="who-can-see" title="Who can see your information">
        <LegalList>
          <li>
            <strong>Signed-in members</strong> can see your profile: name, photo, location, experience,
            background, links, work history, highlights, industries, portfolio images, where you hope to
            grow and references. If you add a portfolio password, members viewing your profile can see it
            so they can open your portfolio.
          </li>
          <li>
            <strong>Your résumé</strong> is visible only to you and our team, unless you turn on
            &ldquo;Make my resume available to coaches and hiring managers,&rdquo; which shows it to
            coaches and hiring managers.
          </li>
          <li>
            <strong>Anyone with your share link</strong> can view your profile once it&apos;s approved.
          </li>
          <li>
            <strong>Coach listings and reviews are public.</strong> Coach pages, including reviews and
            the reviewer&apos;s name and photo, can be viewed by anyone and may appear in search engines.
          </li>
          <li>
            <strong>Coaches you contact</strong> receive your message, your email address so they can
            reply, and a summary of your profile (role, career stage, location, experience, recent role
            and goals).
          </li>
          <li>
            <strong>Our team</strong> can see accounts to review applications, provide support and keep
            the service safe.
          </li>
        </LegalList>
        <p>
          Uploaded files (photos, portfolio images and résumés) are stored at hard-to-guess web
          addresses. Anyone who has a file&apos;s direct link can open it, so share those links
          carefully.
        </p>
        <p>
          We may also share information if required by law, to protect the rights and safety of our
          members or others, or as part of a merger, acquisition or sale of assets, in which case this
          policy continues to apply.
        </p>
      </LegalSection>

      <LegalSection id="service-providers" title="Service providers">
        <p>We rely on these companies to run onward/upward. They process information only to provide their services to us:</p>
        <LegalList>
          <li><strong>Supabase</strong>: database, sign-in and file storage</li>
          <li><strong>Vercel</strong>: website hosting</li>
          <li><strong>Anthropic</strong>: AI processing</li>
          <li><strong>Resend</strong>: email delivery</li>
          <li><strong>Google</strong>: sign-in</li>
        </LegalList>
      </LegalSection>

      <LegalSection id="retention" title="How long we keep information">
        <LegalList>
          <li>We keep your account and profile while your account is open.</li>
          <li>
            If we remove a member from the network, we keep their information archived, not visible to
            anyone else, unless they ask us to delete it.
          </li>
          <li>Detailed usage records are kept for up to 25 months, and combined statistics longer.</li>
          <li>
            When you ask us to delete your account, we delete your information within 30 days, except
            where we must keep something to meet legal obligations, resolve disputes or prevent abuse.
            Copies in backups are removed on their normal schedule.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="your-choices" title="Your choices and rights">
        <LegalList>
          <li>Edit your profile any time, and choose whether coaches and hiring managers can see your résumé.</li>
          <li>Turn email notifications on or off in Settings → Notifications.</li>
          <li>Use Do Not Track or Global Privacy Control to stop analytics about your visits.</li>
          <li>
            Email <a href="mailto:hello@onwardupward.io">hello@onwardupward.io</a> to see, download,
            correct or delete your information, or to ask us to remove a coach listing about you.
          </li>
        </LegalList>
        <p>
          Depending on where you live, including California, other US states, the UK and the European
          Union, you may have rights to access, correct, delete or port your information, and to object
          to or restrict certain uses. We&apos;ll respond within 30 days, or sooner where the law
          requires, and we won&apos;t treat you differently for making a request. If you&apos;re in the
          UK or EU, we process your information to provide the service you signed up for, for our
          legitimate interests in running and improving it, and with your consent where required. You
          can also complain to your local data protection authority.
        </p>
      </LegalSection>

      <LegalSection id="security" title="Security">
        <p>
          We use reasonable safeguards, including encrypted connections and access controls, to protect
          your information. No online service can be completely secure, so we can&apos;t guarantee
          absolute security.
        </p>
      </LegalSection>

      <LegalSection id="children" title="Children">
        <p>
          onward/upward is for people 18 and older. We don&apos;t knowingly collect information from
          anyone under 18. If you believe a minor has created an account, contact us and we&apos;ll
          delete it.
        </p>
      </LegalSection>

      <LegalSection id="international" title="Where information is processed">
        <p>
          We&apos;re based in the United States, and our service providers may process information in
          the US and other countries. Where required, we rely on appropriate safeguards for transfers.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="Changes to this policy">
        <p>
          We&apos;ll update the date at the top when this policy changes. If a change is significant,
          we&apos;ll tell you by email or on the site before it takes effect.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="Contact us">
        <p>
          <Fill>legal entity name</Fill>
          <br />
          <Fill>mailing address</Fill>
          <br />
          <a href="mailto:hello@onwardupward.io">hello@onwardupward.io</a>
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
