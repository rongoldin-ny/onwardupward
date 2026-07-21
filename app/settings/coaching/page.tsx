import { requireCandidate } from "@/lib/auth";
import { getCoachByProfileId } from "@/lib/coaches-db";
import CoachListingForm from "@/components/CoachListingForm";
import SettingsShell from "../SettingsShell";

/** Member hybrid opt-in: designers and PMs who also mentor appear in the coach bench. */
export default async function CoachingSettingsPage() {
  const user = await requireCandidate();
  const listing = await getCoachByProfileId(user.id);

  return (
    <SettingsShell
      title="Coaching."
      subtitle={
        !listing
          ? "Open to mentoring other designers and PMs? Set up a coach listing and appear on the bench alongside the industry's best."
          : listing.status === "pending"
            ? "Your coach listing is under review — you'll get an email the moment it's live."
            : "Your coach listing is live in the directory. Edits go live immediately."
      }
    >
      <CoachListingForm
        existing={listing}
        prefill={{ name: user.name, email: user.email, photoUrl: user.photo_url }}
        submitLabel={listing ? "Save changes" : "Submit for review"}
      />
    </SettingsShell>
  );
}
