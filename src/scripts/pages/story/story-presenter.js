import StoryPage from './story-page';
import { getStories, getStoriesWithLocation, subscribePushNotification } from '../../data/api';
import CONFIG from '../../config';
import '../../utils/sw-register';

export default class StoryPresenter {
  constructor(view) {
    this._view = view;
    if (!view.updateLoadButton || typeof view.updateLoadButton !== 'function') {
      throw new Error('View must implement updateLoadButton() method');
    }
    this._stories = [];
    this._currentPage = 1;
    this._isLoading = false;
    this._hasMore = true;
  }

  async loadStories(loadMore = false) {
    this._token = localStorage.getItem(CONFIG.USER_TOKEN_KEY);

    // Perbaikan: Tangani push notification hanya jika tersedia dan lengkap
    if (this._token && 'serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const reg = await navigator.serviceWorker.ready;

        let subscription = await reg.pushManager.getSubscription();
        if (!subscription) {
          subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: this._urlBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY),
          });
        }

        if (!subscription?.keys?.p256dh || !subscription?.keys?.auth) {
          throw new Error('Push subscription keys are missing');
        }

        await subscribePushNotification(subscription, this._token);
      } catch (err) {
        console.error('Push subscription failed:', err);
      }
    }

    if (this._isLoading) return;

    this._isLoading = true;
    this._view.updateLoadButton(this._isLoading, this._hasMore);

    try {
      const token = localStorage.getItem(CONFIG.USER_TOKEN_KEY);
      const pageSize = CONFIG.PAGE_SIZE || 10;

      const response = token
        ? await getStoriesWithLocation(this._currentPage, pageSize)
        : await getStories(this._currentPage, pageSize);

      if (!response.listStory) {
        throw new Error('Invalid API response structure');
      }

      const newStories = response.listStory.filter(newStory =>
        !this._stories.some(existingStory => existingStory.id === newStory.id)
      );

      if (loadMore) {
        this._stories = [...this._stories, ...newStories];
        this._view.appendStories(newStories);
      } else {
        this._stories = newStories;
        this._view.renderStories(newStories);
      }

      this._view.updateMapMarkers(this._stories);
      this._hasMore = response.listStory.length >= pageSize;

    } catch (error) {
      console.error('Error loading stories:', error);
      this._view.showError(error);
      this._currentPage = Math.max(1, this._currentPage - 1);
    } finally {
      this._isLoading = false;
      this._view.updateLoadButton(this._isLoading, this._hasMore);
    }
  }

  refreshStories() {
    this._currentPage = 1;
    this._stories = [];
    this._hasMore = true;
    this.loadStories();
  }

  loadMoreStories() {
    if (this._hasMore && !this._isLoading) {
      this._currentPage++;
      this.loadStories(true);
    }
  }

  _urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return new Uint8Array([...rawData].map(char => char.charCodeAt(0)));
  }
}
