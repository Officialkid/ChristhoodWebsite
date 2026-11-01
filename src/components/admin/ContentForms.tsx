"use client";

import { useRouter } from "next/navigation";
import { deleteLeader, deleteMessage, deleteStory, saveBanner, saveHome, saveLeader, saveMessage, saveSettings, saveStory } from "@/app/123admin/actions-content";
import { DeleteButton, SaveButton, SelectField, TextArea, TextField, Toggle, useSave } from "./forms";
import { PhotoField } from "./PhotoField";
import { LinkButton } from "./ui";
import type { BannerDoc, LeaderRec, MessageRec, StoryRec } from "@/lib/content";
import type { SiteSettings } from "@/lib/types";

const actionsRow = "flex flex-wrap items-center gap-3 border-t border-rule pt-6";

/* ---------- announcement bar ---------- */
export function BannerForm({ banner }: { banner: BannerDoc | null }) {
  const { run, formRef, errors } = useSave(saveBanner);
  return (
    <form ref={formRef} action={run} className="grid max-w-2xl gap-6" noValidate>
      <Toggle name="active" label="Show the announcement bar" hint="A short line across the top of every page." defaultChecked={banner?.active} />
      <TextField name="message" label="Message" defaultValue={banner?.message} error={errors.message} maxLength={200} hint="Keep it to one line. For example “Jewels Kids Camp registration is open.”" />
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField name="label" label="Link words" optional defaultValue={banner?.label} maxLength={40} hint="For example “Register now”." />
        <TextField name="href" label="Where the link goes" optional defaultValue={banner?.href} error={errors.href} hint="/events, or a full https:// link." />
      </div>
      <TextField name="expires" label="Hide it after" optional type="date" defaultValue={banner?.expires?.slice(0, 10)} hint="It switches itself off on this date." />
      <div className={actionsRow}><SaveButton /></div>
    </form>
  );
}

/* ---------- messages ---------- */
export function MessageForm({ message }: { message?: MessageRec }) {
  const router = useRouter();
  const { run, formRef, errors } = useSave(saveMessage, () => router.push("/123admin/messages"));
  return (
    <form ref={formRef} action={run} className="grid max-w-2xl gap-6" noValidate>
      <input type="hidden" name="id" value={message?.id ?? ""} />
      <TextField name="title" label="Title" defaultValue={message?.title} error={errors.title} maxLength={140} required />
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField name="speaker" label="Speaker" optional defaultValue={message?.speaker} maxLength={80} />
        <TextField name="date" label="Date" optional type="date" defaultValue={message?.date} error={errors.date} />
      </div>
      <TextField name="youtube" label="YouTube link" optional defaultValue={message?.youtube} error={errors.youtube} hint="Paste the address of the video. It plays on the home page." />
      <TextArea name="summary" label="Short description" optional rows={3} defaultValue={message?.summary} maxLength={400} />
      <div className={actionsRow}>
        <SaveButton>{message ? "Save message" : "Add message"}</SaveButton>
        <LinkButton href="/123admin/messages" variant="ghost">Cancel</LinkButton>
        {message && <span className="ml-auto"><DeleteButton action={async (fd) => { const r = await deleteMessage(fd); if (r.ok) router.push("/123admin/messages"); return r; }} fields={{ id: message.id }} label="Delete message" /></span>}
      </div>
    </form>
  );
}

/* ---------- leaders and stories ---------- */
export function LeaderForm({ leader }: { leader?: LeaderRec }) {
  const router = useRouter();
  const { run, formRef, errors } = useSave(saveLeader, () => router.push("/123admin/people"));
  return (
    <form ref={formRef} action={run} className="grid max-w-3xl gap-6" noValidate>
      <input type="hidden" name="id" value={leader?.id ?? ""} />
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField name="name" label="Name" defaultValue={leader?.name} error={errors.name} maxLength={80} required />
        <TextField name="role" label="Role" defaultValue={leader?.role} error={errors.role} maxLength={120} required />
      </div>
      <PhotoField name="photo" label="Photo" defaultValue={leader?.photo} focusName={undefined} />
      <TextArea name="teaser" label="The opening words" rows={3} defaultValue={leader?.teaser} maxLength={600} hint="Shown on the leadership page before “Read more”." />
      <TextArea name="story" label="Their story" rows={9} defaultValue={leader?.story?.join("\n\n")} hint="Leave a blank line between paragraphs." />
      <div className={actionsRow}>
        <SaveButton>{leader ? "Save leader" : "Add leader"}</SaveButton>
        <LinkButton href="/123admin/people" variant="ghost">Cancel</LinkButton>
        {leader && <span className="ml-auto"><DeleteButton action={async (fd) => { const r = await deleteLeader(fd); if (r.ok) router.push("/123admin/people"); return r; }} fields={{ id: leader.id }} label="Remove leader" /></span>}
      </div>
    </form>
  );
}

