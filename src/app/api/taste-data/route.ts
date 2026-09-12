import { fetchTasteData } from "@/lib/catalogue";

export const dynamic = "force-static";
export const revalidate = 86400;

/** Film genres, credits, and summaries for the taste profile, generated at build and refreshed daily. */
export async function GET() {
  const catalogue = await fetchTasteData();
  return Response.json(catalogue, {
    headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
  });
}
