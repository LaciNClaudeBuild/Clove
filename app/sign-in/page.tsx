import { signIn } from "@/auth";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  async function signInWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: "/dashboard" });
  }

  async function signInWithEmail(formData: FormData) {
    "use server";
    await signIn("resend", formData);
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm rounded-[20px] border border-border bg-cream p-8 shadow-[0_1px_2px_rgba(74,63,53,0.06),0_10px_28px_rgba(74,63,53,0.08)]">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl text-text">Tender</h1>
          <p className="mt-2 text-sm text-text-muted">
            Sign in to shorten a link or build a QR code.
          </p>
        </div>

        {error && (
          <p className="mb-6 rounded-xl border border-terracotta/30 bg-terracotta/10 px-4 py-3 text-sm text-terracotta-hover">
            Couldn&apos;t sign you in. Try again, or use the other option below.
          </p>
        )}

        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-text transition-colors hover:bg-sand"
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </form>

        <div className="my-6 flex items-center gap-3" role="separator">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs text-text-muted">or</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <form action={signInWithEmail} className="space-y-3">
          <input type="hidden" name="redirectTo" value="/dashboard" />
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm text-text">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-text placeholder:text-text-muted focus:border-olive focus:outline-none focus:ring-2 focus:ring-olive/25"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-olive px-4 py-3 text-sm font-medium text-cream transition-colors hover:bg-olive-hover"
          >
            Send magic link
          </button>
        </form>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.87 2.7-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.94v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.94A9 9 0 0 0 0 9c0 1.45.35 2.83.94 4.03l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .94 4.97l3.01 2.33C4.66 5.17 6.65 3.58 9 3.58Z"
      />
    </svg>
  );
}
