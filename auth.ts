import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Resend from "next-auth/providers/resend"
import PostgresAdapter from "@auth/pg-adapter"
import { db } from "@/lib/db"
import { Resend as ResendClient } from "resend"
import { magicLinkEmailHtml, magicLinkEmailText } from "@/lib/email-templates"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PostgresAdapter(db),
  providers: [
    Google,
    Resend({
      from: "onboarding@resend.dev",
      async sendVerificationRequest({ identifier: email, url, provider }) {
        const resend = new ResendClient(provider.apiKey);
        await resend.emails.send({
          from: provider.from as string,
          to: email,
          subject: "Sign in to Tender",
          html: magicLinkEmailHtml(url),
          text: magicLinkEmailText(url),
        });
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
})
