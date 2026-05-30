"use client";

import { Share2 } from "lucide-react";

export function ShareButton({ title }: { title: string }) {
  return (
    <button
      onClick={() => {
        if (navigator.share) {
          navigator.share({ title, url: window.location.href });
        } else {
          navigator.clipboard.writeText(window.location.href);
        }
      }}
      className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
    >
      <Share2 size={14} /> Bagikan Event
    </button>
  );
}