import { ParkingSession, ParkingSessionSchema } from "@/domain/parking/types";

const DB_NAME = "mall-navigre";
const STORE_NAME = "parking-sessions";
const ACTIVE_KEY = "active";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB unavailable"));
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open local database"));
  });
}

export async function saveParkingSession(session: ParkingSession): Promise<void> {
  const parsed = ParkingSessionSchema.parse(session);
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(parsed, ACTIVE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Unable to save parking session"));
  });
  db.close();
}

export async function loadActiveParkingSession(): Promise<ParkingSession | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(ACTIVE_KEY);
    request.onsuccess = () => {
      try { resolve(request.result ? ParkingSessionSchema.parse(request.result) : null); }
      catch { resolve(null); }
      finally { db.close(); }
    };
    request.onerror = () => { db.close(); reject(request.error ?? new Error("Unable to load parking session")); };
  });
}

export async function clearActiveParkingSession(): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(ACTIVE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Unable to clear parking session"));
  });
  db.close();
}
