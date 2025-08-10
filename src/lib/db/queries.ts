import { db } from "./index";
import { knowledgeSessions } from "./schema";
import { eq, desc } from "drizzle-orm";

export async function getKnowledgeSessions(userId: string, limit = 20) {
	try {
		return await db
			.select()
			.from(knowledgeSessions)
			.where(eq(knowledgeSessions.userId, userId))
			.orderBy(desc(knowledgeSessions.createdAt))
			.limit(limit);
	} catch (error) {
		console.error("Error fetching knowledge sessions:", error);
		return [];
	}
}
