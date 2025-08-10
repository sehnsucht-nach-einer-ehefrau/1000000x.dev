import { NextResponse } from "next/server";

export async function GET() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const userRecord = await db
			.select({ groqApiKey: users.groqApiKey })
			.from(users)
			.where(eq(users.id, session.user.id))
			.limit(1);

		if (userRecord.length === 0) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		return NextResponse.json({ apiKey: userRecord[0].groqApiKey });
	} catch (error) {
		console.error("Error fetching API key:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { validateGroqApiKey } from "@/lib/api-helpers";

export async function POST(request: Request) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { apiKey } = await request.json();

		if (!apiKey || typeof apiKey !== "string") {
			return NextResponse.json(
				{ error: "API key is required" },
				{ status: 400 },
			);
		}

		const isValid = await validateGroqApiKey(apiKey);
		if (!isValid) {
			return NextResponse.json(
				{ error: "Invalid Groq API key" },
				{ status: 400 },
			);
		}

		await db
			.update(users)
			.set({ groqApiKey: apiKey })
			.where(eq(users.id, session.user.id));

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
