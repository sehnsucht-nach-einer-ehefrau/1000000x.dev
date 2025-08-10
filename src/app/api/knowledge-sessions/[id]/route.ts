// app/api/knowledge-sessions/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { db } from "@/lib/db/index";
import { knowledgeSessions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET a specific session by its ID
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(request: Request, context: any) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = context.params;

		if (!id) {
			return NextResponse.json(
				{ error: "Missing session ID" },
				{ status: 400 },
			);
		}

		const sessionData = await db
			.select()
			.from(knowledgeSessions)
			.where(
				and(
					eq(knowledgeSessions.id, id),
					eq(knowledgeSessions.userId, session.user.id),
				),
			)
			.limit(1);

		if (sessionData.length === 0) {
			return NextResponse.json({ error: "Session not found" }, { status: 404 });
		}

		return NextResponse.json(sessionData[0]);
	} catch (error) {
		console.error("Error fetching knowledge session:", error);
		return NextResponse.json(
			{ error: "Failed to fetch knowledge session" },
			{ status: 500 },
		);
	}
}

// UPDATE a session's nodes and connections
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PUT(request: Request, context: any) {
	const { id } = context.params;
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		if (!id) {
			return NextResponse.json(
				{ error: "Missing session ID" },
				{ status: 400 },
			);
		}

		const body = await request.json();
		const { nodes, connections } = body;

		if (!nodes || !connections) {
			return NextResponse.json(
				{ error: "Missing nodes or connections data" },
				{ status: 400 },
			);
		}

		const result = await db
			.update(knowledgeSessions)
			.set({
				nodesData: JSON.stringify(nodes),
				connectionsData: JSON.stringify(connections),
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(knowledgeSessions.id, id),
					eq(knowledgeSessions.userId, session.user.id),
				),
			)
			.returning();

		if (result.length === 0) {
			return NextResponse.json(
				{ error: "Session not found or user not authorized to update" },
				{ status: 404 },
			);
		}

		return NextResponse.json({ message: "Session updated" });
	} catch (error) {
		console.error("Error updating knowledge session:", error);
		return NextResponse.json(
			{ error: "Failed to update knowledge session" },
			{ status: 500 },
		);
	}
}

// DELETE a session
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(request: Request, context: any) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = context.params;

		if (!id) {
			return NextResponse.json(
				{ error: "Missing session ID" },
				{ status: 400 },
			);
		}

		// Drizzle's delete with a where clause ensures we only delete the session
		// if it belongs to the currently logged-in user.
		const result = await db
			.delete(knowledgeSessions)
			.where(
				and(
					eq(knowledgeSessions.id, id),
					eq(knowledgeSessions.userId, session.user.id),
				),
			)
			.returning({ deletedId: knowledgeSessions.id });

		if (result.length === 0) {
			return NextResponse.json(
				{ error: "Session not found or user not authorized to delete" },
				{ status: 404 },
			);
		}

		return NextResponse.json({
			message: "Session deleted successfully",
			sessionId: result[0].deletedId,
		});
	} catch (error) {
		console.error("Error deleting knowledge session:", error);
		return NextResponse.json(
			{ error: "Failed to delete knowledge session" },
			{ status: 500 },
		);
	}
}
