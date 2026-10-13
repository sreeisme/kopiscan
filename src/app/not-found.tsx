import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-xl font-bold">Page not found</h1>
      <p className="text-neutral-600">If you scanned a table QR code, please ask a staff member for help.</p>
      <Link href="/" className="underline">
        Go home
      </Link>
    </main>
  );
}
