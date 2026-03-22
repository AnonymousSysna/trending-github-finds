"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { clsx } from "clsx";

const QUICK_FILTERS = [
  { label: "All", lang: undefined, topic: undefined },
  { label: "AI/ML", topic: "machine-learning" },
  { label: "DevTools", topic: "developer-tools" },
  { label: "Rust", lang: "Rust" },
  { label: "Python", lang: "Python" },
  { label: "TypeScript", lang: "TypeScript" },
  { label: "Go", lang: "Go" },
  { label: "Web", topic: "web" },
  { label: "CLI", topic: "cli" },
];

export function FilterBar() {
  const router = useRouter();
  const params = useSearchParams();
  const activeLang = params.get("lang");
  const activeTopic = params.get("topic");

  function applyFilter(lang?: string, topic?: string) {
    const p = new URLSearchParams();
    if (lang) p.set("lang", lang);
    if (topic) p.set("topic", topic);
    router.push(`/?${p.toString()}`);
  }

  return (
    <div className="sticky top-14 z-40 bg-[#0a0a0a]/90 backdrop-blur-sm border-b border-white/5 py-3">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {QUICK_FILTERS.map((f) => {
            const isActive =
              (f.lang === activeLang || (!f.lang && !activeLang)) &&
              (f.topic === activeTopic || (!f.topic && !activeTopic));
            return (
              <button
                key={f.label}
                onClick={() => applyFilter(f.lang, f.topic)}
                className={clsx(
                  "shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors",
                  isActive
                    ? "bg-green-500 text-black"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200"
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
