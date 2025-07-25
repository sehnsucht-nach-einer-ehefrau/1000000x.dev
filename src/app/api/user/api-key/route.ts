import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userRecord = await db
      .select({ groqApiKey: users.groqApiKey })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ apiKey: userRecord[0].groqApiKey });
  } catch (error) {
    console.error('Error fetching API key:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';

// This function is a placeholder for actual validation logic.
// In a real scenario, you'd make a simple, low-cost call to the Groq API.
async function validateGroqApiKey(apiKey: string): Promise<boolean> {
  if (!apiKey.startsWith('gsk_')) {
    return false;
  }
  try {
    const groq = new OpenAI({ apiKey, baseURL: 'https://api.groq.com/openai/v1' });
    // A very lightweight call to check if the key is valid.
    // This specific model listing might change, so it's not perfectly robust,
    // but it's a decent check without incurring cost.
    await groq.models.list();
    return true;
  } catch (error) {
    console.error('Groq API key validation failed:', error);
    return false;
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { apiKey } = await request.json();

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    const isValid = await validateGroqApiKey(apiKey);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid Groq API key' }, { status: 400 });
    }

    await db
      .update(users)
      .set({ groqApiKey: apiKey })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving API key:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
