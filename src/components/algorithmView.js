/**
 * Algorithm Visualizer View
 * Pre-test, Step-by-Step Simulation (Array Bars & Hanoi Pegs),
 * Synchronized Python code line highlighting, and Post-test Before/After comparison.
 */

import { appState } from '../core/state.js';
import { ALGORITHMS, getAlgorithmById } from '../data/algorithms.js';

export function renderAlgorithmView(container, onNavigate, options = {}) {
  let currentAlgo = getAlgorithmById(options.algoId || 'bubble_sort');
  let currentStage = 'intro_pretest'; // 'intro_pretest' | 'visualizing' | 'posttest' | 'summary'
  let preTestScore = null;
  let postTestScore = null;

  let steps = [];
  let currentStepIndex = 0;
  let isPlaying = false;
  let playInterval = null;
  let speedMultiplier = 1.0;

  function initSteps() {
    if (currentAlgo.type === 'pegs') {
      steps = currentAlgo.generateSteps(currentAlgo.diskCount || 3);
    } else {
      steps = currentAlgo.generateSteps(currentAlgo.defaultData, currentAlgo.targetValue);
    }
    currentStepIndex = 0;
    stopPlayback();
  }

  function stopPlayback() {
    isPlaying = false;
    if (playInterval) {
      clearInterval(playInterval);
      playInterval = null;
    }
  }

  function startPlayback() {
    isPlaying = true;
    const intervalMs = Math.max(150, Math.round(900 / speedMultiplier));
    playInterval = setInterval(() => {
      if (currentStepIndex < steps.length - 1) {
        currentStepIndex++;
        updateVisualizerUI();
      } else {
        stopPlayback();
        updateVisualizerUI();
      }
    }, intervalMs);
  }

  function render() {
    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Algorithm Selector -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
          <div>
            <h3 style="font-size: 1.05rem;">대표 알고리즘 시각화</h3>
            <span class="text-xs text-muted">동작 원리를 눈으로 보며 단계별로 이해합니다.</span>
          </div>

          <div style="display: flex; gap: 6px; overflow-x: auto; max-width: 100%; padding-bottom: 4px;">
            ${ALGORITHMS.map(a => `
              <button class="btn btn-sm ${a.id === currentAlgo.id ? 'btn-primary' : 'btn-secondary'}" data-algo-id="${a.id}">
                ${a.name.split(' ')[0]}
              </button>
            `).join('')}
          </div>
        </div>

        ${currentStage === 'intro_pretest' ? renderIntroPretest() : ''}
        ${currentStage === 'visualizing' ? renderVisualizerStage() : ''}
        ${currentStage === 'posttest' ? renderPostTest() : ''}
        ${currentStage === 'summary' ? renderSummary() : ''}
      </div>
    `;

    bindEvents();
    if (currentStage === 'visualizing') {
      updateVisualizerUI();
    }
  }

  function renderIntroPretest() {
    return `
      <div class="card">
        <div class="card-header">
          <span class="badge-tag blue">${currentAlgo.category}</span>
          <span class="text-xs text-muted">${currentAlgo.difficulty}</span>
        </div>

        <h2 style="font-size: 1.2rem; margin-bottom: 6px;">${currentAlgo.name}</h2>
        <p class="text-xs text-secondary" style="margin-bottom: 12px;">${currentAlgo.summary}</p>

        <!-- Complexity info -->
        <div style="display: flex; gap: 8px; margin-bottom: 14px; font-size: 0.78rem;">
          <span class="badge-tag">실행 속도: ${currentAlgo.timeInfo}</span>
          <span class="badge-tag">메모리: ${currentAlgo.spaceInfo}</span>
        </div>

        <!-- Rules -->
        <div style="background: var(--bg-tertiary); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 16px;">
          <strong style="font-size: 0.85rem; display: block; margin-bottom: 6px;">핵심 동작 규칙</strong>
          <ul style="padding-left: 18px; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.6;">
            ${currentAlgo.rules.map(r => `<li>${r}</li>`).join('')}
          </ul>
        </div>

        <!-- Pre-test -->
        <div style="border-top: 1px solid var(--border-color); padding-top: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="font-size: 0.88rem;">사전 점검 문제</strong>
            <span class="text-xs text-muted">학습 전 이해도 확인</span>
          </div>

          <p style="font-size: 0.88rem; font-weight: 600; margin-bottom: 10px;">
            ${currentAlgo.preTest.question}
          </p>

          <div id="pretest-options">
            ${currentAlgo.preTest.options.map((opt, idx) => `
              <div class="quiz-option" data-pre-idx="${idx}">
                <span style="font-family: var(--font-mono); font-weight: 700; width: 18px;">${idx + 1}.</span>
                <span>${opt}</span>
              </div>
            `).join('')}
          </div>

          <div id="pretest-feedback"></div>
        </div>
      </div>
    `;
  }

  function renderVisualizerStage() {
    return `
      <div class="visualizer-wrapper">
        <div class="algo-meta-bar">
          <div style="display: flex; align-items: center; gap: 8px;">
            <strong style="font-size: 0.95rem;">${currentAlgo.name.split(' ')[0]}</strong>
            <span class="step-badge" id="step-badge">단계 1 / ${steps.length}</span>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="text-xs text-muted">속도:</span>
            <select class="speed-select" id="viz-speed">
              <option value="0.5">0.5x (천천히)</option>
              <option value="1.0" selected>1.0x (보통)</option>
              <option value="2.0">2.0x (빠르게)</option>
              <option value="4.0">4.0x (초고속)</option>
            </select>
          </div>
        </div>

        <div id="canvas-area">
          ${currentAlgo.type === 'pegs' ? '<div class="hanoi-stage" id="hanoi-stage"></div>' : '<div class="stage-canvas" id="bar-stage"></div>'}
        </div>

        <div class="step-commentary">
          <span class="step-badge">설명</span>
          <span id="commentary-text">준비 중...</span>
        </div>

        <div class="code-sync-panel">
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 4px;">동기화된 파이썬 코드</div>
          ${currentAlgo.codeLines.map((line, idx) => `
            <div class="code-sync-line" id="sync-line-${idx}">${escapeHtml(line)}</div>
          `).join('')}
        </div>

        <div class="viz-controls">
          <div class="viz-button-group">
            <button class="btn btn-secondary btn-sm" id="btn-reset">처음으로</button>
            <button class="btn btn-secondary btn-sm" id="btn-prev">이전</button>
            <button class="btn btn-primary btn-sm" id="btn-play">재생</button>
            <button class="btn btn-secondary btn-sm" id="btn-next">다음</button>
          </div>

          <button class="btn btn-success btn-sm" id="btn-goto-posttest">사후 문제 풀기 →</button>
        </div>
      </div>
    `;
  }

  function renderPostTest() {
    return `
      <div class="card">
        <div class="card-header">
          <span class="badge-tag green">사후 검증</span>
          <span class="text-xs text-muted">시각화 학습 후 이해도 확인</span>
        </div>

        <h2 style="font-size: 1.15rem; margin-bottom: 6px;">사후 확인 문제</h2>
        <p class="text-xs text-secondary" style="margin-bottom: 12px;">
          시각화로 직접 관찰한 원리를 바탕으로 아래 문제를 해결해보세요.
        </p>

        <p style="font-size: 0.9rem; font-weight: 600; margin-bottom: 10px;">
          ${currentAlgo.postTest.question}
        </p>

        <div id="posttest-options">
          ${currentAlgo.postTest.options.map((opt, idx) => `
            <div class="quiz-option" data-post-idx="${idx}">
              <span style="font-family: var(--font-mono); font-weight: 700; width: 18px;">${idx + 1}.</span>
              <span>${opt}</span>
            </div>
          `).join('')}
        </div>

        <div id="posttest-feedback"></div>
      </div>
    `;
  }

  function renderSummary() {
    return `
      <div class="card" style="text-align: center; padding: 28px 16px;">
        <h2 style="font-size: 1.25rem; margin-bottom: 6px;">${currentAlgo.name.split(' ')[0]} 학습 완료</h2>
        <p class="text-xs text-secondary" style="margin-bottom: 18px;">
          알고리즘 시각화와 사전/사후 점검을 모두 마쳤습니다.
        </p>

        <div style="background: var(--bg-tertiary); border-radius: var(--radius-sm); padding: 14px; max-width: 380px; margin: 0 auto 20px; text-align: left;">
          <strong style="font-size: 0.85rem; display: block; margin-bottom: 8px;">전후 정답 비교 (Before vs After)</strong>
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; padding: 6px 0; border-bottom: 1px solid var(--border-color);">
            <span>시각화 전 (사전 점검)</span>
            <strong>${preTestScore ? '정답' : '오답'}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; padding: 6px 0;">
            <span>시각화 후 (사후 점검)</span>
            <strong style="color: var(--accent-success);">${postTestScore ? '정답' : '오답'}</strong>
          </div>
        </div>

        <div style="display: flex; justify-content: center; gap: 8px;">
          <button class="btn btn-secondary btn-sm" id="btn-replay">다시 시각화 보기</button>
          <button class="btn btn-primary btn-sm" id="btn-next-algo">다음 알고리즘으로 이동 →</button>
        </div>
      </div>
    `;
  }

  function updateVisualizerUI() {
    const step = steps[currentStepIndex];
    if (!step) return;

    const badge = document.getElementById('step-badge');
    if (badge) badge.innerText = `단계 ${currentStepIndex + 1} / ${steps.length}`;

    const commentary = document.getElementById('commentary-text');
    if (commentary) commentary.innerText = step.message;

    document.querySelectorAll('.code-sync-line').forEach((line, idx) => {
      if (idx === step.activeLine) line.classList.add('active');
      else line.classList.remove('active');
    });

    if (currentAlgo.type === 'pegs') {
      const stage = document.getElementById('hanoi-stage');
      if (stage) {
        stage.innerHTML = ['기둥 A', '기둥 B', '기둥 C'].map((name, pIdx) => {
          const disks = (step.pegs && step.pegs[pIdx]) || [];
          return `
            <div class="hanoi-peg-col">
              <div class="hanoi-peg-pole"></div>
              <div class="hanoi-disk-stack">
                ${disks.map(d => `<div class="hanoi-disk disk-${d}">${d}</div>`).join('')}
              </div>
              <div class="hanoi-peg-base"></div>
              <div class="hanoi-peg-label">${name}</div>
            </div>
          `;
        }).join('');
      }
    } else {
      const stage = document.getElementById('bar-stage');
      if (stage) {
        const maxVal = Math.max(...step.array.map(item => item.val), 100);
        stage.innerHTML = step.array.map((item, idx) => {
          const heightPx = Math.max(26, Math.round((item.val / maxVal) * 150));
          return `
            <div class="viz-bar-wrapper">
              <span class="viz-bar-val">${item.val}</span>
              <div class="viz-bar ${item.state}" style="height: ${heightPx}px;"></div>
              <span class="viz-bar-idx">${idx}</span>
            </div>
          `;
        }).join('');
      }
    }

    const playBtn = document.getElementById('btn-play');
    if (playBtn) playBtn.innerText = isPlaying ? '일시정지' : '재생';
  }

  function bindEvents() {
    container.querySelectorAll('[data-algo-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        stopPlayback();
        currentAlgo = getAlgorithmById(btn.getAttribute('data-algo-id'));
        currentStage = 'intro_pretest';
        preTestScore = null;
        postTestScore = null;
        render();
      });
    });

    container.querySelectorAll('#pretest-options .quiz-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const idx = parseInt(opt.getAttribute('data-pre-idx'), 10);
        preTestScore = idx === currentAlgo.preTest.correctIndex;
        const feedback = document.getElementById('pretest-feedback');

        container.querySelectorAll('#pretest-options .quiz-option').forEach((el, oIdx) => {
          el.classList.remove('correct', 'wrong');
          if (oIdx === currentAlgo.preTest.correctIndex) el.classList.add('correct');
          else if (oIdx === idx && !preTestScore) el.classList.add('wrong');
        });

        feedback.innerHTML = `
          <div class="feedback-box ${preTestScore ? 'feedback-success' : 'feedback-warning'}">
            <strong>${preTestScore ? '정답입니다!' : '오답입니다.'}</strong>
            <p class="text-xs" style="margin-top: 4px;">이제 시각화에서 원소가 어떻게 자리 번호에 맞게 이동하는지 확인해봅시다.</p>
            <button class="btn btn-primary btn-sm" id="btn-start-viz" style="margin-top: 8px;">
              시각화 시뮬레이션 시작하기 →
            </button>
          </div>
        `;

        document.getElementById('btn-start-viz')?.addEventListener('click', () => {
          currentStage = 'visualizing';
          initSteps();
          render();
        });
      });
    });

    document.getElementById('btn-play')?.addEventListener('click', () => {
      if (isPlaying) {
        stopPlayback();
      } else {
        if (currentStepIndex >= steps.length - 1) currentStepIndex = 0;
        startPlayback();
      }
      updateVisualizerUI();
    });

    document.getElementById('btn-next')?.addEventListener('click', () => {
      stopPlayback();
      if (currentStepIndex < steps.length - 1) {
        currentStepIndex++;
        updateVisualizerUI();
      }
    });

    document.getElementById('btn-prev')?.addEventListener('click', () => {
      stopPlayback();
      if (currentStepIndex > 0) {
        currentStepIndex--;
        updateVisualizerUI();
      }
    });

    document.getElementById('btn-reset')?.addEventListener('click', () => {
      stopPlayback();
      currentStepIndex = 0;
      updateVisualizerUI();
    });

    document.getElementById('viz-speed')?.addEventListener('change', (e) => {
      speedMultiplier = parseFloat(e.target.value);
      if (isPlaying) {
        stopPlayback();
        startPlayback();
      }
    });

    document.getElementById('btn-goto-posttest')?.addEventListener('click', () => {
      stopPlayback();
      currentStage = 'posttest';
      render();
    });

    container.querySelectorAll('#posttest-options .quiz-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const idx = parseInt(opt.getAttribute('data-post-idx'), 10);
        postTestScore = idx === currentAlgo.postTest.correctIndex;
        const feedback = document.getElementById('posttest-feedback');

        container.querySelectorAll('#posttest-options .quiz-option').forEach((el, oIdx) => {
          el.classList.remove('correct', 'wrong');
          if (oIdx === currentAlgo.postTest.correctIndex) el.classList.add('correct');
          else if (oIdx === idx && !postTestScore) el.classList.add('wrong');
        });

        appState.recordAlgorithmCompletion(currentAlgo.id, preTestScore ? 1 : 0, postTestScore ? 1 : 0);

        feedback.innerHTML = `
          <div class="feedback-box ${postTestScore ? 'feedback-success' : 'feedback-warning'}">
            <strong>${postTestScore ? '정답입니다! (+40 XP)' : '아쉽지만 오답입니다.'}</strong>
            <p class="text-xs" style="margin-top: 4px;">${currentAlgo.postTest.explanation}</p>
            <button class="btn btn-primary btn-sm" id="btn-see-summary" style="margin-top: 8px;">
              학습 결과 및 전후 비교 보기 →
            </button>
          </div>
        `;

        document.getElementById('btn-see-summary')?.addEventListener('click', () => {
          currentStage = 'summary';
          render();
        });
      });
    });

    document.getElementById('btn-replay')?.addEventListener('click', () => {
      currentStage = 'visualizing';
      initSteps();
      render();
    });

    document.getElementById('btn-next-algo')?.addEventListener('click', () => {
      const curIdx = ALGORITHMS.findIndex(a => a.id === currentAlgo.id);
      currentAlgo = ALGORITHMS[(curIdx + 1) % ALGORITHMS.length];
      currentStage = 'intro_pretest';
      preTestScore = null;
      postTestScore = null;
      render();
    });
  }

  render();
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
