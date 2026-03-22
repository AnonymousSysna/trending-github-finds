import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/5 mt-16 py-8 text-center text-sm text-gray-500">
      <div className="mx-auto max-w-6xl px-4 flex flex-wrap justify-center gap-4">
        <Link href="/about" className="hover:text-gray-300 transition-colors">About</Link>
<Link href="/digest" className="hover:text-gray-300 transition-colors">Subscribe</Link>
        <Link href="/digest/unsubscribe" className="hover:text-gray-300 transition-colors">Unsubscribe</Link>
        <a href="/sitemap.xml" className="hover:text-gray-300 transition-colors">Sitemap</a>
      </div>
      <p className="mt-4 text-gray-600">
        © {new Date().getFullYear()} Trending GitHub Finds
      </p>
    </footer>
  );
}
