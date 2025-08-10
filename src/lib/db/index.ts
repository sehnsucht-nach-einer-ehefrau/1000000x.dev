import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL environment variable is not set');
}

if (!process.env.DATABASE_AUTH_TOKEN) {
	throw new Error('DATABASE_AUTH_TOKEN environment variable is not set');
}

const client = createClient({
	url: process.env.DATABASE_URL,
	authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
