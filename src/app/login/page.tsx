import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const next = sp.next?.startsWith("/") && !sp.next.startsWith("//") ? sp.next : "/staff";
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 p-6">
      <div>
        <div className="text-2xl font-bold">Kopiscan</div>
        <p className="text-sm text-neutral-600">Sign in to your restaurant dashboard</p>
      </div>
      {sp.error === "no-restaurant" && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          Your account isn&apos;t linked to a restaurant yet. Ask the owner to invite you.
        </p>
      )}
      {sp.error === "link" && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">That sign-in link is invalid or expired. Please try again.</p>
      )}
      <LoginForm next={next} />
    </main>
  );
}
