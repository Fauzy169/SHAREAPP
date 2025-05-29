// offline-stories-page.js
import { getAllData, deleteData, clearAllData } from '../../data/database';
import { showFormattedDate } from '../../utils';

const OfflineStoriesPage = {
  async render() {
    return `
      <section class="offline-stories">
        <div class="offline-header">
          <h1><i class="fas fa-cloud-download-alt"></i> Cerita Offline</h1>
          <button id="clearAllBtn" class="button danger">
            <i class="fas fa-trash"></i> Hapus Semua
          </button>
        </div>
        <div id="offlineStatus" class="offline-status"></div>
        <ul id="offlineStoryList" class="story-list"></ul>
      </section>
    `;
  },

  async afterRender() {
    this.renderOfflineStories();
    
    // Event listeners
    document.getElementById('clearAllBtn').addEventListener('click', async () => {
      const confirmed = confirm('Apakah Anda yakin ingin menghapus semua cerita offline?');
      if (confirmed) {
        await this.clearAllStories();
      }
    });
  },

  async renderOfflineStories() {
    const container = document.getElementById('offlineStoryList');
    const statusEl = document.getElementById('offlineStatus');
    
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Memuat...</div>';
    
    try {
      const stories = await getAllData();
      
      if (stories.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-inbox"></i>
            <p>Tidak ada cerita offline</p>
          </div>
        `;
        statusEl.innerHTML = '<p>Anda memiliki 0 cerita yang tersimpan offline</p>';
        return;
      }
      
      container.innerHTML = '';
      statusEl.innerHTML = `<p>Anda memiliki ${stories.length} cerita yang tersimpan offline</p>`;
      
      stories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach((story) => {
        const header = story.description?.match(/\[HEADER\](.*?)\[\/HEADER\]/)?.[1] || '(Tanpa Judul)';
        const content = story.description?.replace(/\[HEADER\].*?\[\/HEADER\]/s, '').trim() || '';
        
        const item = document.createElement('li');
        item.className = 'story-item offline';
        item.innerHTML = `
          <div class="story-item-header">
            <h2>${header}</h2>
            <span class="badge offline-badge">Offline</span>
          </div>
          <p>${content.substring(0, 150)}${content.length > 150 ? '...' : ''}</p>
          <div class="story-meta">
            <small>${story.createdAt ? showFormattedDate(story.createdAt) : 'Tanggal tidak diketahui'}</small>
            ${story.photoUrl ? `<img src="${story.photoUrl}" alt="${header}" class="thumbnail">` : ''}
          </div>
          <button class="delete-btn" data-id="${story.id}" title="Hapus cerita">
            <i class="fas fa-trash-alt"></i>
          </button>
        `;

        item.querySelector('.delete-btn').addEventListener('click', async (e) => {
          e.stopPropagation();
          const confirmed = confirm('Apakah Anda yakin ingin menghapus cerita ini?');
          if (confirmed) {
            await this.deleteStory(story.id, item);
          }
        });

        container.appendChild(item);
      });
    } catch (error) {
      console.error('Error rendering offline stories:', error);
      container.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Gagal memuat cerita offline</p>
          <button id="retryBtn" class="button small">Coba Lagi</button>
        </div>
      `;
      document.getElementById('retryBtn').addEventListener('click', () => this.renderOfflineStories());
    }
  },

  async deleteStory(id, element) {
    try {
      await deleteData(id);
      element.remove();
      
      const stories = await getAllData();
      const statusEl = document.getElementById('offlineStatus');
      statusEl.innerHTML = `<p>Anda memiliki ${stories.length} cerita yang tersimpan offline</p>`;
      
      if (stories.length === 0) {
        document.getElementById('offlineStoryList').innerHTML = `
          <div class="empty-state">
            <i class="fas fa-inbox"></i>
            <p>Tidak ada cerita offline</p>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('Gagal menghapus cerita: ' + error.message);
    }
  },

  async clearAllStories() {
    try {
      await clearAllData();
      
      document.getElementById('offlineStoryList').innerHTML = `
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>Tidak ada cerita offline</p>
        </div>
      `;
      
      document.getElementById('offlineStatus').innerHTML = '<p>Anda memiliki 0 cerita yang tersimpan offline</p>';
    } catch (error) {
      console.error('Error clearing all stories:', error);
      alert('Gagal menghapus semua cerita: ' + error.message);
    }
  }
};

export default OfflineStoriesPage;