import CONFIG from '../config';
import * as api from '../data/api';
import '../utils/sw-register';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('ServiceWorker registered!');
    } catch (err) {
      console.error('ServiceWorker registration failed:', err);
    }
  }
};

const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Permission denied');
    }
  }
};

export const subscribePushNotification = async (token) => {
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.ready;
    const applicationServerKey = urlBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY);
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });
    await api.subscribePushNotification(subscription, token);
  }
};

export const initializeServiceWorker = () => {
  registerServiceWorker();
  requestNotificationPermission();

   navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload(); // Reload sekali saat SW baru aktif
  });
};
