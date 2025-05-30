import CONFIG from '../config';

const { DATABASE_NAME, DATABASE_VERSION, OBJECT_STORE_NAME } = CONFIG;

let dbPromise;

const openDatabase = () => {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(OBJECT_STORE_NAME)) {
          const store = db.createObjectStore(OBJECT_STORE_NAME, { keyPath: 'id' });
          // Tambahkan index untuk pencarian yang lebih efisien
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        reject(event.target.error);
      };
    });
  }
  return dbPromise;
};

// Fungsi Utama CRUD
export const saveStory = async (story) => {
  try {
    const db = await openDatabase();
    const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
    const store = tx.objectStore(OBJECT_STORE_NAME);
    await store.put(story);
    await tx.done;
    return true;
  } catch (error) {
    console.error('Failed to save story:', error);
    return false;
  }
};

export const getStory = async (id) => {
  try {
    const db = await openDatabase();
    const tx = db.transaction(OBJECT_STORE_NAME, 'readonly');
    const store = tx.objectStore(OBJECT_STORE_NAME);
    return await store.get(id);
  } catch (error) {
    console.error('Failed to get story:', error);
    return null;
  }
};

export const getAllStories = async () => {
  try {
    const db = await openDatabase();
    const tx = db.transaction(OBJECT_STORE_NAME, 'readonly');
    const store = tx.objectStore(OBJECT_STORE_NAME);
    return await store.getAll();
  } catch (error) {
    console.error('Failed to get stories:', error);
    return [];
  }
};

export const deleteStory = async (id) => {
  try {
    const db = await openDatabase();
    const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
    const store = tx.objectStore(OBJECT_STORE_NAME);
    await store.delete(id);
    await tx.done;
    return true;
  } catch (error) {
    console.error('Failed to delete story:', error);
    return false;
  }
};

// Fungsi Khusus untuk Batch Operations
export const saveMultipleStories = async (stories) => {
  try {
    const db = await openDatabase();
    const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
    const store = tx.objectStore(OBJECT_STORE_NAME);
    
    // Clear existing data
    await store.clear();
    
    // Add all new stories
    await Promise.all(stories.map(story => store.put(story)));
    
    await tx.done;
    return true;
  } catch (error) {
    console.error('Failed to save multiple stories:', error);
    return false;
  }
};