// api.js
import CONFIG from '../config';
import { saveData, getAllData, deleteData } from './database'; // Tambahan penting

const ENDPOINTS = {
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  STORIES: `${CONFIG.BASE_URL}/stories`,
  STORIES_GUEST: `${CONFIG.BASE_URL}/stories/guest`,
  STORIES_WITH_LOCATION: (page, size) =>
    `${CONFIG.BASE_URL}/stories?location=1&page=${page}&size=${size}`,
  NOTIFICATION_SUBSCRIBE: `${CONFIG.BASE_URL}/notifications/subscribe`,
};

const checkResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Something went wrong');
  }

  const data = await response.json();

  if (window.location.hash.includes('stories/') && !data.story) {
    throw new Error('Invalid API response structure - missing story data');
  }

  return data;
};

export const register = async (data) => {
  const response = await fetch(ENDPOINTS.REGISTER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return checkResponse(response);
};

export const login = async (data) => {
  const response = await fetch(ENDPOINTS.LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return checkResponse(response);
};

// ✅ Get stories with offline fallback
export const getStories = async (page = 1, size = CONFIG.PAGE_SIZE) => {
  const token = localStorage.getItem(CONFIG.USER_TOKEN_KEY);
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    if (!navigator.onLine) {
      const offlineStories = await getAllData();
      console.log('Menggunakan data offline', offlineStories);
      return { 
        listStory: offlineStories,
        error: { 
          message: 'Anda sedang offline. Menampilkan cerita yang tersimpan secara lokal.',
          isOffline: true 
        }
      };
    }

    const response = await fetch(`${ENDPOINTS.STORIES}?page=${page}&size=${size}`, {
      headers,
    });

    const data = await checkResponse(response);
    
    // Simpan data ke IndexedDB untuk penggunaan offline
    if (data.listStory && data.listStory.length > 0) {
      await Promise.all(data.listStory.map(story => saveData(story)));
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching stories:', error);
    
    // Fallback ke data offline jika request gagal
    const offlineStories = await getAllData();
    return { 
      listStory: offlineStories,
      error: { 
        message: `Gagal mengambil data: ${error.message}. Menampilkan cerita offline.`,
        isOffline: true 
      }
    };
  }
};

export const getStoriesWithLocation = async (page = 1, size = CONFIG.PAGE_SIZE) => {
  const token = localStorage.getItem(CONFIG.USER_TOKEN_KEY);
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(ENDPOINTS.STORIES_WITH_LOCATION(page, size), {
    headers,
  });

  return checkResponse(response);
};

export const getStoryDetail = async (id, token = null) => {
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${ENDPOINTS.STORIES}/${id}`, {
    headers,
  });

  return checkResponse(response);
};

// ✅ Add story with offline support and sync
export const addStory = async (formData, token) => {
  const storyObj = Object.fromEntries(formData.entries());
  
  // Generate ID unik untuk offline story
  storyObj.id = `offline-${Date.now()}`;
  storyObj.createdAt = new Date().toISOString();
  storyObj.isOffline = true;

  if (!navigator.onLine) {
    try {
      await saveData(storyObj);
      return {
        success: true,
        message: 'Cerita disimpan secara offline dan akan dikirim saat online',
        data: storyObj,
        isOffline: true
      };
    } catch (error) {
      return {
        success: false,
        message: 'Gagal menyimpan cerita offline: ' + error.message
      };
    }
  }

  try {
    const response = await fetch(ENDPOINTS.STORIES, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await checkResponse(response);
    return {
      success: true,
      message: 'Story added successfully',
      data: data,
    };
  } catch (error) {
    console.error('Add story error:', error);
    
    // Simpan ke offline storage jika online request gagal
    try {
      await saveData(storyObj);
      return {
        success: true,
        message: `Gagal mengirim cerita: ${error.message}. Cerita disimpan secara offline.`,
        data: storyObj,
        isOffline: true
      };
    } catch (saveError) {
      return {
        success: false,
        message: `Gagal mengirim cerita dan menyimpan offline: ${saveError.message}`
      };
    }
  }
};

export const addStoryAsGuest = async (formData) => {
  try {
    const response = await fetch(ENDPOINTS.STORIES_GUEST, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add story as guest');
    }

    const data = await response.json();
    return {
      success: true,
      message: 'Story added successfully as guest',
      data: data,
    };
  } catch (error) {
    console.error('Add story as guest error:', error);
    return {
      success: false,
      message: error.message,
    };
  }
};

export const subscribePushNotification = async (subscription, token) => {
  if (!subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    throw new Error('Subscription keys not found or incomplete. Cannot subscribe.');
  }

  const body = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  };

  const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Subscribe failed:', error);
    throw new Error(error.message || 'Subscribe failed');
  }

  return response.json();
};

export const unsubscribePushNotification = async (endpoint, token) => {
  const response = await fetch(ENDPOINTS.NOTIFICATION_SUBSCRIBE, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ endpoint }),
  });

  return checkResponse(response);
};


window.addEventListener('online', async () => {
  const offlineStories = await getAllData();

  for (const story of offlineStories) {
    const token = localStorage.getItem(CONFIG.USER_TOKEN_KEY);
    const formData = new FormData();
    for (const key in story) {
      formData.append(key, story[key]);
    }

    try {
      const response = await fetch(`${CONFIG.BASE_URL}/stories`, {
        method: 'POST',
        headers: {
          Authorization: story.isGuest ? '' : `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        await deleteData(story.id);
        console.log(`Cerita offline "${story.id}" berhasil disinkronkan.`);
      }
    } catch (error) {
      console.error(`Gagal menyinkronkan cerita offline "${story.id}":`, error);
    }
  }
});

