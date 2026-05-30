// PATH: components/dashboard/PublishToggle.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { ToggleLeft, ToggleRight } from "lucide-react";

interface Props {
  eventId: string;
  currentStatus: string;
}

export function PublishToggle({ eventId, currentStatus }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const isPublished = currentStatus === "published";
  const canToggle = ["draft", "published"].includes(currentStatus);

  if (!canToggle) return null;

  const toggle = async () => {
    setLoading(true);
    try {
      const newStatus = isPublished ? "draft" : "published";
      const { error } = await supabase
        .from("events")
        .update({ status: newStatus })
        .eq("id", eventId);

      if (error) { toast.error("Gagal mengubah status"); return; }
      toast.success(newStatus === "published" ? "Event dipublikasikan!" : "Event disimpan sebagai draft");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={isPublished ? "Jadikan Draft" : "Publikasikan"}
      className={`p-1.5 rounded-lg transition-colors ${
        isPublished
          ? "hover:bg-green-50 text-green-600"
          : "hover:bg-amber-50 text-amber-600"
      }`}
    >
      {loading
        ? <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin block" />
        : isPublished
          ? <ToggleRight size={16} />
          : <ToggleLeft size={16} />
      }
    </button>
  );
}