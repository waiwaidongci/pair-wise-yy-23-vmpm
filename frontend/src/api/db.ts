import { mockData } from "../mocks/seedData";

const DB_NAME = "braille-trainer";
const DB_VERSION = 1;

export const STORES = {
  brailleSymbol: "brailleSymbol",
  lesson: "lesson",
  practiceSession: "practiceSession",
  answerRecord: "answerRecord",
  practiceDraft: "practiceDraft"
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORES.brailleSymbol)) db.createObjectStore(STORES.brailleSymbol, { keyPath: "id" });
      if (!db.objectStoreNames.contains(STORES.lesson)) db.createObjectStore(STORES.lesson, { keyPath: "id" });
      if (!db.objectStoreNames.contains(STORES.practiceSession)) db.createObjectStore(STORES.practiceSession, { keyPath: "id" });
      if (!db.objectStoreNames.contains(STORES.answerRecord)) db.createObjectStore(STORES.answerRecord, { keyPath: "id" });
      if (!db.objectStoreNames.contains(STORES.practiceDraft)) db.createObjectStore(STORES.practiceDraft, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

function reqToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 首次打开时注入种子数据；之后以本地库为准，保证练习结果切回页面仍可见。
async function ensureSeed(db: IDBDatabase) {
  const seeded = localStorage.getItem(`${DB_NAME}:seeded`);
  if (seeded === "1") return;
  const tx = db.transaction([STORES.brailleSymbol, STORES.lesson, STORES.practiceSession, STORES.answerRecord], "readwrite");
  await Promise.all([
    ...mockData.brailleSymbol.map((row) => reqToPromise(tx.objectStore(STORES.brailleSymbol).put(row))),
    ...mockData.lesson.map((row) => reqToPromise(tx.objectStore(STORES.lesson).put(row))),
    ...mockData.practiceSession.map((row) => reqToPromise(tx.objectStore(STORES.practiceSession).put(row))),
    ...mockData.answerRecord.map((row) => reqToPromise(tx.objectStore(STORES.answerRecord).put(row)))
  ]);
  localStorage.setItem(`${DB_NAME}:seeded`, "1");
}

export async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await openDb();
  await ensureSeed(db);
  return reqToPromise<T[]>(db.transaction(storeName).objectStore(storeName).getAll());
}

export async function put<T>(storeName: string, row: T): Promise<T> {
  const db = await openDb();
  await reqToPromise(db.transaction(storeName, "readwrite").objectStore(storeName).put(row));
  return row;
}

export async function bulkPut<T>(storeName: string, rows: T[]): Promise<T[]> {
  const db = await openDb();
  const tx = db.transaction(storeName, "readwrite");
  await Promise.all(rows.map((row) => reqToPromise(tx.objectStore(storeName).put(row))));
  return rows;
}

export async function remove(storeName: string, key: string): Promise<void> {
  const db = await openDb();
  await reqToPromise(db.transaction(storeName, "readwrite").objectStore(storeName).delete(key));
}

export async function nextId(storeName: string): Promise<number> {
  const db = await openDb();
  const rows = await reqToPromise<Array<{ id: number }>>(db.transaction(storeName).objectStore(storeName).getAll());
  return rows.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0) + 1;
}

// 整组完成：一次事务内同时落库会话与全部答题记录，保证原子性。
export async function commitSessionBundle(
  session: unknown,
  records: unknown[]
): Promise<void> {
  const db = await openDb();
  const tx = db.transaction([STORES.practiceSession, STORES.answerRecord], "readwrite");
  await reqToPromise(tx.objectStore(STORES.practiceSession).put(session));
  await Promise.all(records.map((record) => reqToPromise(tx.objectStore(STORES.answerRecord).put(record))));
}
