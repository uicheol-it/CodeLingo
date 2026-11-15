/**
 * Profile & Settings View
 */

import { appState } from '../core/state.js';
import { BADGES } from '../data/badges.js';
import { showAuthModal } from './authModal.js';

export function renderProfileView(container, onNavigate) {
  const state = appState.getState();
  const unlockedBadgesCount = state.unlockedBadges.length;

  function render() {
    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- User Info Card -->
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 44px; height: 44px; border-radius: 50%; background: var(--bg-tertiary); display: flex; align-items: center; justify-content: center; font-weight: 700; color: var(--accent-primary);">
                ${state.user.name.slice(0, 1)}
              </div>
              <div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <h3 style="font-size: 1.1rem;">${state.user.name}</h3>
                  <span class="badge-tag blue">Lv.${state.user.level}</span>
                </div>
                <div class="text-xs text-muted">${state.user.isLoggedIn ? state.user.email : '로컬 모드 (기기 저장)'}</div>
              </div>
            </div>

            <button class="btn btn-secondary btn-sm" id="btn-auth">
              ${state.user.isLoggedIn ? '로그아웃' : '이름 설정'}
            </button>
          </div>

          <!-- Stats Grid -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; background: var(--bg-tertiary); padding: 10px; border-radius: var(--radius-sm); text-align: center;">
            <div>
              <div style="font-size: 1.1rem; font-weight: 800; color: #f97316;">${state.user.streak}일</div>
              <div class="text-xs text-muted">연속 학습</div>
            </div>
            <div>
              <div style="font-size: 1.1rem; font-weight: 800; color: #eab308;">${state.user.xp}</div>
              <div class="text-xs text-muted">경험치(XP)</div>
            </div>
            <div>
              <div style="font-size: 1.1rem; font-weight: 800; color: var(--accent-success);">${unlockedBadgesCount}개</div>
              <div class="text-xs text-muted">달성 배지</div>
            </div>
          </div>
        </div>

        <!-- Badges Card -->
        <div class="card">
          <div class="card-header">
            <h3 style="font-size: 1rem;">달성 배지 목록</h3>
            <span class="text-xs text-muted">${unlockedBadgesCount} / ${BADGES.length}</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 8px; margin-top: 8px;">
            ${BADGES.map(b => {
              const unlocked = state.unlockedBadges.includes(b.id);
              return `
                <div style="
                  padding: 10px 8px; text-align: center; border-radius: var(--radius-sm);
                  background: ${unlocked ? 'rgba(37, 99, 235, 0.1)' : 'var(--bg-tertiary)'};
                  border: 1px solid ${unlocked ? 'rgba(37, 99, 235, 0.3)' : 'var(--border-color)'};
                  opacity: ${unlocked ? '1' : '0.4'};
                ">
                  <strong style="font-size: 0.8rem; display: block;">${b.title}</strong>
                  <span class="text-xs text-muted" style="font-size: 0.68rem; display: block; margin-top: 2px;">${b.description}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Settings Card -->
        <div class="card">
          <h3 style="font-size: 1rem; margin-bottom: 12px;">데이터 및 설정</h3>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--border-color);">
              <div>
                <strong style="font-size: 0.88rem;">화면 테마</strong>
                <div class="text-xs text-muted">${state.settings.theme === 'dark' ? '다크 모드' : '라이트 모드'}</div>
              </div>
              <button class="btn btn-secondary btn-sm" id="btn-theme">전환</button>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--border-color);">
              <div>
                <strong style="font-size: 0.88rem;">학습 데이터 백업</strong>
                <div class="text-xs text-muted">진행 상황을 파일로 저장합니다.</div>
              </div>
              <button class="btn btn-secondary btn-sm" id="btn-backup">내보내기</button>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0;">
              <div>
                <strong style="font-size: 0.88rem; color: var(--accent-danger);">학습 기록 초기화</strong>
                <div class="text-xs text-muted">모든 진도와 기록을 0으로 리셋합니다.</div>
              </div>
              <button class="btn btn-danger btn-sm" id="btn-reset">초기화</button>
            </div>
          </div>
        </div>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    document.getElementById('btn-auth')?.addEventListener('click', () => {
      if (state.user.isLoggedIn) {
        if (confirm('로그아웃 하시겠습니까?')) {
          appState.logout();
          render();
        }
      } else {
        showAuthModal(() => render());
      }
    });

    document.getElementById('btn-theme')?.addEventListener('click', () => {
      appState.toggleTheme();
      render();
    });

    document.getElementById('btn-backup')?.addEventListener('click', () => {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(appState.getState(), null, 2));
      const a = document.createElement('a');
      a.setAttribute('href', dataStr);
      a.setAttribute('download', `python_lab_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(a);
      a.click();
      a.remove();
    });

    document.getElementById('btn-reset')?.addEventListener('click', () => {
      if (confirm('정말로 모든 학습 진도와 오답 노트를 처음 상태로 리셋하시겠습니까?')) {
        appState.resetAllData();
        onNavigate('dashboard');
      }
    });
  }

  render();
}
