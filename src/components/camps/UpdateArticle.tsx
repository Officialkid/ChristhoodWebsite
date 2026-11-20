/** One update from the camp team, exactly as a parent reads it on their family page. The team area's preview uses the same markup so the two cannot drift apart. */
export function UpdateArticle({ title, stamp, audience, body }: { title: string; stamp: string; audience?: string; body: string }) {
  return (
    <article className="border-b border-rule py-7">
      <h3 className="text-xl">{title}</h3>
      <p className="mt-1 text-[0.92rem] text-muted">{stamp}{audience ? ` · ${audience}` : ""}</p>
      <p className="reading mt-3 whitespace-pre-line text-muted">{body}</p>
    </article>
  );
}
