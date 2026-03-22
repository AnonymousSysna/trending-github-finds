"use client";

import Link from "next/link";
import { useState } from "react";

export function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-white">
          <span className="text-green-400">▲</span>
          <span>Trending GitHub</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-400">
          <Link href="/" className="hover:text-white transition-colors">
            Today
          </Link>
          <Link href="/topics" className="hover:text-white transition-colors">
            Topics
          </Link>
          <Link href="/languages" className="hover:text-white transition-colors">
            Languages
          </Link>
        </nav>

        {/* CTA */}
        <div className="hidden md:block">
          <Link
            href="/digest"
            className="bg-green-500 hover:bg-green-400 text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Subscribe →
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-gray-400 hover:text-white"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/5 bg-[#0a0a0a] px-4 py-4 flex flex-col gap-4 text-sm">
          <Link href="/" onClick={() => setMobileOpen(false)} className="text-gray-300 hover:text-white">Today</Link>
          <Link href="/topics" onClick={() => setMobileOpen(false)} className="text-gray-300 hover:text-white">Topics</Link>
          <Link href="/languages" onClick={() => setMobileOpen(false)} className="text-gray-300 hover:text-white">Languages</Link>
          <Link
            href="/digest"
            onClick={() => setMobileOpen(false)}
            className="bg-green-500 text-black font-semibold px-4 py-2 rounded-lg text-center"
          >
            Subscribe →
          </Link>
        </div>
      )}
    </header>
  );
}
