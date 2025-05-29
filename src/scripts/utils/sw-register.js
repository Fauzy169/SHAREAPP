import CONFIG from '../config';
import * as api from '../data/api';
import '../utils/sw-register'; // Tetap dipertahankan jika ada inisialisasi lainnya

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
      // ✅ Otomatis ambil base path dari halaman saat ini
      const basePath = window.location.pathname.split('/').slice(0, 2).join('/');
      const swPath = `${basePath}/sw.js`;
      const swScope = `${basePath}/`;

      await navigator.serviceWorker.register(swPath, { scope: swScope });
      console.log('✅ ServiceWorker registered at:', swPath);
    } catch (err) {
      console.error('❌ ServiceWorker registration failed:', err);
    }
  }
};

const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('⚠️ Notification permission denied');
    }
  }
};

export const subscribePushNotification = async (token) => {
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.ready;
    const applicationServerKey = urlBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY);
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });
    await api.subscribePushNotification(subscription, token);
  }
};

export const initializeServiceWorker = () => {
  registerServiceWorker();
  requestNotificationPermission();

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload(); // Reload saat SW baru aktif
  });
};

export const registerBackgroundSync = async () => {
  if ('SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-offline-stories');
      console.log('Background sync registered');
    } catch (error) {
      console.error('Background sync registration failed:', error);
    }
  }
};