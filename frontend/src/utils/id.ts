/** 本地 IDB 自增主键的兜底发号器（种子数据使用固定小 id，新数据从 1000 起）。 */
export const SEED_ID_MAX = 999;

export function nextId(existing: number[]): number {
  const candidates = existing.filter((id) => id > SEED_ID_MAX);
  return (candidates.length ? Math.max(...candidates) : SEED_ID_MAX) + 1;
}

/** 可复现的伪随机（mulberry32）：保证中途离开再回来，草稿题目与选项顺序一致。 */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
