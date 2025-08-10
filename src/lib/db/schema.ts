import {
	sqliteTable,
	text,
	integer,
	primaryKey,
} from "drizzle-orm/sqlite-core";

// -------- USERS (with groqApiKey back) --------
export const users = sqliteTable("user", {
	id: text("id").primaryKey(), // UUID string
	name: text("name"),
	email: text("email").notNull().unique(),
	emailVerified: integer("emailVerified", { mode: "timestamp" }),
	image: text("image"),
	groqApiKey: text("groqApiKey"), // <— here
});

// -------- SESSIONS --------
export const sessions = sqliteTable("session", {
	sessionToken: text("sessionToken").primaryKey(),
	userId: text("userId")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	expires: integer("expires", { mode: "timestamp" }).notNull(),
});

// -------- VERIFICATION TOKENS --------
export const verificationTokens = sqliteTable(
	"verificationToken",
	{
		identifier: text("identifier").notNull(),
		token: text("token").notNull(),
		expires: integer("expires", { mode: "timestamp" }).notNull(),
	},
	(t) => ({ pk: primaryKey(t.identifier, t.token) }),
);

// -------- YOUR APP TABLE --------
export const knowledgeSessions = sqliteTable("knowledge_sessions", {
	id: text("id").primaryKey(),
	userId: text("userId")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	title: text("title").notNull(),
	initialQuery: text("initialQuery").notNull(),
	nodesData: text("nodesData").notNull(),
	connectionsData: text("connectionsData").notNull(),
	createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
	updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

// -------- TYPES --------
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type VerificationToken = typeof verificationTokens.$inferSelect;
export type KnowledgeSession = typeof knowledgeSessions.$inferSelect;
