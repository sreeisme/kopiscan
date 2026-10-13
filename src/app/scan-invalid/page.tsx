export const metadata = { title: "QR code not recognised" };

export default function ScanInvalid() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="text-5xl">🤔</div>
      <h1 className="text-xl font-bold">This QR code isn&apos;t active</h1>
      <p className="text-neutral-600">It may be an old code. Please ask a staff member for help, or scan the QR code on your table again.</p>
    </main>
  );
}
