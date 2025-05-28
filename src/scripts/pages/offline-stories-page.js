// src/scripts/pages/offline-stories-page.js
import { getAllData, deleteData } from '../data/database';

const OfflineStoriesPage = {
  async render() {
    return `
      <section class="offline-stories">
        <h1>Offline Stories</h1>
        <ul id="offlineStoryList" class="story-list"></ul>
      </section>
    `;
  },

  async afterRender() {
    const stories = await getAllData();
    const container = document.getElementById('offlineStoryList');

    if (stories.length === 0) {
      container.innerHTML = '<li class="empty">Tidak ada cerita offline</li>';
      return;
    }

    stories.forEach((story) => {
      const item = document.createElement('li');
      item.className = 'story-item';
      item.innerHTML = `
        <h2>${story.description?.match(/\[HEADER\](.*?)\[\/HEADER\]/)?.[1] || '(Tanpa Judul)'}</h2>
        <p>${story.description}</p>
        <button class="delete-btn" data-id="${story.id}">
          <i class="fas fa-trash-alt"></i> Hapus
        </button>
      `;

      item.querySelector('.delete-btn').addEventListener('click', async () => {
        await deleteData(story.id);
        item.remove();
        if (document.querySelectorAll('.story-item').length === 0) {
          container.innerHTML = '<li class="empty">Tidak ada cerita offline</li>';
        }
      });

      container.appendChild(item);
    });
  },
};

export default OfflineStoriesPage;
