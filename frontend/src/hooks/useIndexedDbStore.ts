import { useEffect, useMemo, useState } from "react";

// 通用 IndexedDB 只读列表 hook：负责首屏加载、关键字筛选与分页。
export function useIndexedDbStore<T>(
  rows: T[],
  load: () => Promise<void>,
  options: { keywordOf?: (row: T) => string; pageSize?: number } = {}
) {
  const { keywordOf, pageSize = 8 } = options;
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    if (!term || !keywordOf) return rows;
    return rows.filter((row) => keywordOf(row).toLowerCase().includes(term));
  }, [rows, keyword, keywordOf]);

  const pageRows = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  );

  return { page, setPage, pageSize, pageRows, total: filtered.length, keyword, setKeyword };
}
