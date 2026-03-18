"use client";

import { useCallback, useState } from "react";

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const [type, setType] = useState<"info" | "error" | "success">("info");

  const toast = useCallback((msg: string, t: "info" | "error" | "success" = "info") => {
    setMessage(msg);
    setType(t);
    setTimeout(() => setMessage(null), 4000);
  }, []);

  return { message, type, toast };
}
