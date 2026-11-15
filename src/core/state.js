/**
 * Central State Management
 * Clean state with NO dummy or pre-filled test data.
 */

const STORAGE_KEY = 'pycode_app_state_v3';

const DEFAULT_STATE = {
  user: {
    name: '학습자',
    email: '',
    isLoggedIn: false,
    level: 1,
    xp: 0,
    streak: 0,
    lastActiveDate: '',
  },
  completedLessons: [],
  unlockedLessons: ['py-1'],
  problemSubmissions: {},
  wrongAnswers: [],
  algorithmHistory: {},
  unlockedBadges: [],
  settings: {
    theme: 'dark',
    playbackSpeed: 1.0,
  }
};

class StateManager {
  constructor() {
    this.listeners = new Set();
    this.state = this.loadState();
    this.checkDailyStreak();
  }

  loadState() {
    if (typeof localStorage === 'undefined') return JSON.parse(JSON.stringify(DEFAULT_STATE));
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_STATE,
          ...parsed,
          user: { ...DEFAULT_STATE.user, ...parsed.user },
          settings: { ...DEFAULT_STATE.settings, ...parsed.settings }
        };
      }
    } catch (e) {
      console.warn('Failed to load state from localStorage:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  saveState() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save state:', e);
    }
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (err) {
        console.error('State listener error:', err);
      }
    }
  }

  getState() {
    return this.state;
  }

  addXP(amount, reason = '') {
    this.state.user.xp += amount;
    const newLevel = Math.floor(this.state.user.xp / 100) + 1;
    this.state.user.level = newLevel;

    if (this.state.user.level >= 2) this.unlockBadge('level_2');
    if (this.state.user.level >= 5) this.unlockBadge('level_5');

    this.saveState();
  }

  checkDailyStreak() {
    const today = new Date().toISOString().split('T')[0];
    const lastActive = this.state.user.lastActiveDate;

    if (!lastActive) {
      this.state.user.streak = 1;
      this.state.user.lastActiveDate = today;
      this.saveState();
      return;
    }

    if (lastActive === today) return;

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (lastActive === yesterday) {
      this.state.user.streak += 1;
    } else {
      this.state.user.streak = 1;
    }
    this.state.user.lastActiveDate = today;

    if (this.state.user.streak >= 3) this.unlockBadge('streak_3');
    if (this.state.user.streak >= 7) this.unlockBadge('streak_7');

    this.saveState();
  }

  completeLesson(lessonId) {
    if (!this.state.completedLessons.includes(lessonId)) {
      this.state.completedLessons.push(lessonId);
      this.addXP(25, '개념 학습 완료');
      this.unlockBadge('first_lesson');
    }
    this.saveState();
  }

  unlockLesson(lessonId) {
    if (!this.state.unlockedLessons.includes(lessonId)) {
      this.state.unlockedLessons.push(lessonId);
      this.saveState();
    }
  }

  recordSubmission(problemId, status, userCode) {
    const prev = this.state.problemSubmissions[problemId] || { attempts: 0 };
    this.state.problemSubmissions[problemId] = {
      status,
      userCode,
      attempts: prev.attempts + 1,
      lastSubmittedAt: new Date().toISOString()
    };

    if (status === 'passed') {
      this.addXP(30, '코드 연습 통과');
      this.unlockBadge('first_code');
      this.removeWrongAnswer(problemId);
    }
    this.saveState();
  }

  addWrongAnswer(entry) {
    const exists = this.state.wrongAnswers.some(w => w.id === entry.id || (w.problemId && w.problemId === entry.problemId));
    if (!exists) {
      this.state.wrongAnswers.unshift({
        ...entry,
        addedAt: new Date().toISOString()
      });
      this.saveState();
    }
  }

  removeWrongAnswer(idOrProblemId) {
    this.state.wrongAnswers = this.state.wrongAnswers.filter(
      w => w.id !== idOrProblemId && w.problemId !== idOrProblemId
    );
    this.saveState();
  }

  recordAlgorithmCompletion(algoId, preScore, postScore) {
    this.state.algorithmHistory[algoId] = {
      preScore,
      postScore,
      completedAt: new Date().toISOString()
    };
    this.addXP(40, `${algoId} 알고리즘 완료`);
    this.unlockBadge('first_algo');

    const completed = Object.keys(this.state.algorithmHistory);
    if (completed.includes('bubble_sort') && completed.includes('hanoi')) {
      this.unlockBadge('algo_explorer');
    }
    this.saveState();
  }

  unlockBadge(badgeId) {
    if (!this.state.unlockedBadges.includes(badgeId)) {
      this.state.unlockedBadges.push(badgeId);
      this.saveState();
    }
  }

  toggleTheme() {
    this.state.settings.theme = this.state.settings.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', this.state.settings.theme);
    this.saveState();
  }

  login(name, email) {
    this.state.user.name = name;
    this.state.user.email = email;
    this.state.user.isLoggedIn = true;
    this.saveState();
  }

  logout() {
    this.state.user.isLoggedIn = false;
    this.saveState();
  }

  resetAllData() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.saveState();
  }
}

export const appState = new StateManager();
