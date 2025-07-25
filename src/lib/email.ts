"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationRequest({ identifier: email, url }: { identifier: string; url: string; }) {
  try {
    const { error } = await resend.emails.send({
      from: "become@1000000x.dev",
      to: email,
      subject: "Sign in to 1,000,000x.dev",
      html: `
        <div style="font-family: sans-serif; padding: 24px; max-width: 600px; margin: 0 auto;">
          <h1 style="font-size: 24px; margin-bottom: 16px; color: #333;">Sign in to 1,000,000x.dev</h1>
          <p style="margin-bottom: 24px; color: #666; line-height: 1.5;">
            Click the button below to sign in to your account. This link will expire in 24 hours.
          </p>
          <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 500;">
            Become 1,000,000x
          </a>
          <p style="margin-top: 24px; color: #999; font-size: 14px;">
            If you didn't request this email, you can safely ignore it.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(`Failed to send verification email: ${error.message}`);
    }


  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email.");
  }
}