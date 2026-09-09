import { ParkingSession, ParkingSessionSchema } from "@/domain/parking/types";

const DB_NAME = "mall-navigre";
const DB_VERSION = 2;
const STORE_NAME = "parking-sessions";
const ACTIVE_KEY = "active";

export type ParkingLoadResult =
  | { status: "EMPTY" }
  | { status: "RESTORED"; session: ParkingSession }
  | { status: "CORRUPTED"; error: string }
  | { status: "STORAGE_ERROR"; error: string };

type Migration = (db: IDBDatabase, transaction: IDBTransaction) => void;

const migrations: Record<number, Migration> = {
  1: (db) => {
    if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
  },
  2: (db, transaction) => {
    // Version 2 establishes the current store explicitly. Existing records are retained.
    if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    void transaction;
  },
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB unavailable"));
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      const transaction = request.transaction;
      if (!transaction) return;
      for (let version = request.oldVersion + 1; version <= DB_VERSION; version += 1) {
        migrations[version]?.(db, transaction);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open local database"));
    request.onblocked = () => reject(new Error("Local database upgrade is blocked by another tab"));
  });
}

export async function saveParkingSession(session: ParkingSession): Promise<void> {
  const parsed = ParkingSessionSchema.parse(session);
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(parsed, ACTIVE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Unable to save parking session"));
      tx.onabort = () => reject(tx.error ?? new Error("Parking session save was aborted"));
    });
  } finally {
    db.close();
  }
}

export async function loadActiveParkingSession(): Promise<ParkingLoadResult> {
  let db: IDBDatabase;
  try {
    db = await openDb();
  } catch (error) {
    return { status: "STORAGE_ERROR", error: error instanceof Error ? error.message : "Unable to open local storage" };
  }

  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(ACTIVE_KEY);
    request.onsuccess = () => {
      try {
        if (!request.result) resolve({ status: "EMPTY" });
        else resolve({ status: "RESTORED", session: ParkingSessionSchema.parse(request.result) });
      } catch {
        resolve({ status: "CORRUPTED", error: "Stored parking data failed schema validation." });
      } finally {
        db.close();
      }
    };
    request.onerror = () => {
      db.close();
      resolve({ status: "STORAGE_ERROR", error: request.error?.message ?? "Unable to load parking session" });
    };
  });
}

export async function clearActiveParkingSession(): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(ACTIVE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Unable to clear parking session"));
      tx.onabort = () => reject(tx.error ?? new Error("Parking session clear was aborted"));
    });
  } finally {
    db.close();
  }
}
