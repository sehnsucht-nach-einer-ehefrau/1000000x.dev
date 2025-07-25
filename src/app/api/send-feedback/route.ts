import { NextResponse } from "next/server";
import { Resend } from "resend";
import FeedbackEmail from "@/emails/feedback-email";
import * as React from "react";

const resend = new Resend(process.env.RESEND_API_KEY);
const toEmail =
  process.env.FEEDBACK_EMAIL_TO || "sehnsucht.nach.einer.ehefrau@gmail.com";

export async function POST(request: Request) {
  try {
    const { email, message } = await request.json();

    if (!email || !message) {
      return NextResponse.json(
        { error: "Email and message are required." },
        { status: 400 },
      );
    }

    const { data, error } = await resend.emails.send({
      from: "Feedback <onboarding@resend.dev>",
      to: [toEmail],
      subject: "New Feedback for 10x Developer",
      replyTo: email,
      react: FeedbackEmail({ email, message }) as React.ReactElement,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 },
    );
  }
}
