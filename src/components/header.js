/**
 * Top Header Navigation
 */

import { appState } from '../core/state.js';

export function renderHeader(container, onNavigate) {
  const state = appState.getState();

  container.innerHTML = `
    <header class="top-header">
      <div class="header-brand" id="brand-logo-btn">
        <span class="header-title">Code<span>Lingo</span></span>
      </div>

      <div class="header-actions">
        <div class="stat-chip streak" title="연속 학습 일수">
          <span>연속</span>
          <strong>${state.user.streak}일</strong>
        </div>

        <div class="stat-chip xp" title="누적 경험치">
          <strong>${state.user.xp} XP</strong>
        </div>

        <button class="btn btn-secondary btn-icon" id="theme-toggle-btn" title="화면 모드 전환">
          <span style="font-size: 0.85rem;">${state.settings.theme === 'dark' ? '라이트' : '다크'}</span>
        </button>

        <button class="btn btn-secondary btn-icon" id="user-profile-btn" title="내 정보">
          <span style="font-size: 0.82rem; font-weight: 700;">${state.user.name.slice(0, 2)}</span>
        </button>
      </div>
    </header>
  `;

  document.getElementById('brand-logo-btn')?.addEventListener('click', () => onNavigate('dashboard'));
  document.getElementById('theme-toggle-btn')?.addEventListener('click', () => {
    appState.toggleTheme();
    renderHeader(container, onNavigate);
  });
  document.getElementById('user-profile-btn')?.addEventListener('click', () => onNavigate('profile'));
}
