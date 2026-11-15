/**
 * Advanced Python Guide & Glossary View Component
 * Features:
 * 1. 12 Core Python Glossary terms with search and category filtering
 * 2. 10 Technical Quizzes with instant grading and detailed explanations
 * 3. 5 Deep Essay Interview topics with scoring criteria and model answers
 */

import { appState } from '../core/state.js';
import { GLOSSARY_TERMS, ADVANCED_QUIZZES, ESSAY_TOPICS } from '../data/advancedGuide.js';

export function renderGuideView(container, onNavigate) {
  let activeSubTab = 'glossary'; // 'glossary' | 'quizzes' | 'essays'
  let glossarySearchQuery = '';
  let activeQuizIdx = 0;
  let quizAnswers = {}; // { [idx]: { selected: number, isCorrect: boolean } }

  function render() {
    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Sub-tabs bar -->
        <div style="display: flex; gap: 6px; margin-bottom: 16px; overflow-x: auto; padding-bottom: 4px;">
          <button class="btn btn-sm ${activeSubTab === 'glossary' ? 'btn-primary' : 'btn-secondary'}" id="subtab-glossary">
            핵심 용어사전 (12)
          </button>
          <button class="btn btn-sm ${activeSubTab === 'quizzes' ? 'btn-primary' : 'btn-secondary'}" id="subtab-quizzes">
            핵심 단답형 퀴즈 (10)
          </button>
          <button class="btn btn-sm ${activeSubTab === 'essays' ? 'btn-primary' : 'btn-secondary'}" id="subtab-essays">
            기술면접 서술형 평가 (5)
          </button>
        </div>

        ${activeSubTab === 'glossary' ? renderGlossarySection() : ''}
        ${activeSubTab === 'quizzes' ? renderQuizzesSection() : ''}
        ${activeSubTab === 'essays' ? renderEssaysSection() : ''}
      </div>
    `;

    bindEvents();
  }

  function renderGlossarySection() {
    const filteredTerms = GLOSSARY_TERMS.filter(t => 
      t.term.includes(glossarySearchQuery) || 
      t.eng.toLowerCase().includes(glossarySearchQuery.toLowerCase()) ||
      t.category.includes(glossarySearchQuery) ||
      t.summary.includes(glossarySearchQuery)
    );

    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div>
            <h3 style="font-size: 1.05rem;">파이썬 12대 핵심 용어사전</h3>
            <span class="text-xs text-muted">인터프리터 스펙에 기반한 공식 표준 용어집입니다.</span>
          </div>
        </div>

        <!-- Search Bar -->
        <div style="margin-bottom: 14px;">
          <input 
            type="text" 
            id="glossary-search" 
            class="code-textarea" 
            style="min-height: 38px; padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); font-size: 0.85rem;" 
            placeholder="용어 검색 (예: 인덱스, 제너레이터, 스코프, 패킹...)" 
            value="${escapeHtml(glossarySearchQuery)}"
          />
        </div>

        <!-- Terms List -->
        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${filteredTerms.length === 0 ? `
            <div class="card" style="text-align: center; padding: 30px;">
              <span class="text-xs text-muted">검색어와 일치하는 용어가 없습니다.</span>
            </div>
          ` : filteredTerms.map(t => `
            <div class="card" style="padding: 14px; border-left: 3px solid var(--accent-primary);">
              <div class="card-header" style="margin-bottom: 6px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <strong style="font-size: 0.95rem;">${t.term}</strong>
                  <span class="text-xs text-muted" style="font-family: var(--font-mono);">(${t.eng})</span>
                </div>
                <span class="badge-tag blue">${t.category}</span>
              </div>

              <p class="text-xs text-secondary" style="margin-bottom: 8px; font-weight: 600;">${t.summary}</p>
              <p class="text-xs text-muted" style="line-height: 1.6; margin-bottom: 10px;">${t.description}</p>

              ${t.example ? `
                <div class="code-sync-panel" style="padding: 8px 10px; border-radius: 4px; font-size: 0.78rem;">
                  <pre style="margin: 0; color: #f4f4f5;">${escapeHtml(t.example)}</pre>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderQuizzesSection() {
    const quiz = ADVANCED_QUIZZES[activeQuizIdx];
    const prevAnswer = quizAnswers[activeQuizIdx];

    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div>
            <h3 style="font-size: 1.05rem;">파이썬 단답형 평가 퀴즈</h3>
            <span class="text-xs text-muted">문제 ${activeQuizIdx + 1} / ${ADVANCED_QUIZZES.length}</span>
          </div>

          <div style="display: flex; gap: 4px;">
            ${ADVANCED_QUIZZES.map((_, qIdx) => {
              const ans = quizAnswers[qIdx];
              const bg = ans ? (ans.isCorrect ? 'var(--accent-success)' : 'var(--accent-danger)') : (qIdx === activeQuizIdx ? 'var(--accent-primary)' : 'var(--bg-tertiary)');
              return `
                <span style="width: 8px; height: 8px; border-radius: 50%; background: ${bg}; display: inline-block;"></span>
              `;
            }).join('')}
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="badge-tag blue">Q${activeQuizIdx + 1}</span>
            <span class="text-xs text-muted">핵심 문법 평가</span>
          </div>

          <h2 style="font-size: 1.05rem; margin-bottom: 8px;">${quiz.title}</h2>
          <p style="font-size: 0.92rem; font-weight: 600; margin-bottom: 14px; line-height: 1.5;">
            ${quiz.question}
          </p>

          <div id="adv-quiz-options">
            ${quiz.options.map((opt, oIdx) => {
              let optClass = '';
              if (prevAnswer) {
                if (oIdx === quiz.correctIndex) optClass = 'correct';
                else if (oIdx === prevAnswer.selected && !prevAnswer.isCorrect) optClass = 'wrong';
              }
              return `
                <div class="quiz-option ${optClass}" data-adv-idx="${oIdx}">
                  <span style="font-family: var(--font-mono); font-weight: 700; width: 18px;">${oIdx + 1}.</span>
                  <span>${opt}</span>
                </div>
              `;
            }).join('')}
          </div>

          <div id="adv-quiz-feedback">
            ${prevAnswer ? `
              <div class="feedback-box ${prevAnswer.isCorrect ? 'feedback-success' : 'feedback-error'}">
                <strong>${prevAnswer.isCorrect ? '정답입니다!' : '오답입니다.'}</strong>
                <p class="text-xs" style="margin-top: 4px;">${quiz.explanation}</p>
              </div>
            ` : ''}
          </div>

          <!-- Controls -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px; border-top: 1px solid var(--border-color); padding-top: 10px;">
            <button class="btn btn-secondary btn-sm" id="btn-adv-prev" ${activeQuizIdx === 0 ? 'disabled style="opacity: 0.4;"' : ''}>이전 문제</button>
            <button class="btn btn-primary btn-sm" id="btn-adv-next" ${activeQuizIdx === ADVANCED_QUIZZES.length - 1 ? 'disabled style="opacity: 0.4;"' : ''}>다음 문제</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderEssaysSection() {
    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div>
            <h3 style="font-size: 1.05rem;">기술면접 심화 서술형 평가 (5문항)</h3>
            <span class="text-xs text-muted">카카오, 네이버, 토스 등 주요 IT 기업 기술 면접 대비</span>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 14px;">
          ${ESSAY_TOPICS.map((e, eIdx) => `
            <div class="card" style="border-left: 3px solid var(--accent-primary);">
              <div class="card-header">
                <span class="badge-tag blue">서술형 ${eIdx + 1}</span>
                <span class="text-xs text-muted">${e.category}</span>
              </div>

              <h4 style="font-size: 1rem; margin-bottom: 6px;">${e.title}</h4>
              <p class="text-xs text-secondary" style="line-height: 1.6; margin-bottom: 12px; font-weight: 600;">
                ${e.question}
              </p>

              <!-- Scoring criteria -->
              <div style="background: var(--bg-tertiary); padding: 10px 12px; border-radius: var(--radius-sm); margin-bottom: 12px;">
                <strong style="font-size: 0.78rem; display: block; margin-bottom: 4px; color: var(--accent-warning);">
                  📋 필수 채점 기준 (Rubric)
                </strong>
                <ul style="padding-left: 18px; font-size: 0.75rem; color: var(--text-muted); line-height: 1.6;">
                  ${e.criteria.map(c => `<li>${c}</li>`).join('')}
                </ul>
              </div>

              <!-- Collapsible Model Answer -->
              <div style="display: flex; justify-content: flex-end;">
                <button class="btn btn-secondary btn-sm" data-toggle-answer="${e.id}">
                  모범 답안 및 상세 해설 열기 ▼
                </button>
              </div>

              <div id="answer-${e.id}" style="display: none; margin-top: 14px; border-top: 1px solid var(--border-color); padding-top: 12px;">
                <strong style="font-size: 0.85rem; color: var(--accent-success); display: block; margin-bottom: 8px;">
                  모범 답안 및 핵심 아키텍처 해설
                </strong>
                <div style="font-size: 0.82rem; line-height: 1.7; color: var(--text-secondary);">
                  ${renderMarkdown(e.modelAnswer)}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function bindEvents() {
    document.getElementById('subtab-glossary')?.addEventListener('click', () => {
      activeSubTab = 'glossary';
      render();
    });

    document.getElementById('subtab-quizzes')?.addEventListener('click', () => {
      activeSubTab = 'quizzes';
      render();
    });

    document.getElementById('subtab-essays')?.addEventListener('click', () => {
      activeSubTab = 'essays';
      render();
    });

    // Glossary Search Input
    const searchInput = document.getElementById('glossary-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        glossarySearchQuery = e.target.value;
        const containerArea = document.querySelector('.main-content #main-mount');
        render();
        // Restore focus and cursor position
        const reInput = document.getElementById('glossary-search');
        if (reInput) {
          reInput.focus();
          reInput.selectionStart = reInput.selectionEnd = reInput.value.length;
        }
      });
    }

    // Quiz Options Click
    container.querySelectorAll('#adv-quiz-options .quiz-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const selIdx = parseInt(opt.getAttribute('data-adv-idx'), 10);
        const quiz = ADVANCED_QUIZZES[activeQuizIdx];
        const isCorrect = selIdx === quiz.correctIndex;

        quizAnswers[activeQuizIdx] = { selected: selIdx, isCorrect };

        if (isCorrect) {
          appState.addXP(25, `단답형 퀴즈 ${activeQuizIdx + 1} 정답`);
        } else {
          appState.addWrongAnswer({
            id: `wa-${quiz.id}`,
            problemId: quiz.id,
            type: 'quiz',
            title: `[심화] ${quiz.title}`,
            question: quiz.question,
            userAnswer: quiz.options[selIdx],
            correctAnswer: quiz.options[quiz.correctIndex],
            explanation: quiz.explanation
          });
        }

        render();
      });
    });

    document.getElementById('btn-adv-prev')?.addEventListener('click', () => {
      if (activeQuizIdx > 0) {
        activeQuizIdx--;
        render();
      }
    });

    document.getElementById('btn-adv-next')?.addEventListener('click', () => {
      if (activeQuizIdx < ADVANCED_QUIZZES.length - 1) {
        activeQuizIdx++;
        render();
      }
    });

    // Essay Accordion toggle
    container.querySelectorAll('[data-toggle-answer]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-toggle-answer');
        const answerBox = document.getElementById(`answer-${id}`);
        if (answerBox) {
          const isHidden = answerBox.style.display === 'none';
          answerBox.style.display = isHidden ? 'block' : 'none';
          btn.innerText = isHidden ? '해설 접기 ▲' : '모범 답안 및 상세 해설 열기 ▼';
        }
      });
    });
  }

  render();
}

function renderMarkdown(text) {
  return text
    .replace(/```python([\s\S]*?)```/g, '<div class="code-sync-panel" style="margin: 8px 0; border-radius: 4px;"><pre style="margin: 0; color: #f4f4f5;">$1</pre></div>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--text-primary);">$1</strong>')
    .replace(/`([^`]+)`/g, '<code style="background: var(--bg-tertiary); padding: 1px 5px; border-radius: 3px; font-family: var(--font-mono); color: #60a5fa;">$1</code>')
    .replace(/\n/g, '<br/>');
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
