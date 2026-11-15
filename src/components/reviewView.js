/**
 * Review & Quiz View
 * Clean empty state with zero dummy data and retry capabilities.
 */

import { appState } from '../core/state.js';
import { GENERAL_QUIZZES } from '../data/quizzes.js';

export function renderReviewView(container, onNavigate) {
  const state = appState.getState();
  let currentTab = 'wrong_answers'; // 'wrong_answers' | 'quizzes'
  let activeQuizIdx = 0;

  function render() {
    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Tab Bar -->
        <div style="display: flex; gap: 8px; margin-bottom: 16px;">
          <button class="btn btn-sm ${currentTab === 'wrong_answers' ? 'btn-primary' : 'btn-secondary'}" id="tab-wrong">
            오답 복습 (${state.wrongAnswers.length})
          </button>
          <button class="btn btn-sm ${currentTab === 'quizzes' ? 'btn-primary' : 'btn-secondary'}" id="tab-quiz">
            종합 개념 퀴즈 (${GENERAL_QUIZZES.length})
          </button>
        </div>

        ${currentTab === 'wrong_answers' ? renderWrongAnswers() : renderQuizzes()}
      </div>
    `;

    bindEvents();
  }

  function renderWrongAnswers() {
    if (state.wrongAnswers.length === 0) {
      return `
        <div class="card" style="text-align: center; padding: 40px 16px;">
          <h3 style="font-size: 1.1rem; margin-bottom: 6px;">오답 노트가 비어있습니다</h3>
          <p class="text-xs text-secondary" style="margin-bottom: 16px;">
            학습 중 틀린 문제가 생기면 이곳에 자동으로 모여 복습할 수 있습니다.
          </p>
          <button class="btn btn-primary btn-sm" id="btn-goto-practice">코드 연습 풀러 가기 →</button>
        </div>
      `;
    }

    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 style="font-size: 1.05rem;">오답 복습 노트</h3>
          <span class="text-xs text-muted">다시 풀어보며 개념을 확실히 잡으세요.</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${state.wrongAnswers.map(wa => `
            <div class="card" style="border-left: 3px solid var(--accent-danger);">
              <div class="card-header">
                <span class="badge-tag">${wa.type === 'lesson' ? '개념 확인' : '코드 연습'}</span>
                <span class="text-xs text-muted">${new Date(wa.addedAt).toLocaleDateString()}</span>
              </div>

              <h4 style="font-size: 0.95rem; margin-bottom: 4px;">${wa.title}</h4>
              <p class="text-xs text-secondary" style="margin-bottom: 8px;">${wa.question}</p>

              <div style="background: var(--bg-tertiary); padding: 8px 12px; border-radius: var(--radius-sm); font-size: 0.82rem; margin-bottom: 10px;">
                <div style="color: #f87171; margin-bottom: 3px;">내 제출: <code>${wa.userAnswer}</code></div>
                <div style="color: #34d399; margin-bottom: 3px;">정답: <code>${wa.correctAnswer}</code></div>
                <div class="text-xs text-muted">해설: ${wa.explanation}</div>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 6px;">
                <button class="btn btn-secondary btn-sm" data-del-wa="${wa.id}">노트에서 삭제</button>
                <button class="btn btn-primary btn-sm" data-retry-wa="${wa.problemId || wa.id}" data-type="${wa.type}">다시 풀기 →</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderQuizzes() {
    const quiz = GENERAL_QUIZZES[activeQuizIdx];
    return `
      <div class="card">
        <div class="card-header">
          <span class="badge-tag blue">${quiz.category}</span>
          <span class="text-xs text-muted">문제 ${activeQuizIdx + 1} / ${GENERAL_QUIZZES.length}</span>
        </div>

        <h3 style="font-size: 1.05rem; margin-bottom: 8px;">종합 개념 퀴즈</h3>

        ${quiz.code ? `
          <div class="code-sync-panel" style="margin-bottom: 12px; border-radius: var(--radius-sm);">
            <pre style="margin: 0; font-family: var(--font-mono); color: #f4f4f5; font-size: 0.85rem;">${quiz.code}</pre>
          </div>
        ` : ''}

        <p style="font-size: 0.92rem; font-weight: 600; margin-bottom: 12px;">
          ${quiz.question}
        </p>

        <div id="general-quiz-list">
          ${quiz.options.map((opt, idx) => `
            <div class="quiz-option" data-quiz-idx="${idx}">
              <span style="font-family: var(--font-mono); font-weight: 700; width: 18px;">${idx + 1}.</span>
              <span>${opt}</span>
            </div>
          `).join('')}
        </div>

        <div id="quiz-feedback"></div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px; border-top: 1px solid var(--border-color); padding-top: 10px;">
          <button class="btn btn-secondary btn-sm" id="btn-quiz-prev" ${activeQuizIdx === 0 ? 'disabled style="opacity: 0.4;"' : ''}>이전</button>
          <button class="btn btn-primary btn-sm" id="btn-quiz-next" ${activeQuizIdx === GENERAL_QUIZZES.length - 1 ? 'disabled style="opacity: 0.4;"' : ''}>다음</button>
        </div>
      </div>
    `;
  }

  function bindEvents() {
    document.getElementById('tab-wrong')?.addEventListener('click', () => {
      currentTab = 'wrong_answers';
      render();
    });

    document.getElementById('tab-quiz')?.addEventListener('click', () => {
      currentTab = 'quizzes';
      render();
    });

    document.getElementById('btn-goto-practice')?.addEventListener('click', () => onNavigate('practice'));

    container.querySelectorAll('[data-del-wa]').forEach(btn => {
      btn.addEventListener('click', () => {
        appState.removeWrongAnswer(btn.getAttribute('data-del-wa'));
        render();
      });
    });

    container.querySelectorAll('[data-retry-wa]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-retry-wa');
        const type = btn.getAttribute('data-type');
        if (type === 'lesson') onNavigate('learn', { lessonId: id });
        else if (type === 'practice') onNavigate('practice', { problemId: id });
      });
    });

    const quiz = GENERAL_QUIZZES[activeQuizIdx];
    container.querySelectorAll('#general-quiz-list .quiz-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const selIdx = parseInt(opt.getAttribute('data-quiz-idx'), 10);
        const isCorrect = selIdx === quiz.correctIndex;
        const fb = document.getElementById('quiz-feedback');

        container.querySelectorAll('#general-quiz-list .quiz-option').forEach((el, idx) => {
          el.classList.remove('correct', 'wrong');
          if (idx === quiz.correctIndex) el.classList.add('correct');
          else if (idx === selIdx && !isCorrect) el.classList.add('wrong');
        });

        if (isCorrect) {
          appState.addXP(20, '종합 퀴즈 정답');
          fb.innerHTML = `
            <div class="feedback-box feedback-success">
              <strong>정답입니다! (+20 XP)</strong>
              <p class="text-xs" style="margin-top: 4px;">${quiz.explanation}</p>
            </div>
          `;
        } else {
          appState.addWrongAnswer({
            id: `wa-${quiz.id}`,
            problemId: quiz.id,
            type: 'quiz',
            title: quiz.category,
            question: quiz.question,
            userAnswer: quiz.options[selIdx],
            correctAnswer: quiz.options[quiz.correctIndex],
            explanation: quiz.explanation
          });

          fb.innerHTML = `
            <div class="feedback-box feedback-error">
              <strong>오답입니다.</strong>
              <p class="text-xs" style="margin-top: 4px;">${quiz.explanation}</p>
            </div>
          `;
        }
      });
    });

    document.getElementById('btn-quiz-prev')?.addEventListener('click', () => {
      if (activeQuizIdx > 0) {
        activeQuizIdx--;
        render();
      }
    });

    document.getElementById('btn-quiz-next')?.addEventListener('click', () => {
      if (activeQuizIdx < GENERAL_QUIZZES.length - 1) {
        activeQuizIdx++;
        render();
      }
    });
  }

  render();
}
