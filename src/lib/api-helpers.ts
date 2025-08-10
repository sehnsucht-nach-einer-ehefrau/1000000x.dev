export async function validateGroqApiKey(
	apiKey: string,
	timeoutMs = 4000,
): Promise<boolean> {
	if (!apiKey || !apiKey.startsWith("gsk_")) return false;

	const controller = new AbortController();
	const t = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const res = await fetch("https://api.groq.com/openai/v1/models", {
			method: "GET",
			headers: {
				Authorization: `Bearer ${apiKey}`,
			},
			signal: controller.signal,
		});

		// 200: key is valid
		if (res.ok) return true;

		// 401/403: invalid/unauthorized key
		if (res.status === 401 || res.status === 403) return false;

		// Anything else: treat as failure
		return false;
	} catch {
		// network/timeout/etc.
		return false;
	} finally {
		clearTimeout(t);
	}
}
