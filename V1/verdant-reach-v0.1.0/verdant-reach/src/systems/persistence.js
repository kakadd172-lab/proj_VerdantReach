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

export async function hasAnySave() {
  try {
    const db = await openDatabase();
    const record = await new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAllKeys();
      request.onsuccess = () => resolve(request.result?.length > 0);
      request.onerror = () => reject(request.error);
    });
    db.close();
    if (record) return true;
  } catch {
    // Check the fallback store below.
  }
  try {
    return Object.keys(localStorage).some((key) => key.startsWith('verdant-reach:'));
  } catch {
    return false;
  }
}

export async function getLatestSave() {
  try {
    const db = await openDatabase();
    const records = await new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result ?? []);
      request.onerror = () => reject(request.error ?? new Error('Could not read save index'));
    });
    db.close();
    return records.sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0))[0] ?? null;
  } catch {
    const records = [];
    try {
      for (const key of Object.keys(localStorage)) {
        if (!key.startsWith('verdant-reach:')) continue;
        const value = JSON.parse(localStorage.getItem(key));
        if (value) records.push(value);
      }
    } catch {
      return null;
    }
    return records.sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0))[0] ?? null;
  }
}
