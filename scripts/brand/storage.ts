/** Uploads rendered assets to the public `brand` bucket in Supabase Storage under content-hashed names. */
import { createHash } from "node:crypto";

export type Asset = { name: string; body: Uint8Array<ArrayBuffer>; type: string };

export const BUCKET = "brand";

export function hashedName(name: string, body: Uint8Array): string {
	const hash = createHash("sha256").update(body).digest("hex").slice(0, 10);
	const dot = name.lastIndexOf(".");
	return `${name.slice(0, dot)}-${hash}${name.slice(dot)}`;
}

export async function uploadAssets(
	assets: Asset[],
): Promise<Record<string, string>> {
	const url = process.env.SUPABASE_URL;
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !key)
		throw new Error(
			"SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to upload",
		);
	const auth = { apikey: key, Authorization: `Bearer ${key}` };

	const existing = await fetch(`${url}/storage/v1/bucket/${BUCKET}`, { headers: auth });
	if (existing.status === 404) {
		const created = await fetch(`${url}/storage/v1/bucket`, {
			method: "POST",
			headers: { ...auth, "Content-Type": "application/json" },
			body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
		});
		if (!created.ok) throw new Error(`bucket create failed: ${created.status} ${await created.text()}`);
	} else if (!existing.ok) {
		throw new Error(`bucket lookup failed: ${existing.status} ${await existing.text()}`);
	}

	const urls: Record<string, string> = {};
	for (const asset of assets) {
		const name = hashedName(asset.name, asset.body);
		const res = await fetch(`${url}/storage/v1/object/${BUCKET}/${name}`, {
			method: "POST",
			headers: {
				...auth,
				"Content-Type": asset.type,
				"x-upsert": "true",
				"cache-control": "max-age=31536000, immutable",
			},
			body: asset.body,
		});
		if (!res.ok)
			throw new Error(
				`upload ${name} failed: ${res.status} ${await res.text()}`,
			);
		urls[asset.name] = `${url}/storage/v1/object/public/${BUCKET}/${name}`;
		console.log(`uploaded ${name}`);
	}
	return urls;
}
