const DB_NAME = 'wildrift-worlds';
const DB_VERSION = 1;
const STORE_NAME = 'worlds';

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is unavailable in this browser.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'seed' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open world storage.'));
  });
}

export class WorldStorage {
  constructor() {
    this.dbPromise = null;
  }

  db() {
    if (!this.dbPromise) this.dbPromise = openDatabase();
    return this.dbPromise;
  }

  async save(worldRecord) {
    const db = await this.db();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put({ ...worldRecord, updatedAt: Date.now() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error || new Error('World save failed.'));
      tx.onabort = () => reject(tx.error || new Error('World save was cancelled.'));
    });
  }

  async load(seed) {
    const db = await this.db();
    return new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(seed | 0);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error || new Error('Could not read saved world.'));
    });
  }

  async lastWorld() {
    const db = await this.db();
    return new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
      request.onsuccess = () => {
        const rows = request.result ?? [];
        rows.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        resolve(rows[0] ?? null);
      };
      request.onerror = () => reject(request.error || new Error('Could not list saved worlds.'));
    });
  }
}
