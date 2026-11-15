/**
 * Home Dashboard View
 * Clean progress tracking and direct entry into Python lessons and algorithms.
 */

import { appState } from '../core/state.js';
import { PYTHON_LESSONS } from '../data/pythonLessons.js';
import { ALGORITHMS } from '../data/algorithms.js';

export function renderDashboardView(container, onNavigate) {
  const state = appState.getState();
  const completedCount = state.completedLessons.length;
  const totalLessons = PYTHON_LESSONS.length;
  const progressPercent = Math.round((completedCount / totalLessons) * 100);

  // Recommended next lesson (first incomplete lesson)
  const nextLesson = PYTHON_LESSONS.find(l => !state.completedLessons.includes(l.id)) || PYTHON_LESSONS[0];

  container.innerHTML = `
    <div class="animate-fade-in">
      <!-- Overview Card -->
      <div class="card" style="padding: 20px; border-left: 3px solid var(--accent-primary);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <div>
            <h2 style="font-size: 1.25rem; margin-bottom: 4px;">파이썬 기초 & 알고리즘 완성</h2>
            <p class="text-sm text-secondary">
              취업 준비와 실무 코딩 테스트에 꼭 필요한 핵심 문법과 원리를 익힙니다.
            </p>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 1.3rem; font-weight: 800; color: #f97316;">${state.user.streak}일 연속</div>
            <div class="text-xs text-muted">학습 스트릭</div>
          </div>
        </div>

        <div style="margin-top: 14px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 6px;">
            <span class="text-secondary">기초 문법 진도율</span>
            <strong>${completedCount} / ${totalLessons} 단계 완료 (${progressPercent}%)</strong>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
          </div>
        </div>
      </div>

      <!-- Today's Lesson Recommendation -->
      <div class="card" id="dash-rec-lesson" style="cursor: pointer;">
        <div class="card-header">
          <span class="badge-tag blue">오늘 추천 학습</span>
          <span class="text-xs text-muted">${nextLesson.duration} 소요</span>
        </div>
        <h3 style="font-size: 1.05rem; margin-bottom: 4px;">${nextLesson.title}</h3>
        <p class="text-xs text-secondary" style="margin-bottom: 12px;">${nextLesson.summary}</p>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span class="text-xs" style="color: var(--accent-primary); font-weight: 600;">+${nextLesson.xpReward} XP 획득</span>
          <button class="btn btn-primary btn-sm">학습 시작하기 →</button>
        </div>
      </div>

      <!-- Quick Learning Paths Grid -->
      <h3 style="font-size: 1.05rem; margin: 20px 0 12px;">학습 영역</h3>
      <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
        <div class="card" id="path-learn" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h4 style="font-size: 0.95rem; margin-bottom: 2px;">단계별 문법 학습</h4>
            <p class="text-xs text-secondary">변수부터 함수까지 6단계 순차 커리큘럼 및 확인 문제</p>
          </div>
          <span class="text-xs text-muted">이동 →</span>
        </div>

        <div class="card" id="path-practice" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h4 style="font-size: 0.95rem; margin-bottom: 2px;">직접 코드 작성 & 즉시 피드백</h4>
            <p class="text-xs text-secondary">모바일 전용 툴바로 직접 타이핑하고 실시간 채점 및 힌트 확인</p>
          </div>
          <span class="text-xs text-muted">이동 →</span>
        </div>

        <div class="card" id="path-algo" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h4 style="font-size: 0.95rem; margin-bottom: 2px;">대표 알고리즘 시각화 (6종)</h4>
            <p class="text-xs text-secondary">버블·선택·삽입·퀵 정렬, 이진 탐색, 하노이의 탑 단계별 재생</p>
          </div>
          <span class="text-xs text-muted">이동 →</span>
        </div>

        <div class="card" id="path-guide" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-left: 3px solid var(--accent-primary);">
          <div>
            <h4 style="font-size: 0.95rem; margin-bottom: 2px;">심화 가이드 & 12대 핵심 용어사전</h4>
            <p class="text-xs text-secondary">인터프리터 스펙, 단답형 퀴즈 10문항, 기술면접 서술형 5문항 수록</p>
          </div>
          <span class="text-xs text-muted">이동 →</span>
        </div>

        <div class="card" id="path-review" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <h4 style="font-size: 0.95rem; margin-bottom: 2px;">오답 노트</h4>
              ${state.wrongAnswers.length > 0 ? `<span class="badge-tag" style="background: rgba(239, 68, 68, 0.15); color: #f87171;">${state.wrongAnswers.length}</span>` : ''}
            </div>
            <p class="text-xs text-secondary">틀렸던 문제와 퀴즈를 다시 풀어보며 취약점 보완</p>
          </div>
          <span class="text-xs text-muted">이동 →</span>
        </div>
      </div>
    </div>
  `;

  document.getElementById('dash-rec-lesson')?.addEventListener('click', () => onNavigate('learn', { lessonId: nextLesson.id }));
  document.getElementById('path-learn')?.addEventListener('click', () => onNavigate('learn'));
  document.getElementById('path-practice')?.addEventListener('click', () => onNavigate('practice'));
  document.getElementById('path-algo')?.addEventListener('click', () => onNavigate('algorithms'));
  document.getElementById('path-guide')?.addEventListener('click', () => onNavigate('guide'));
  document.getElementById('path-review')?.addEventListener('click', () => onNavigate('review'));
}
