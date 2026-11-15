/**
 * Code Practice View
 * Mobile quick-key toolbar, in-browser sandbox evaluation, and progressive hints.
 */

import { appState } from '../core/state.js';
import { PRACTICE_PROBLEMS } from '../data/practiceProblems.js';
import { pythonEngine } from '../core/pythonEngine.js';

export function renderPracticeView(container, onNavigate, options = {}) {
  const activeId = options.problemId || PRACTICE_PROBLEMS[0].id;
  let currentProblem = PRACTICE_PROBLEMS.find(p => p.id === activeId) || PRACTICE_PROBLEMS[0];
  let revealedHintIndex = -1;

  function render() {
    const submission = appState.getState().problemSubmissions[currentProblem.id];
    const isPassed = submission && submission.status === 'passed';

    container.innerHTML = `
      <div class="animate-fade-in">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
          <div>
            <h3 style="font-size: 1.05rem;">코드 직접 작성 & 연습</h3>
            <span class="text-xs text-muted">문제를 읽고 아래 에디터에서 코드를 완성하세요.</span>
          </div>

          <select id="problem-select" class="speed-select" style="max-width: 180px;">
            ${PRACTICE_PROBLEMS.map(p => {
              const sub = appState.getState().problemSubmissions[p.id];
              const check = sub && sub.status === 'passed' ? '✓ ' : '';
              return `<option value="${p.id}" ${p.id === currentProblem.id ? 'selected' : ''}>${check}${p.title}</option>`;
            }).join('')}
          </select>
        </div>

        <!-- Problem Description Card -->
        <div class="card">
          <div class="card-header">
            <span class="badge-tag blue">${currentProblem.level}</span>
            ${isPassed ? '<span class="badge-tag green">해결 완료</span>' : ''}
          </div>
          <h2 style="font-size: 1.15rem; margin-bottom: 6px;">${currentProblem.title}</h2>
          <div style="font-size: 0.9rem; line-height: 1.6; color: var(--text-secondary); margin-bottom: 12px;">
            ${renderProblemMarkdown(currentProblem.description)}
          </div>

          <!-- Hints -->
          <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 10px;">
            <span class="text-xs text-muted">
              ${revealedHintIndex >= 0 ? `힌트 (${revealedHintIndex + 1}/${currentProblem.hints.length})` : '풀이가 막힐 때 힌트를 확인하세요.'}
            </span>
            <button class="btn btn-secondary btn-sm" id="btn-show-hint">
              ${revealedHintIndex < currentProblem.hints.length - 1 ? '힌트 열기' : '모든 힌트 확인됨'}
            </button>
          </div>

          ${revealedHintIndex >= 0 ? `
            <div class="feedback-box feedback-warning">
              <strong>힌트 ${revealedHintIndex + 1}:</strong> ${currentProblem.hints[revealedHintIndex]}
            </div>
          ` : ''}
        </div>

        <!-- Editor -->
        <div class="editor-container">
          <div class="mobile-code-toolbar">
            <span class="text-xs text-muted" style="padding-right: 4px;">빠른 입력:</span>
            <button class="quick-key-btn" data-insert=":">:</button>
            <button class="quick-key-btn" data-insert="()">()</button>
            <button class="quick-key-btn" data-insert="[]">[]</button>
            <button class="quick-key-btn" data-insert='""'>""</button>
            <button class="quick-key-btn" data-insert="    ">Tab</button>
            <button class="quick-key-btn" data-insert=" == ">==</button>
            <button class="quick-key-btn" data-insert=" + ">+</button>
            <button class="quick-key-btn" data-insert="def ">def</button>
            <button class="quick-key-btn" data-insert="print()">print()</button>
            <button class="quick-key-btn" data-insert="for ">for</button>
            <button class="quick-key-btn" data-insert=" in ">in</button>
          </div>

          <textarea class="code-textarea" id="practice-textarea" spellcheck="false">${(submission && submission.userCode) ? submission.userCode : currentProblem.starterCode}</textarea>

          <div class="editor-footer">
            <button class="btn btn-secondary btn-sm" id="btn-reset-code">초기화</button>
            <button class="btn btn-primary" id="btn-submit-code">코드 제출 및 채점</button>
          </div>
        </div>

        <!-- Result Console Area -->
        <div id="practice-result-area"></div>
      </div>
    `;

    document.getElementById('problem-select')?.addEventListener('change', (e) => {
      currentProblem = PRACTICE_PROBLEMS.find(p => p.id === e.target.value) || currentProblem;
      revealedHintIndex = -1;
      render();
    });

    const textarea = document.getElementById('practice-textarea');
    container.querySelectorAll('.quick-key-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        insertAtCursor(textarea, btn.getAttribute('data-insert'));
      });
    });

    document.getElementById('btn-reset-code')?.addEventListener('click', () => {
      if (confirm('작성 중인 코드를 문제 초기 상태로 되돌릴까요?')) {
        textarea.value = currentProblem.starterCode;
      }
    });

    document.getElementById('btn-show-hint')?.addEventListener('click', () => {
      if (revealedHintIndex < currentProblem.hints.length - 1) {
        revealedHintIndex++;
        render();
      }
    });

    document.getElementById('btn-submit-code')?.addEventListener('click', async () => {
      const code = textarea.value;
      const resultArea = document.getElementById('practice-result-area');

      resultArea.innerHTML = `
        <div class="console-output">
          <span class="text-xs text-muted">코드를 실행하고 채점 중입니다...</span>
        </div>
      `;

      const result = await pythonEngine.run(code);

      if (result.status === 'success') {
        const output = result.output.trim();
        const isCorrect = currentProblem.expectedPattern.test(output);

        if (isCorrect) {
          appState.recordSubmission(currentProblem.id, 'passed', code);

          resultArea.innerHTML = `
            <div class="feedback-box feedback-success">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong>정답입니다! 통과되었습니다 (+30 XP)</strong>
                <span class="text-xs">${result.executionTimeMs}ms 소요</span>
              </div>
              <p class="text-xs" style="margin-top: 4px;">작성한 코드가 문제의 요구 조건을 올바르게 충족했습니다.</p>
            </div>

            <div class="console-output">
              <div class="console-title">
                <span>실행 출력 결과</span>
                <span style="color: var(--accent-success);">성공</span>
              </div>
              <div>${escapeHtml(output)}</div>
            </div>
          `;
        } else {
          appState.recordSubmission(currentProblem.id, 'failed', code);
          appState.addWrongAnswer({
            id: `wa-${currentProblem.id}`,
            problemId: currentProblem.id,
            type: 'practice',
            title: currentProblem.title,
            question: currentProblem.description.trim().slice(0, 80) + '...',
            userAnswer: output || '(출력 없음)',
            correctAnswer: '문제에서 요구한 출력 형식 일치',
            explanation: currentProblem.hints[0]
          });

          resultArea.innerHTML = `
            <div class="feedback-box feedback-warning">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong>오답입니다 (예상 결과와 다름)</strong>
                <span class="text-xs">${result.executionTimeMs}ms 소요</span>
              </div>
              <p class="text-xs" style="margin-top: 4px;">코드는 실행되었으나 출력된 결과가 문제의 요구와 일치하지 않습니다. 오답 노트에 저장되었습니다.</p>
            </div>

            <div class="console-output">
              <div class="console-title">
                <span>내 코드 출력 결과</span>
              </div>
              <div style="color: #fbbf24;">${escapeHtml(output) || '(화면에 출력된 내용이 없습니다. print()를 사용했는지 확인하세요)'}</div>
            </div>
          `;
        }
      } else {
        appState.recordSubmission(currentProblem.id, 'error', code);
        appState.addWrongAnswer({
          id: `wa-${currentProblem.id}`,
          problemId: currentProblem.id,
          type: 'practice',
          title: currentProblem.title,
          question: `코드 실행 중 ${result.errorType} 발생`,
          userAnswer: result.message,
          correctAnswer: '문법 오류 수정 후 정상 실행',
          explanation: result.suggestion
        });

        resultArea.innerHTML = `
          <div class="feedback-box feedback-error">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <strong>${result.errorType}</strong>
              ${result.line ? `<span class="badge-tag" style="background: rgba(239, 68, 68, 0.2); color: #fca5a5;">${result.line}번째 줄</span>` : ''}
            </div>
            <p class="text-xs" style="margin-top: 4px;">${result.message}</p>
            <div class="text-xs" style="margin-top: 6px; padding: 6px 8px; background: rgba(0,0,0,0.25); border-radius: 4px;">
              💡 <strong>수정 팁:</strong> ${result.suggestion}
            </div>
          </div>
        `;
      }
    });
  }

  render();
}

function insertAtCursor(textarea, text) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const val = textarea.value;

  textarea.value = val.substring(0, start) + text + val.substring(end);
  textarea.focus();
  if (text === '()' || text === '[]' || text === '""') {
    textarea.selectionStart = textarea.selectionEnd = start + 1;
  } else {
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
  }
}

function renderProblemMarkdown(text) {
  return text
    .replace(/`([^`]+)`/g, '<code style="background: var(--bg-tertiary); padding: 2px 6px; border-radius: 4px; font-family: var(--font-mono); font-size: 0.85em; color: #60a5fa;">$1</code>')
    .replace(/\n\n/g, '<br/><br/>');
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
