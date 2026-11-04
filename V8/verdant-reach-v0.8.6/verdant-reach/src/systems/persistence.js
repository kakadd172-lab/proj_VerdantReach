const DB_NAME = 'verdant-reach-save-v1';
const STORE_NAME = 'worlds';

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is unavailable'));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'seedKey' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open save storage'));
  });
}

function localSaveKey(seed) {
  return `verdant-reach:${String(seed).toUpperCase()}`;
}

export async function saveWorld(seed, payload) {
  const record = {
    ...payload,
    seedKey: String(seed).toUpperCase(),
    seed: String(seed),
    savedAt: Date.now(),
  };
  try {
    const db = await openDatabase();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(record);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error ?? new Error('Save transaction failed'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Save transaction was aborted'));
    });
    db.close();
    return true;
  } catch (error) {
    try {
      localStorage.setItem(localSaveKey(seed), JSON.stringify(record));
      return true;
    } catch {
      throw error;
    }
  }
}

export async function loadWorld(seed) {
  try {
    const db = await openDatabase();
    const record = await new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(String(seed).toUpperCase());
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error ?? new Error('Load failed'));
    });
    db.close();
    if (record) return record;
  } catch {
    // localStorage is the fallback for private browsing modes where IndexedDB may be blocked.
  }
  try {
    const raw = localStorage.getItem(localSaveKey(seed));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function mergeSavedWorldRecords(records = []) {
  const merged = new Map();
  for (const record of records) {
    if (!record?.seed) continue;
    const key = String(record.seedKey ?? record.seed).toUpperCase();
    const previous = merged.get(key);
    if (!previous || (record.savedAt ?? 0) >= (previous.savedAt ?? 0)) merged.set(key, { ...record, seedKey: key });
  }
  return [...merged.values()].sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0));
}

export async function listSavedWorlds() {
  const records = [];
  try {
    const db = await openDatabase();
    const indexedRecords = await new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result ?? []);
      request.onerror = () => reject(request.error ?? new Error('Could not read saved worlds'));
    });
    records.push(...indexedRecords);
    db.close();
  } catch {
    // localStorage records are merged below when IndexedDB is unavailable.
  }
  try {
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith('verdant-reach:')) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const record = JSON.parse(raw);
        if (record?.seed) records.push(record);
      } catch {
        // Ignore a single malformed fallback entry instead of hiding other saves.
      }
    }
  } catch {
    // Storage can be unavailable in private contexts; return any IndexedDB records.
  }
  return mergeSavedWorldRecords(records);
}

export async function deleteWorld(seed) {
  const seedKey = String(seed).toUpperCase();
  let indexedDeleted = false;
  try {
    const db = await openDatabase();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).delete(seedKey);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error ?? new Error('Could not delete saved world'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Save deletion was aborted'));
    });
    db.close();
    indexedDeleted = true;
  } catch {
    // The fallback store is still cleaned below.
  }
  let fallbackDeleted = false;
  try {
    localStorage.removeItem(localSaveKey(seed));
    fallbackDeleted = true;
  } catch {
    // Keep the indexed deletion result if localStorage is blocked.
  }
  return indexedDeleted || fallbackDeleted;
}

export async function hasAnySave() {
  return (await listSavedWorlds()).length > 0;
}

export async function getLatestSave() {
  return (await listSavedWorlds())[0] ?? null;
}
