import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { db } from "@/lib/db/index";
import { knowledgeSessions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

// GET all sessions for the logged-in user
export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const sessions = await db
			.select()
			.from(knowledgeSessions)
			.where(eq(knowledgeSessions.userId, session.user.id))
			.orderBy(desc(knowledgeSessions.updatedAt)); // Order by most recently updated

		return NextResponse.json({ sessions });
	} catch (error) {
		console.error("Error fetching knowledge sessions:", error);
		return NextResponse.json(
			{ error: "Failed to fetch knowledge sessions" },
			{ status: 500 },
		);
	}
}

// POST a new session
export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { title, initialQuery, nodes, connections } = await request.json();

		if (!title || !initialQuery || !nodes || !connections) {
			return NextResponse.json(
				{ error: "Missing required session data" },
				{ status: 400 },
			);
		}

		const sessionId = nanoid();
		await db.insert(knowledgeSessions).values({
			id: sessionId,
			userId: session.user.id,
			title,
			initialQuery,
			nodesData: JSON.stringify(nodes),
			connectionsData: JSON.stringify(connections),
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		return NextResponse.json({ sessionId });
	} catch (error) {
		console.error("Error creating knowledge session:", error);
		return NextResponse.json(
			{ error: "Failed to create knowledge session" },
			{ status: 500 },
		);
	}
}

