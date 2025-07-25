import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";

// Minimal Users table - just email
export const users = sqliteTable("user", {
  id: text("id").notNull().primaryKey(), // NextAuth expects a string ID (usually UUID)
  email: text("email").notNull().unique(),
  name: text("name"),  // optional, but NextAuth sometimes references name
  groqApiKey: text("groqApiKey"),
});

// Minimal Sessions table
export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").notNull().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

// Knowledge sessions table - unchanged, still references user
export const knowledgeSessions = sqliteTable("knowledge_sessions", {
  id: text("id").notNull().primaryKey(),
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

export type KnowledgeSession = typeof knowledgeSessions.$inferSelect;
