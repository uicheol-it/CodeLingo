/**
 * Main Application Orchestrator
 */

import { appState } from './core/state.js';
import { renderHeader } from './components/header.js';
import { renderBottomNav } from './components/bottomNav.js';
import { renderDashboardView } from './components/dashboardView.js';
import { renderLearnView } from './components/learnView.js';
import { renderPracticeView } from './components/practiceView.js';
import { renderAlgorithmView } from './components/algorithmView.js';
import { renderGuideView } from './components/guideView.js';
import { renderReviewView } from './components/reviewView.js';
import { renderProfileView } from './components/profileView.js';

class App {
  constructor() {
    this.currentView = 'dashboard';
    this.viewOptions = {};
    this.headerContainer = document.getElementById('header-mount');
    this.mainContainer = document.getElementById('main-mount');
    this.bottomNavContainer = document.getElementById('bottom-nav-mount');

    this.init();
  }

  init() {
    document.documentElement.setAttribute('data-theme', appState.getState().settings.theme);

    appState.subscribe(() => {
      this.updateHeader();
    });

    this.navigate('dashboard');
  }

  navigate(viewId, options = {}) {
    this.currentView = viewId;
    this.viewOptions = options;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    this.updateHeader();
    this.renderCurrentView();
    this.updateBottomNav();
  }

  updateHeader() {
    renderHeader(this.headerContainer, (view, opts) => this.navigate(view, opts));
  }

  updateBottomNav() {
    renderBottomNav(this.bottomNavContainer, this.currentView, (view, opts) => this.navigate(view, opts));
  }

  renderCurrentView() {
    this.mainContainer.innerHTML = '';

    switch (this.currentView) {
      case 'dashboard':
        renderDashboardView(this.mainContainer, (view, opts) => this.navigate(view, opts));
        break;
      case 'learn':
        renderLearnView(this.mainContainer, (view, opts) => this.navigate(view, opts), this.viewOptions);
        break;
      case 'practice':
        renderPracticeView(this.mainContainer, (view, opts) => this.navigate(view, opts), this.viewOptions);
        break;
      case 'algorithms':
        renderAlgorithmView(this.mainContainer, (view, opts) => this.navigate(view, opts), this.viewOptions);
        break;
      case 'guide':
        renderGuideView(this.mainContainer, (view, opts) => this.navigate(view, opts));
        break;
      case 'review':
        renderReviewView(this.mainContainer, (view, opts) => this.navigate(view, opts));
        break;
      case 'profile':
        renderProfileView(this.mainContainer, (view, opts) => this.navigate(view, opts));
        break;
      default:
        renderDashboardView(this.mainContainer, (view, opts) => this.navigate(view, opts));
        break;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
