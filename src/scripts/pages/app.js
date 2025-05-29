import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this._setupDrawer();
    this._setupSkipLink();
    this._setupNetworkListener(); // Tambahkan ini
  }

  _setupNetworkListener() {
    const updateOnlineStatus = () => {
      const offlineBadge = document.getElementById('offline-badge');
      if (!navigator.onLine) {
        if (!offlineBadge) {
          const badge = document.createElement('div');
          badge.id = 'offline-badge';
          badge.innerHTML = `
            <i class="fas fa-wifi-slash"></i> Mode Offline
            <button id="view-offline-stories" class="button small">
              Lihat Cerita Offline
            </button>
          `;
          document.body.prepend(badge);
          
          document.getElementById('view-offline-stories').addEventListener('click', () => {
            window.location.hash = '#/offline-stories';
          });
        }
      } else if (offlineBadge) {
        offlineBadge.remove();
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus(); // Init check
  }

  _setupSkipLink() {
    const skipLink = document.querySelector('.skip-link');
    skipLink.addEventListener('click', (event) => {
      event.preventDefault();
      this.#content.focus();
      this.#content.scrollIntoView();
    });
  }

  _setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      this.#navigationDrawer.classList.toggle('open');
    });

    document.body.addEventListener('click', (event) => {
      if (!this.#navigationDrawer.contains(event.target) && !this.#drawerButton.contains(event.target)) {
        this.#navigationDrawer.classList.remove('open');
      }

      this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove('open');
        }
      })
    });
  }

  async renderPage() {
    const url = getActiveRoute();
    const page = routes[url];

    this.#content.innerHTML = await page.render();
    await page.afterRender();
  }
}

export default App;
