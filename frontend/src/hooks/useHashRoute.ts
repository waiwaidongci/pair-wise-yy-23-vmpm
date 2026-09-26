import { useEffect, useState } from "react";

// 纯前端 hash 路由：刷新后仍停留在当前页面（配合 nginx try_files）。
export function useHashRoute(fallback: string) {
  const read = () => (typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") || fallback : fallback);
  const [route, setRoute] = useState<string>(read);

  useEffect(() => {
    const onChange = () => setRoute(read());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fallback]);

  const navigate = (next: string) => {
    window.location.hash = next;
  };

  return { route, navigate };
}
