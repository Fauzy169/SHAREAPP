import '../styles/styles.css';
import App from './pages/app';
import { initializeServiceWorker } from './utils/sw-register';
import { showNotification } from './utils/notification';

document.addEventListener('DOMContentLoaded', async () => {

  initializeServiceWorker();

  window.addEventListener('online', () => {
    showNotification('Anda kembali online', 'success');
  });

  window.addEventListener('offline', () => {
    showNotification('Anda sedang offline. Beberapa fitur mungkin terbatas.', 'warning');
  });

  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
    authButtons: document.querySelector('#auth-buttons'),
  });


  async function transitionToPage(callback) {
    const currentContent = document.querySelector('#main-content');
    const fadeOut = currentContent.animate(
      [
        { opacity: 1, transform: 'translateY(0)' },
        { opacity: 0, transform: 'translateY(20px)' }
      ],
      {
        duration: 300,
        easing: 'ease-in-out',
        fill: 'forwards'
      }
    );

    await fadeOut.finished;
    
    await callback();
    const newContent = document.querySelector('#main-content');
    newContent.style.opacity = '0';
    newContent.style.transform = 'translateY(-20px)';
    
    const fadeIn = newContent.animate(
      [
        { opacity: 0, transform: 'translateY(-20px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ],
      {
        duration: 300,
        easing: 'ease-in-out',
        fill: 'forwards'
      }
    );

    await fadeIn.finished;
  }
  await transitionToPage(async () => {
    await app.renderPage();
  });

  window.addEventListener('hashchange', async () => {
    await transitionToPage(async () => {
      await app.renderPage();
    });
  });
});