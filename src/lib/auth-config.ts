import { type NextAuthOptions } from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import EmailProvider from "next-auth/providers/email";
import { db } from "./db/index";
import { sendVerificationRequest } from "./email";

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db),
  session: {
    strategy: "database",
  },
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
  },
  providers: [
    EmailProvider({
      from: process.env.EMAIL_FROM || "noreply@1000000x.dev",
      sendVerificationRequest,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (user && session.user) {
        session.user.id = user.id;
      }
      return session;
    },
    async redirect({ baseUrl }) {
      return `${baseUrl}/dashboard`;
    },
  },
  events: {
    createUser: async () => {

    },
    signIn: async () => {

    },
  },
  debug: process.env.NODE_ENV === "development",
};