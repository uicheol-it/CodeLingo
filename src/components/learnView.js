/**
 * Concept Learning View
 * Sequential lesson unlocks with runnable examples and mandatory check quizzes.
 */

import { appState } from '../core/state.js';
import { PYTHON_LESSONS } from '../data/pythonLessons.js';
import { pythonEngine } from '../core/pythonEngine.js';

export function renderLearnView(container, onNavigate, options = {}) {
  const state = appState.getState();
  const activeId = options.lessonId || state.completedLessons[state.completedLessons.length - 1] || 'py-1';
  let currentLesson = PYTHON_LESSONS.find(l => l.id === activeId) || PYTHON_LESSONS[0];

  function render() {
    const isUnlocked = state.unlockedLessons.includes(currentLesson.id);
    const isCompleted = state.completedLessons.includes(currentLesson.id);

    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Steps Ribbon -->
        <div style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h3 style="font-size: 1.05rem;">파이썬 기초 문법 단계</h3>
            <span class="text-xs text-muted">${state.completedLessons.length} / ${PYTHON_LESSONS.length} 완료</span>
          </div>

          <div style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 6px;">
            ${PYTHON_LESSONS.map((lesson, idx) => {
              const unlocked = state.unlockedLessons.includes(lesson.id);
              const completed = state.completedLessons.includes(lesson.id);
              const isSelected = lesson.id === currentLesson.id;

              return `
                <button class="btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}" data-step-id="${lesson.id}" style="
                  white-space: nowrap; font-size: 0.78rem; opacity: ${unlocked ? '1' : '0.5'};
                ">
                  <span>${completed ? '✓ ' : unlocked ? '' : '🔒 '}${idx + 1}. ${lesson.title.split(' ')[0]}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        ${!isUnlocked ? `
          <div class="card" style="text-align: center; padding: 36px 16px;">
            <h3 style="font-size: 1.1rem; margin-bottom: 6px;">이전 단계를 먼저 완료해주세요</h3>
            <p class="text-xs text-secondary" style="margin-bottom: 14px;">
              기초부터 순서대로 학습하도록 설계되어 있습니다. 앞 단계의 확인 문제를 통과하면 잠금이 해제됩니다.
            </p>
            <button class="btn btn-primary btn-sm" id="btn-goto-unlocked">학습 가능한 단계로 이동</button>
          </div>
        ` : `
          <!-- Active Lesson Content -->
          <div class="card">
            <div class="card-header">
              <span class="badge-tag blue">${currentLesson.order}단계</span>
              <span class="text-xs text-muted">${currentLesson.duration}</span>
            </div>

            <h2 style="font-size: 1.2rem; margin-bottom: 12px;">${currentLesson.title}</h2>

            <!-- Concept Body -->
            <div style="font-size: 0.92rem; line-height: 1.7; color: var(--text-secondary); margin-bottom: 20px;">
              ${renderConceptMarkdown(currentLesson.concept)}
            </div>

            <!-- Runnable Example -->
            <div style="margin-bottom: 20px; border-top: 1px solid var(--border-color); padding-top: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong style="font-size: 0.88rem; color: var(--text-primary);">실행 예제 코드</strong>
                <button class="btn btn-primary btn-sm" id="btn-run-example">코드 실행</button>
              </div>

              <div class="editor-container">
                <textarea class="code-textarea" id="example-code" style="min-height: 140px;">${currentLesson.exampleCode.trim()}</textarea>
              </div>

              <div class="console-output" id="example-console" style="display: none;">
                <div class="console-title">
                  <span>실행 결과 (Output)</span>
                  <span id="example-time"></span>
                </div>
                <div id="example-result-text"></div>
              </div>

              <p class="text-xs text-muted" style="margin-top: 6px;">
                💡 <strong>해설:</strong> ${currentLesson.exampleExplanation}
              </p>
            </div>

            <!-- Check Quiz -->
            <div style="background: var(--bg-tertiary); border-radius: var(--radius-sm); padding: 14px; border: 1px solid var(--border-color);">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                <strong style="font-size: 0.88rem; color: var(--text-primary);">이해 확인 문제</strong>
                ${isCompleted ? '<span class="badge-tag green">통과 완료</span>' : '<span class="badge-tag">필수</span>'}
              </div>

              <p style="font-size: 0.9rem; font-weight: 600; margin-bottom: 12px;">
                ${currentLesson.checkQuestion.question}
              </p>

              <div id="quiz-options-list">
                ${currentLesson.checkQuestion.options.map((opt, oIdx) => `
                  <div class="quiz-option" data-opt-idx="${oIdx}">
                    <span style="font-family: var(--font-mono); font-weight: 700; width: 18px;">${oIdx + 1}.</span>
                    <span>${opt}</span>
                  </div>
                `).join('')}
              </div>

              <div id="quiz-feedback-box"></div>
            </div>
          </div>
        `}
      </div>
    `;

    // Step ribbon clicks
    container.querySelectorAll('[data-step-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-step-id');
        currentLesson = PYTHON_LESSONS.find(l => l.id === id) || currentLesson;
        render();
      });
    });

    document.getElementById('btn-goto-unlocked')?.addEventListener('click', () => {
      const lastUnlocked = state.unlockedLessons[state.unlockedLessons.length - 1] || 'py-1';
      currentLesson = PYTHON_LESSONS.find(l => l.id === lastUnlocked) || PYTHON_LESSONS[0];
      render();
    });

    // Run example code
    document.getElementById('btn-run-example')?.addEventListener('click', async () => {
      const code = document.getElementById('example-code').value;
      const consoleBox = document.getElementById('example-console');
      const resultText = document.getElementById('example-result-text');
      const timeSpan = document.getElementById('example-time');

      consoleBox.style.display = 'block';
      resultText.innerText = '실행 중...';

      const result = await pythonEngine.run(code);
      timeSpan.innerText = `${result.executionTimeMs}ms`;

      if (result.status === 'success') {
        resultText.innerText = result.output || '(출력 내용이 없습니다)';
        resultText.style.color = '#34d399';
      } else {
        resultText.innerText = `[${result.errorType}] ${result.message}\n💡 ${result.suggestion}`;
        resultText.style.color = '#f87171';
      }
    });

    // Quiz options click
    container.querySelectorAll('#quiz-options-list .quiz-option').forEach(optEl => {
      optEl.addEventListener('click', () => {
        const selectedIdx = parseInt(optEl.getAttribute('data-opt-idx'), 10);
        const isCorrect = selectedIdx === currentLesson.checkQuestion.correctIndex;
        const feedbackBox = document.getElementById('quiz-feedback-box');

        container.querySelectorAll('#quiz-options-list .quiz-option').forEach((el, idx) => {
          el.classList.remove('correct', 'wrong');
          if (idx === currentLesson.checkQuestion.correctIndex) el.classList.add('correct');
          else if (idx === selectedIdx && !isCorrect) el.classList.add('wrong');
        });

        if (isCorrect) {
          appState.completeLesson(currentLesson.id);
          const curIdx = PYTHON_LESSONS.findIndex(l => l.id === currentLesson.id);
          if (curIdx + 1 < PYTHON_LESSONS.length) {
            appState.unlockLesson(PYTHON_LESSONS[curIdx + 1].id);
          }

          feedbackBox.innerHTML = `
            <div class="feedback-box feedback-success">
              <strong>정답입니다! (+${currentLesson.xpReward} XP)</strong>
              <p class="text-xs" style="margin-top: 4px;">${currentLesson.checkQuestion.explanation}</p>
              ${curIdx + 1 < PYTHON_LESSONS.length ? `
                <button class="btn btn-primary btn-sm" id="btn-next-step" style="margin-top: 8px;">
                  다음 단계 (${PYTHON_LESSONS[curIdx + 1].title.split(' ')[0]})로 이동 →
                </button>
              ` : '<div class="text-xs" style="margin-top: 6px; font-weight: 700;">모든 기초 파이썬 개념 단계를 수료했습니다!</div>'}
            </div>
          `;

          document.getElementById('btn-next-step')?.addEventListener('click', () => {
            currentLesson = PYTHON_LESSONS[curIdx + 1];
            render();
          });
        } else {
          appState.addWrongAnswer({
            id: `wa-${currentLesson.id}`,
            problemId: currentLesson.id,
            type: 'lesson',
            title: currentLesson.title,
            question: currentLesson.checkQuestion.question,
            userAnswer: currentLesson.checkQuestion.options[selectedIdx],
            correctAnswer: currentLesson.checkQuestion.options[currentLesson.checkQuestion.correctIndex],
            explanation: currentLesson.checkQuestion.explanation
          });

          feedbackBox.innerHTML = `
            <div class="feedback-box feedback-error">
              <strong>다시 한 번 생각해보세요.</strong>
              <p class="text-xs" style="margin-top: 4px;">${currentLesson.checkQuestion.explanation}</p>
              <span class="text-xs text-muted" style="display: block; margin-top: 4px;">틀린 문제는 오답 노트에 저장되어 다시 복습할 수 있습니다.</span>
            </div>
          `;
        }
      });
    });
  }

  render();
}

function renderConceptMarkdown(text) {
  return text
    .replace(/### (.*?)\n/g, '<h4 style="color: var(--text-primary); margin: 12px 0 6px;">$1</h4>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--text-primary);">$1</strong>')
    .replace(/`([^`]+)`/g, '<code style="background: var(--bg-tertiary); padding: 2px 6px; border-radius: 4px; font-family: var(--font-mono); font-size: 0.85em; color: #60a5fa;">$1</code>')
    .replace(/\n\n/g, '<br/><br/>');
}
