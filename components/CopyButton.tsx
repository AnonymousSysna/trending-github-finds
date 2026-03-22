"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      className="flex-1 text-center border border-white/10 hover:border-white/25 text-gray-300 font-medium py-3 rounded-xl transition-colors"
    >
      {copied ? "Copied!" : "Copy install cmd"}
    </button>
  );
}
