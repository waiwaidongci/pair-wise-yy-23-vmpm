import { APP_CONFIG } from "../config";
import { ERROR_CODES } from "../constants/errorCodes";
import { AppError } from "./errors";
import { logger } from "./logger";

export const STORE_NAMES = {
  symbols: "brailleSymbols",
  lessons: "lessons",
  sessions: "practiceSessions",
  records: "answerRecords",
  meta: "meta"
} as const;

export type StoreName = (typeof STORE_NAMES)[keyof typeof STORE_NAMES];

let dbPromise: Promise<IDBDatabase> | null = null;

/** 打开/创建 IndexedDB；所有 api 文件共用同一连接。 */
export function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new AppError(ERROR_CODES.STORE_UNAVAILABLE, "api", "当前环境不支持 IndexedDB"));
      return;
    }
    const request = indexedDB.open(APP_CONFIG.dbName, APP_CONFIG.dbVersion);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAMES.symbols)) db.createObjectStore(STORE_NAMES.symbols, { keyPath: "id" });
      if (!db.objectStoreNames.contains(STORE_NAMES.lessons)) db.createObjectStore(STORE_NAMES.lessons, { keyPath: "id" });
      if (!db.objectStoreNames.contains(STORE_NAMES.sessions)) db.createObjectStore(STORE_NAMES.sessions, { keyPath: "id" });
      if (!db.objectStoreNames.contains(STORE_NAMES.records)) {
        const records = db.createObjectStore(STORE_NAMES.records, { keyPath: "id" });
        records.createIndex("session_id", "session_id", { unique: false });
        records.createIndex("symbol_id", "symbol_id", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_NAMES.meta)) db.createObjectStore(STORE_NAMES.meta, { keyPath: "key" });
      logger.debug("idb", `数据库升级完成：${[...db.objectStoreNames].join(", ")}`);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(new AppError(ERROR_CODES.STORE_UNAVAILABLE, "api", "打开本地数据库失败", request.error));
  });
  return dbPromise;
}

function tx<T>(store: StoreName, mode: IDBTransactionMode, run: (objectStore: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(store, mode);
        const request = run(transaction.objectStore(store));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () =>
          reject(new AppError(ERROR_CODES.STORE_UNAVAILABLE, "api", `读写 ${store} 失败`, request.error));
        transaction.onabort = () =>
          reject(new AppError(ERROR_CODES.STORE_UNAVAILABLE, "api", `${store} 事务中断`, transaction.error));
      })
  );
}

export const idb = {
  list<T>(store: StoreName): Promise<T[]> {
    return tx<T[]>(store, "readonly", (objectStore) => objectStore.getAll() as IDBRequest<T[]>);
  },
  get<T>(store: StoreName, key: IDBValidKey): Promise<T | undefined> {
    return tx<T | undefined>(store, "readonly", (objectStore) => objectStore.get(key) as IDBRequest<T | undefined>);
  },
  put<T>(store: StoreName, value: T): Promise<IDBValidKey> {
    return tx<IDBValidKey>(store, "readwrite", (objectStore) => objectStore.put(value));
  },
  putMany<T>(store: StoreName, values: T[]): Promise<void> {
    return openDatabase().then(
      (db) =>
        new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(store, "readwrite");
          const objectStore = transaction.objectStore(store);
          values.forEach((value) => objectStore.put(value));
          transaction.oncomplete = () => resolve();
          transaction.onerror = () =>
            reject(new AppError(ERROR_CODES.STORE_UNAVAILABLE, "api", `批量写入 ${store} 失败`, transaction.error));
        })
    );
  },
  remove(store: StoreName, key: IDBValidKey): Promise<void> {
    return tx(store, "readwrite", (objectStore) => objectStore.delete(key)).then(() => undefined);
  },
  clear(store: StoreName): Promise<void> {
    return tx(store, "readwrite", (objectStore) => objectStore.clear()).then(() => undefined);
  }
};

/**
 * 跨 store 原子执行（整组完成时“一次生成练习会话和答题记录”必须用同一事务）。
 */
export function transactional(
  stores: StoreName[],
  mode: IDBTransactionMode,
  run: (stores: Record<StoreName, IDBObjectStore>) => void
): Promise<void> {
  return openDatabase().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(stores, mode);
        const handles = Object.fromEntries(
          stores.map((name) => [name, transaction.objectStore(name)])
        ) as Record<StoreName, IDBObjectStore>;
        try {
          run(handles);
        } catch (error) {
          transaction.abort();
          reject(new AppError(ERROR_CODES.STORE_UNAVAILABLE, "api", "事务执行中断", error));
          return;
        }
        transaction.oncomplete = () => resolve();
        transaction.onerror = () =>
          reject(new AppError(ERROR_CODES.STORE_UNAVAILABLE, "api", "事务提交失败", transaction.error));
        transaction.onabort = () =>
          reject(new AppError(ERROR_CODES.STORE_UNAVAILABLE, "api", "事务已回滚", transaction.error));
      })
  );
}
