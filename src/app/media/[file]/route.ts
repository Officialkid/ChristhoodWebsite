import { store } from "@/lib/store";

/** Serves uploaded pictures that are kept in the database or in local files. */
export async function GET(_req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  if (!/^[a-z0-9]{10,32}(-sm|-md)?\.webp$/i.test(file)) return new Response("Not found", { status: 404 });
  const bytes = await store.getBlob(file);
  if (!bytes) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(bytes), {
    headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}
