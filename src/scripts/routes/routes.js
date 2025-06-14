import HomePage from '../pages/home/home-page';
import AboutPage from '../pages/about/about-page';
import StoryPage from '../pages/story/story-page';
import StoryDetailPage from '../pages/story/detail-page';
import AddStoryPage from '../pages/add-story/add-story-page';
import LoginPage from '../pages/auth/login-page';
import RegisterPage from '../pages/auth/register-page';
import OfflineStoriesPage from '../pages/offline-stories/offline-stories-page';

const routes = {
  '/': new HomePage(),
  '/about': new AboutPage(),
  '/stories': new StoryPage(),
  '/stories/:id': new StoryDetailPage(),
  '/add-story': new AddStoryPage(),
  '/login': new LoginPage(),
  '/register': new RegisterPage(),
  '/offline-stories': OfflineStoriesPage(),
};

export default routes;