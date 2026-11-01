import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-svh place-items-center bg-paper px-6">
      <div className="max-w-xl">
        <p className="font-semibold text-purple">Page not found</p>
        <h1 className="t-h1 mt-3">We can&apos;t find that page</h1>
        <p className="t-lead mt-5 text-muted">It may have moved. Try the home page, or find a ministry or programme that fits you.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="inline-flex min-h-12 items-center rounded-sm bg-gold px-6 font-semibold text-ink hover:bg-gold-hover">Go home</Link>
          <Link href="/ministries" className="inline-flex min-h-12 items-center rounded-sm border border-ink/35 px-6 font-semibold hover:bg-ink hover:text-paper">Explore ministries</Link>
        </div>
      </div>
    </main>
  );
}
