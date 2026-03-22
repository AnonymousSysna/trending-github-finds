import { redirect } from "next/navigation";
import Link from "next/link";

type ConfirmPageProps = {
  searchParams?: {
    token?: string;
  };
};

export default function ConfirmPage({ searchParams }: ConfirmPageProps) {
  const token = searchParams?.token;
  if (token) {
    redirect(`/api/confirm?token=${encodeURIComponent(token)}`);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <div className="text-5xl mb-6">🎉</div>
      <h1 className="text-2xl font-bold text-white mb-3">You&apos;re subscribed!</h1>
      <p className="text-gray-400 mb-8">
        Your first digest will arrive tomorrow morning at 6AM UTC. You&apos;re going to love it.
      </p>
      <Link
        href="/"
        className="inline-block bg-green-500 hover:bg-green-400 text-black font-semibold px-6 py-3 rounded-xl transition-colors"
      >
        See today&apos;s trending repos →
      </Link>
    </div>
  );
}
