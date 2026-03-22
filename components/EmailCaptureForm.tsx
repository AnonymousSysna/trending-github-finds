"use client";

import { useState } from "react";
import { clsx } from "clsx";

interface EmailCaptureFormProps {
  source: string;
  placeholder?: string;
  ctaText?: string;
  className?: string;
  showFrequency?: boolean;
}

export function EmailCaptureForm({
  source,
  placeholder = "Enter your email",
  ctaText = "Get Daily Digest →",
  className,
  showFrequency = false,
}: EmailCaptureFormProps) {
  const [email, setEmail] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || state === "submitting") return;

    setState("submitting");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, frequency, source }),
      });

      const data = await res.json();

      if (res.ok) {
        setState("success");
        setMessage(data.message ?? "Check your email to confirm!");
      } else {
        setState("error");
        setMessage(data.error ?? "Something went wrong.");
      }
    } catch {
      setState("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (state === "success") {
    return (
      <div className={clsx("text-center", className)}>
        <div className="inline-flex items-center gap-2 bg-green-500/15 text-green-400 px-4 py-3 rounded-lg">
          <span className="text-lg">✓</span>
          <span className="text-sm font-medium">{message}</span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={clsx("space-y-3", className)}>
      <div className="flex gap-2 flex-col sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          required
          disabled={state === "submitting"}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500/50 focus:bg-white/8 transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={state === "submitting" || !email}
          className="bg-green-500 hover:bg-green-400 disabled:bg-green-800 disabled:cursor-not-allowed text-black font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap"
        >
          {state === "submitting" ? "Sending..." : ctaText}
        </button>
      </div>

      {showFrequency && (
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>Frequency:</span>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="frequency"
              value="daily"
              checked={frequency === "daily"}
              onChange={() => setFrequency("daily")}
              className="accent-green-500"
            />
            <span>Daily</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="frequency"
              value="weekly"
              checked={frequency === "weekly"}
              onChange={() => setFrequency("weekly")}
              className="accent-green-500"
            />
            <span>Weekly</span>
          </label>
        </div>
      )}

      {state === "error" && (
        <p className="text-xs text-red-400">{message}</p>
      )}
    </form>
  );
}
