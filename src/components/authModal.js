/**
 * User Account & Name Modal
 * Clean input placeholders with NO pre-filled dummy data.
 */

import { appState } from '../core/state.js';

export function showAuthModal(onSuccess) {
  const existing = document.getElementById('auth-modal');
  if (existing) existing.remove();

  const modalHtml = `
    <div class="modal-overlay" id="auth-modal">
      <div class="modal-content animate-fade-in">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <h3 style="font-size: 1.15rem;">학습자 정보 설정</h3>
          <button class="btn btn-secondary btn-sm" id="close-auth">✕</button>
        </div>

        <p class="text-xs text-secondary" style="margin-bottom: 16px;">
          이름을 등록해두면 기기에서 학습 진행률과 오답 기록이 안전하게 저장됩니다.
        </p>

        <form id="auth-form" style="display: flex; flex-direction: column; gap: 12px;">
          <div>
            <label class="text-xs text-muted" style="display: block; margin-bottom: 4px;">이름 또는 닉네임</label>
            <input type="text" id="auth-name" class="code-textarea" style="min-height: 38px; padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);" placeholder="이름을 입력하세요 (예: 홍길동)" required />
          </div>

          <div>
            <label class="text-xs text-muted" style="display: block; margin-bottom: 4px;">이메일 (선택)</label>
            <input type="email" id="auth-email" class="code-textarea" style="min-height: 38px; padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);" placeholder="email@example.com" />
          </div>

          <button type="submit" class="btn btn-primary" style="margin-top: 6px;">
            저장하기
          </button>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  document.getElementById('close-auth')?.addEventListener('click', () => {
    document.getElementById('auth-modal')?.remove();
  });

  document.getElementById('auth-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('auth-name').value.trim() || '학습자';
    const email = document.getElementById('auth-email').value.trim() || '';

    appState.login(name, email);
    document.getElementById('auth-modal')?.remove();
    if (onSuccess) onSuccess();
  });
}
