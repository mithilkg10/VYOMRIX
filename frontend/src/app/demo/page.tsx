import Link from "next/link";

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold">VYOMRIX Recruiter Demo</h1>
      <p className="mt-4 text-neutral-400">Public read-only demonstration workspace.</p>
      <Link href="/login" className="mt-6 inline-block underline">Operator login</Link>
    </main>
  );
}
