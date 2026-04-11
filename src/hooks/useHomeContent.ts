import { useState, useEffect } from "react";
import api from "@/lib/api";

export const useHomeContent = () => {
  const [content, setContent] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/home-content")
      .then(res => setContent(res.data))
      .catch(err => console.error("Erro ao carregar home content:", err))
      .finally(() => setLoading(false));
  }, []);

  return { content, loading };
};