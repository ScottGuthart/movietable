import { fetchFilmDetail } from "@/lib/catalogue";

export const revalidate = 86400;

const SLUG = /^[a-z0-9][a-z0-9-]{0,199}$/;

/** Synopsis, credits, and every US streaming offer for one film, refreshed daily. */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!SLUG.test(slug)) return Response.json({ error: "Unknown film." }, { status: 400 });
  const detail = await fetchFilmDetail(slug);
  if (!detail) return Response.json({ error: "Unknown film." }, { status: 404 });
  return Response.json(detail, {
    headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
  });
}
