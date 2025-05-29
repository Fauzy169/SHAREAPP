// database.js
import CONFIG from '../config';

const { DATABASE_NAME, DATABASE_VERSION, OBJECT_STORE_NAME } = CONFIG;

let dbInstance = null;

const openDatabase = () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);

    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(OBJECT_STORE_NAME)) {
        const store = db.createObjectStore(OBJECT_STORE_NAME, { keyPath: 'id' });
        // Buat index untuk pencarian yang lebih efisien
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('Database error:', event.target.error);
      reject(new Error('Gagal membuka database'));
    };

    request.onblocked = () => {
      console.warn('Database blocked');
      reject(new Error('Database terblokir, mungkin karena versi baru yang tertunda'));
    };
  });
};

export const saveData = async (data) => {
  try {
    const db = await openDatabase();
    const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
    const store = tx.objectStore(OBJECT_STORE_NAME);
    
    // Tambahkan timestamp jika belum ada
    if (!data.createdAt) {
      data.createdAt = new Date().toISOString();
    }
    
    await store.put(data);
    await tx.complete;
    return data;
  } catch (error) {
    console.error('Gagal menyimpan data:', error);
    throw error;
  }
};

export const getData = async (id) => {
  try {
    const db = await openDatabase();
    const tx = db.transaction(OBJECT_STORE_NAME, 'readonly');
    const store = tx.objectStore(OBJECT_STORE_NAME);
    return store.get(id);
  } catch (error) {
    console.error('Gagal mengambil data:', error);
    throw error;
  }
};

export const getAllData = async () => {
  try {
    const db = await openDatabase();
    const tx = db.transaction(OBJECT_STORE_NAME, 'readonly');
    const store = tx.objectStore(OBJECT_STORE_NAME);
    return store.getAll();
  } catch (error) {
    console.error('Gagal mengambil semua data:', error);
    throw error;
  }
};

export const deleteData = async (id) => {
  try {
    const db = await openDatabase();
    const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
    const store = tx.objectStore(OBJECT_STORE_NAME);
    await store.delete(id);
    await tx.complete;
    return true;
  } catch (error) {
    console.error('Gagal menghapus data:', error);
    throw error;
  }
};

// Tambahkan fungsi baru untuk menghapus semua data
export const clearAllData = async () => {
  try {
    const db = await openDatabase();
    const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
    const store = tx.objectStore(OBJECT_STORE_NAME);
    await store.clear();
    await tx.complete;
    return true;
  } catch (error) {
    console.error('Gagal menghapus semua data:', error);
    throw error;
  }
};