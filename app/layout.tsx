import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "Trending GitHub Repos Today — AI-Summarized for Developers",
    template: "%s | Trending GitHub Finds",
  },
  description:
    "Discover the top trending GitHub repositories daily. AI summaries, star momentum scores, and daily email digest.",
  openGraph: {
    type: "website",
    siteName: "Trending GitHub Finds",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0a0a0a] text-gray-100 antialiased">
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