export function StoryForm({ story }: { story?: StoryRec }) {
  const router = useRouter();
  const { run, formRef, errors } = useSave(saveStory, () => router.push("/123admin/people"));
  return (
    <form ref={formRef} action={run} className="grid max-w-3xl gap-6" noValidate>
      <input type="hidden" name="id" value={story?.id ?? ""} />
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField name="name" label="Name" defaultValue={story?.name} error={errors.name} maxLength={80} required />
        <TextField name="role" label="Who they are" optional defaultValue={story?.role} maxLength={120} hint="For example “Teen Life camper, 2025”." />
      </div>
      <TextArea name="quote" label="What they said" rows={5} defaultValue={story?.quote} error={errors.quote} maxLength={1200} required />
      <PhotoField name="photo" label="Photo" optional defaultValue={story?.photo} />
      <div className={actionsRow}>
        <SaveButton>{story ? "Save story" : "Add story"}</SaveButton>
        <LinkButton href="/123admin/people" variant="ghost">Cancel</LinkButton>
        {story && <span className="ml-auto"><DeleteButton action={async (fd) => { const r = await deleteStory(fd); if (r.ok) router.push("/123admin/people"); return r; }} fields={{ id: story.id }} label="Remove story" /></span>}
      </div>
    </form>
  );
}

/* ---------- home page words ---------- */
export function HomeForm({ settings }: { settings: SiteSettings }) {
  const { run, formRef, errors } = useSave(saveHome);
  return (
    <form ref={formRef} action={run} className="grid max-w-3xl gap-8" noValidate>
      <fieldset className="grid gap-6">
        <legend className="mb-1 text-xl font-bold">Top of the page</legend>
        <TextField name="headline" label="Big headline" defaultValue={settings.hero.headline} error={errors.headline} maxLength={60} hint="Short and strong. Three words work best." />
        <TextField name="sub" label="Line under it" defaultValue={settings.hero.sub} maxLength={240} />
        <TextField name="kicker" label="Small line at the bottom" defaultValue={settings.hero.kicker} maxLength={140} hint="Usually when and where you meet." />
      </fieldset>
      <fieldset className="grid gap-6">
        <legend className="mb-1 text-xl font-bold">Word for the week</legend>
        <TextArea name="verse" label="Scripture" rows={3} defaultValue={settings.verse.text} maxLength={400} hint="Shown on the home page as an animated verse. Change it every week." />
        <TextField name="ref" label="Reference" defaultValue={settings.verse.ref} maxLength={60} hint="For example John 3:16." />
      </fieldset>
      <fieldset className="grid gap-6">
        <legend className="mb-1 text-xl font-bold">Welcome</legend>
        <TextArea name="welcome" label="Welcome words" rows={12} defaultValue={settings.welcome.join("\n\n")} hint="Leave a blank line between paragraphs." />
      </fieldset>
      <div className={actionsRow}><SaveButton /></div>
    </form>
  );
}

/* ---------- church details ---------- */
export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const { run, formRef, errors } = useSave(saveSettings);
  const f = settings.fellowship;
  const phones = [0, 1, 2].map((i) => settings.contact.phones[i]);
  return (
    <form ref={formRef} action={run} className="grid max-w-3xl gap-10" noValidate>
      <fieldset className="grid gap-6">
        <legend className="mb-1 text-xl font-bold">Saturday fellowship</legend>
        <div className="grid gap-6 sm:grid-cols-3">
          <SelectField name="day" label="Day" defaultValue={f.day} options={["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d) => ({ value: d, label: d }))} />
          <TextField name="start" label="Starts" defaultValue={f.start} error={errors.start} hint="24-hour, like 15:00" maxLength={5} />
          <TextField name="end" label="Ends" defaultValue={f.end} error={errors.end} hint="24-hour, like 18:30" maxLength={5} />
        </div>
        <TextField name="display" label="Time as people read it" defaultValue={f.display} maxLength={40} hint="For example 3:00 PM – 6:30 PM." />
        <div className="grid gap-6 sm:grid-cols-2">
          <TextField name="venue" label="Venue" defaultValue={f.venue} maxLength={120} />
          <TextField name="area" label="Area" defaultValue={f.area} maxLength={160} />
        </div>
        <TextField name="address" label="Full address" defaultValue={f.address} maxLength={300} />
      </fieldset>
      <fieldset className="grid gap-6">
        <legend className="mb-1 text-xl font-bold">Contact</legend>
        {[1, 2, 3].map((n) => (
          <div key={n} className="grid gap-6 sm:grid-cols-2">
            <TextField name={`phoneLabel${n}`} label={`Phone ${n} name`} optional={n > 1} defaultValue={phones[n - 1]?.label} maxLength={40} />
            <TextField name={`phone${n}`} label={`Phone ${n} number`} optional={n > 1} type="tel" defaultValue={phones[n - 1]?.display} error={n === 1 ? errors.phone1 : undefined} maxLength={30} />
          </div>
        ))}
        <TextField name="email" label="Email" type="email" defaultValue={settings.contact.email} error={errors.email} maxLength={120} />
      </fieldset>
      <fieldset className="grid gap-6">
        <legend className="mb-1 text-xl font-bold">Giving</legend>
        <div className="grid gap-6 sm:grid-cols-3">
          <TextField name="bank" label="Bank" defaultValue={settings.giving.bank} maxLength={80} />
          <TextField name="paybill" label="Paybill" defaultValue={settings.giving.paybill} maxLength={20} />
          <TextField name="account" label="Account number" defaultValue={settings.giving.account} maxLength={40} />
        </div>
      </fieldset>
      <div className={actionsRow}><SaveButton /></div>
    </form>
  );
}
