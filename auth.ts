import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Resend from "next-auth/providers/resend"
import PostgresAdapter from "@auth/pg-adapter"
import { db } from "@/lib/db"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PostgresAdapter(db),
  providers: [
    Google,
    Resend({
      from: "onboarding@resend.dev",
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
})
