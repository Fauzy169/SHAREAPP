import CONFIG from '../config';
import {
  saveMultipleStories,
  getAllStories as getOfflineStories,
  saveStory as addStoryOffline,
  deleteStory as deleteStoryOffline
} from './database';

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
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return checkResponse(response);
};

export const login = async (data) => {
  const response = await fetch(ENDPOINTS.LOGIN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return checkResponse(response);
};

export const getStories = async (page = 1, size = 10) => {
  try {
    if (!navigator.onLine) {
      const offlineStories = await getOfflineStories();
      return { listStory: offlineStories, isOffline: true };
    }

    const token = localStorage.getItem(CONFIG.USER_TOKEN_KEY);
    const headers = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${ENDPOINTS.STORIES}?page=${page}&size=${size}`, { headers });
    const data = await checkResponse(response);

    if (data.listStory && data.listStory.length > 0) {
      saveMultipleStories(data.listStory).catch(console.error);
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch stories:', error);
    const offlineStories = await getOfflineStories();
    return { listStory: offlineStories, isOffline: true };
  }
};


export const getStoriesWithLocation = async (page = 1, size = 10) => {
  const token = localStorage.getItem(CONFIG.USER_TOKEN_KEY);
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(ENDPOINTS.STORIES_WITH_LOCATION(page, size), { headers });
  return checkResponse(response);
};

export const getStoryDetail = async (id, token = null) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${ENDPOINTS.STORIES}/${id}`, { headers });
  return checkResponse(response);
};

export const addStory = async (formData, token) => {
  try {
    const photo = formData.get('photo');
    if (!photo || photo.size === 0) throw new Error('Photo is required');

    if (!navigator.onLine) {
      const offlineStory = {
        id: `offline-${Date.now()}`,
        name: formData.get('name') || 'Guest',
        description: formData.get('description') || '',
        photoUrl: await getImageAsBase64(photo),
        createdAt: new Date().toISOString(),
        isOffline: true
      };

      await addStoryOffline(offlineStory);
      return {
        success: true,
        message: 'Story saved offline and will be synced later',
        data: offlineStory
      };
    }

    const response = await fetch(`${ENDPOINTS.STORIES}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    const data = await checkResponse(response);
    return { success: true, message: 'Story added successfully', data };
  } catch (error) {
    console.error('Add story error:', error);
    return { success: false, message: error.message };
  }
};

// Helper function for offline image handling
const getImageAsBase64 = (file) => {
  return new Promise((resolve) => {
    if (!file) resolve('');
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
};

export const addStoryAsGuest = async (formData) => {
  try {
    const response = await fetch(ENDPOINTS.STORIES_GUEST, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add story as guest');
    }

    const data = await response.json();
    return {
      success: true,
      message: 'Story added successfully as guest',
      data: data
    };
  } catch (error) {
    console.error('Add story as guest error:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

export const subscribePushNotification = async (subscription, token) => {
  if (!subscription || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
    throw new Error('Subscription keys not found or incomplete. Cannot subscribe.');
  }

  const body = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth
    }
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

export const deleteOfflineStory = async (id) => {
  return await deleteStoryOffline(id);
};
