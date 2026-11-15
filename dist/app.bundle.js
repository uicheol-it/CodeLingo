(() => {
"use strict";

// ---- File: src/core/state.js ----
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

const appState = new StateManager();


// ---- File: src/core/pythonEngine.js ----
/**
 * In-browser Python Execution Engine
 * Safe sandbox with step limits, syntax analysis, and clear Korean feedback.
 */

class PythonEngine {
  constructor() {
    this.maxSteps = 5000;
  }

  checkSyntax(code) {
    const lines = code.split('\n');
    const errors = [];
    let openParens = 0;
    let openBrackets = 0;
    let openBraces = 0;

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const raw = lines[i];
      const trimmed = raw.trim();

      if (!trimmed || trimmed.startsWith('#')) continue;

      // Missing colon check
      if (/^(if|elif|else|for|while|def|class)\b/.test(trimmed)) {
        if (!trimmed.endsWith(':')) {
          errors.push({
            line: lineNum,
            type: '문법 오류 (SyntaxError)',
            message: `문장 끝에 쌍점(:)이 빠졌습니다. '${trimmed}:' 형태로 작성해야 합니다.`,
            suggestion: '파이썬에서는 if, for, while, def 문 끝에 쌍점(:)을 찍어야 그 아래 실행할 코드 구역이 시작됩니다.'
          });
        }
      }

      for (const char of trimmed) {
        if (char === '(') openParens++;
        else if (char === ')') openParens--;
        else if (char === '[') openBrackets++;
        else if (char === ']') openBrackets--;
        else if (char === '{') openBraces++;
        else if (char === '}') openBraces--;
      }
    }

    if (openParens !== 0) {
      errors.push({
        line: lines.length,
        type: '문법 오류 (SyntaxError)',
        message: '소괄호 ( ) 의 열고 닫는 짝이 맞지 않습니다.',
        suggestion: '열린 괄호가 모두 올바르게 닫혔는지 확인하세요.'
      });
    }

    if (openBrackets !== 0) {
      errors.push({
        line: lines.length,
        type: '문법 오류 (SyntaxError)',
        message: '대괄호 [ ] 의 짝이 맞지 않습니다.',
        suggestion: '리스트를 생성할 때 대괄호가 올바르게 닫혔는지 확인하세요.'
      });
    }

    return errors;
  }

  transpile(code) {
    const lines = code.split('\n');
    const jsLines = [];
    const indentStack = [0];

    jsLines.push(`
      const __logs__ = [];
      let __stepCount__ = 0;
      const __checkStep__ = () => {
        __stepCount__++;
        if (__stepCount__ > ${this.maxSteps}) {
          throw new Error('실행 시간 또는 반복 횟수 초과 (무한 반복 방지)');
        }
      };

      const print = (...args) => {
        const out = args.map(a => {
          if (a === null) return 'None';
          if (a === true) return 'True';
          if (a === false) return 'False';
          if (Array.isArray(a)) return '[' + a.map(x => (typeof x === 'string' ? "'" + x + "'" : x)).join(', ') + ']';
          if (typeof a === 'object') return JSON.stringify(a);
          return String(a);
        }).join(' ');
        __logs__.push(out);
      };

      const len = (x) => (x && typeof x.length === 'number') ? x.length : Object.keys(x || {}).length;
      const sum = (arr) => arr.reduce((acc, v) => acc + v, 0);
      const min = (...args) => Array.isArray(args[0]) ? Math.min(...args[0]) : Math.min(...args);
      const max = (...args) => Array.isArray(args[0]) ? Math.max(...args[0]) : Math.max(...args);
      const abs = (x) => Math.abs(x);
      const type = (x) => typeof x;
      const str = (x) => String(x);
      const int = (x) => parseInt(x, 10);
      const float = (x) => parseFloat(x);
      const range = (start, stop, step = 1) => {
        if (stop === undefined) { stop = start; start = 0; }
        const res = [];
        if (step > 0) {
          for (let i = start; i < stop; i += step) res.push(i);
        } else if (step < 0) {
          for (let i = start; i > stop; i += step) res.push(i);
        }
        return res;
      };
      const True = true;
      const False = false;
      const None = null;
    `);

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      if (!raw.trim() || raw.trim().startsWith('#')) continue;

      const indentMatch = raw.match(/^[ \t]*/);
      const indent = indentMatch ? indentMatch[0].length : 0;
      const content = raw.slice(indent);

      while (indent < indentStack[indentStack.length - 1]) {
        indentStack.pop();
        jsLines.push('}');
      }

      let converted = content;

      // f-string
      converted = converted.replace(/f(["'])(.*?)\1/g, (match, quote, strContent) => {
        const jsInterpolated = strContent.replace(/\{([^}]+)\}/g, '${$1}');
        return `\`${jsInterpolated}\``;
      });

      // Python keywords
      converted = converted.replace(/\band\b/g, '&&');
      converted = converted.replace(/\bor\b/g, '||');
      converted = converted.replace(/\bnot\b/g, '!');
      converted = converted.replace(/\bTrue\b/g, 'true');
      converted = converted.replace(/\bFalse\b/g, 'false');
      converted = converted.replace(/\bNone\b/g, 'null');
      converted = converted.replace(/\bpass\b/g, '/* pass */');

      // Control flow
      if (converted.startsWith('def ')) {
        const fnMatch = converted.match(/^def\s+([a-zA-Z0-9_]+)\s*\((.*?)\)\s*:/);
        if (fnMatch) {
          converted = `function ${fnMatch[1]}(${fnMatch[2]}) {`;
          indentStack.push(indent + 4);
        }
      } else if (converted.startsWith('if ')) {
        const cond = converted.replace(/^if\s+/, '').replace(/:$/, '').trim();
        converted = `if (${cond}) {`;
        indentStack.push(indent + 4);
      } else if (converted.startsWith('elif ')) {
        const cond = converted.replace(/^elif\s+/, '').replace(/:$/, '').trim();
        converted = `else if (${cond}) {`;
        indentStack.push(indent + 4);
      } else if (converted === 'else:') {
        converted = `else {`;
        indentStack.push(indent + 4);
      } else if (converted.startsWith('for ')) {
        const forMatch = converted.match(/^for\s+([a-zA-Z0-9_,\s]+)\s+in\s+(.*?)\s*:/);
        if (forMatch) {
          converted = `for (let ${forMatch[1].trim()} of ${forMatch[2].trim()}) { __checkStep__();`;
          indentStack.push(indent + 4);
        }
      } else if (converted.startsWith('while ')) {
        const cond = converted.replace(/^while\s+/, '').replace(/:$/, '').trim();
        converted = `while (${cond}) { __checkStep__();`;
        indentStack.push(indent + 4);
      } else if (converted.startsWith('return ')) {
        // keep return
      } else {
        const assignMatch = converted.match(/^([a-zA-Z0-9_]+)\s*(=|\+=|-=|\*=|\/=)\s*(.*)/);
        if (assignMatch && !converted.includes('function') && !converted.startsWith('let ') && !converted.startsWith('const ')) {
          converted = `if (typeof ${assignMatch[1]} === 'undefined') { var ${assignMatch[1]}; } ${assignMatch[1]} ${assignMatch[2]} ${assignMatch[3]};`;
        }
      }

      jsLines.push(converted);
    }

    while (indentStack.length > 1) {
      indentStack.pop();
      jsLines.push('}');
    }

    jsLines.push('return __logs__;');
    return jsLines.join('\n');
  }

  async run(code) {
    const startTime = performance.now();

    const syntaxErrors = this.checkSyntax(code);
    if (syntaxErrors.length > 0) {
      const err = syntaxErrors[0];
      return {
        status: 'error',
        errorType: err.type,
        line: err.line,
        message: err.message,
        suggestion: err.suggestion,
        logs: [],
        executionTimeMs: 0
      };
    }

    try {
      const jsCode = this.transpile(code);
      const runner = new Function(jsCode);
      const logs = runner();
      const executionTimeMs = Math.round(performance.now() - startTime);

      return {
        status: 'success',
        logs: logs || [],
        output: (logs || []).join('\n'),
        executionTimeMs
      };
    } catch (err) {
      const executionTimeMs = Math.round(performance.now() - startTime);
      let errorMsg = err.message || '실행 중 오류가 발생했습니다.';
      let suggestion = '변수 이름의 철자와 문법을 다시 점검해보세요.';

      if (errorMsg.includes('초과')) {
        suggestion = 'while문이나 for문에서 종료 조건이 만족되지 않았습니다. 반복 탈출 조건을 확인하세요.';
      } else if (errorMsg.includes('is not defined')) {
        const varName = errorMsg.split(' ')[0];
        suggestion = `변수 '${varName}'이(가) 정의되지 않았습니다. 먼저 값을 대입했는지 확인하세요.`;
      }

      return {
        status: 'error',
        errorType: '실행 오류 (RuntimeError)',
        message: errorMsg,
        suggestion,
        logs: [],
        executionTimeMs
      };
    }
  }
}

const pythonEngine = new PythonEngine();


// ---- File: src/data/badges.js ----
/**
 * Learning Achievement Badges
 */

const BADGES = [
  {
    id: 'first_lesson',
    title: '첫 개념 완료',
    description: '첫 번째 파이썬 개념 학습을 수료했습니다.'
  },
  {
    id: 'first_code',
    title: '첫 코드 성공',
    description: '코드 연습 문제를 스스로 해결하고 통과했습니다.'
  },
  {
    id: 'streak_3',
    title: '3일 연속 학습',
    description: '3일 연속 매일 코딩을 실천했습니다.'
  },
  {
    id: 'streak_7',
    title: '7일 연속 달성',
    description: '일주일 동안 매일 꾸준히 학습했습니다.'
  },
  {
    id: 'first_algo',
    title: '알고리즘 입문',
    description: '알고리즘 시각화와 사후 테스트를 완료했습니다.'
  },
  {
    id: 'algo_explorer',
    title: '알고리즘 정복',
    description: '버블 정렬과 하노이의 탑을 모두 마스터했습니다.'
  },
  {
    id: 'level_2',
    title: '레벨 2 달성',
    description: '학습 경험치 100XP를 돌파했습니다.'
  },
  {
    id: 'level_5',
    title: '레벨 5 달성',
    description: '학습 경험치 400XP를 돌파했습니다.'
  }
];

function getBadgeById(id) {
  return BADGES.find(b => b.id === id);
}


// ---- File: src/data/quizzes.js ----
/**
 * Practical Python Concept Quizzes
 */

const GENERAL_QUIZZES = [
  {
    id: 'quiz-1',
    category: '문법 이해',
    code: `x = 5\ny = 2\nprint(x ** y)`,
    question: '위 코드를 실행했을 때 출력되는 결과는 무엇일까요?',
    options: ['10', '25', '7', '2.5'],
    correctIndex: 1,
    explanation: '** 기호는 거듭제곱을 의미합니다. 5의 2제곱(5²)이므로 25가 출력됩니다.'
  },
  {
    id: 'quiz-2',
    category: '오류 찾기',
    code: `for i in range(5)\n    print(i)`,
    question: '위 코드에서 문법 오류(SyntaxError)가 발생하는 원인은?',
    options: [
      'range() 함수에 시작 번호가 없어서',
      'for 문 헤더 끝에 쌍점(:)이 빠져서',
      'print문 안에 따옴표가 없어서',
      'i 변수를 미리 만들지 않아서'
    ],
    correctIndex: 1,
    explanation: '파이썬의 for문 헤더 끝에는 반드시 쌍점(:)이 있어야 합니다: `for i in range(5):`'
  },
  {
    id: 'quiz-3',
    category: '자리 번호(인덱스)',
    code: `colors = ["빨강", "파랑", "노랑"]\nprint(colors[0])`,
    question: '위 코드의 출력 결과로 올바른 것은?',
    options: [
      '빨강',
      '파랑',
      '노랑',
      '오류 발생'
    ],
    correctIndex: 0,
    explanation: '파이썬의 인덱스(자리 번호)는 0번부터 시작하므로 colors[0]은 첫 번째 원소인 "빨강"입니다.'
  },
  {
    id: 'quiz-4',
    category: '알고리즘 상식',
    question: '정렬된 배열에서 원하는 숫자를 찾을 때 가장 빠른 탐색 방법은?',
    options: [
      '처음부터 하나씩 확인하는 순차 탐색',
      '가운데를 확인하며 절반씩 버려나가는 이진 탐색',
      '모든 숫자의 순서를 무작위로 섞기',
      '배열의 길이를 2배로 늘리기'
    ],
    correctIndex: 1,
    explanation: '이미 정렬되어 있다면 중간값을 기준으로 탐색 범위를 매번 절반씩 줄여나가는 이진 탐색이 압도적으로 빠릅니다.'
  }
];


// ---- File: src/data/pythonLessons.js ----
/**
 * Python Curriculum
 * Teaches real Python syntax while explaining concepts intuitively.
 * Example: "인덱스(Index)는 데이터가 위치한 자리 번호입니다."
 */

const PYTHON_LESSONS = [
  {
    id: 'py-1',
    order: 1,
    title: '변수와 자료형 (Variable & Types)',
    duration: '3분',
    xpReward: 25,
    summary: '데이터에 이름을 붙이는 변수와 4가지 기본 자료형을 배웁니다.',
    concept: `
### 1. 변수(Variable)란?
변수는 컴퓨터 메모리에 **데이터를 담아두는 이름표가 붙은 상자**입니다.
상자에 값을 넣을 때는 \`=\` 기호를 사용합니다.

\`\`\`python
score = 90
\`\`\`
위 코드는 "score라는 상자에 90이라는 값을 넣어라"라는 뜻입니다.

---

### 2. 4가지 기본 자료형 (Data Types)
파이썬은 상자에 담긴 값의 형태를 보고 자동으로 종류를 구분합니다.

1. **정수 (int)**: 소수점이 없는 딱 떨어지는 숫자 (\`10\`, \`-5\`, \`0\`)
2. **실수 (float)**: 소수점이 있는 숫자 (\`3.14\`, \`0.5\`)
3. **문자열 (str)**: 글자 데이터. 글자 앞뒤를 따옴표(\`"\` 또는 \`'\`)로 감싸야 컴퓨터가 텍스트로 인식합니다 (\`"파이썬"\`, \`'안녕하세요'\`)
4. **불리언 (bool)**: 조건이 맞는지 틀리는지 나타내는 **참과 거짓** (\`True\`, \`False\`)
    `,
    exampleCode: `# 1. 다양한 종류의 데이터를 변수에 저장하기
user_name = "민우"
level = 1
win_rate = 87.5
is_active = True

# 2. 화면에 출력하기
print("이름:", user_name)
print("레벨:", level)
print("승률(%):", win_rate)
print("활동 상태:", is_active)
`,
    exampleExplanation: '각 변수에 문자열, 정수, 실수, 참/거짓(불리언) 데이터가 저장되어 차례대로 출력됩니다.',
    checkQuestion: {
      question: '다음 중 파이썬에서 소수점이 없는 숫자(정수, int)에 해당하는 값은 무엇일까요?',
      options: [
        '"100" (따옴표로 감싼 값)',
        '3.14 (소수점이 있는 값)',
        '25 (소수점이 없는 값)',
        'True (참을 나타내는 값)'
      ],
      correctIndex: 2,
      explanation: '25는 소수점이 없는 정수(int)입니다. 따옴표가 있으면 문자열(str)이고, 3.14는 실수(float), True는 불리언(bool)입니다.'
    }
  },
  {
    id: 'py-2',
    order: 2,
    title: '연산자와 문자열 f-string',
    duration: '4분',
    xpReward: 25,
    summary: '사칙연산과 나머지 구하기, 글자 안에 변수를 쏙 넣는 f-string을 익힙니다.',
    concept: `
### 1. 자주 쓰는 계산 연산자
기본 덧셈(\`+\`), 뺄셈(\`-\`), 곱셈(\`*\`), 나눗셈(\`/\`) 외에 실무와 코딩 테스트에서 특히 중요한 두 가지가 있습니다:

- **몫 연산자 (\`//\`)**: 나눈 몫에서 정수 부분만 구합니다. (예: \`7 // 2\` ➔ \`3\`)
- **나머지 연산자 (\`%\`)**: 나누고 남은 나머지를 구합니다. (예: \`7 % 2\` ➔ \`1\`)
> **취업 팁**: 나머지 연산자(\`%\`)는 어떤 숫자가 **짝수인지 홀수인지(숫자 % 2 == 0)**, 혹은 **특정 수의 배수인지** 판별할 때 가장 많이 쓰입니다.

---

### 2. f-string: 문자열 안에 변수 넣기
문자열 앞에 \`f\`를 붙이고 중괄호 \`{변수}\`를 쓰면, 글자 사이에 변수 값을 깔끔하게 넣을 수 있습니다.
\`\`\`python
name = "지우"
score = 95
print(f"{name}님의 점수는 {score}점입니다.")
\`\`\`
    `,
    exampleCode: `candies = 14
people = 4

per_person = candies // people
remaining = candies % people

print(f"사탕 {candies}개를 {people}명에게 나누어 주면,")
print(f"1인당 {per_person}개씩 받고, 남은 사탕은 {remaining}개입니다.")
`,
    exampleExplanation: '14 // 4 = 3개씩 배분되고, 14 % 4 = 남은 사탕은 2개가 됩니다.',
    checkQuestion: {
      question: '식 `17 % 5`의 계산 결과로 올바른 것은 무엇일까요?',
      options: [
        '3.4',
        '3',
        '2',
        '0'
      ],
      correctIndex: 2,
      explanation: '17을 5로 나누면 몫은 3이고 나머지는 2가 남습니다. % 기호는 나머지를 구하는 연산자이므로 결과는 2입니다.'
    }
  },
  {
    id: 'py-3',
    order: 3,
    title: '조건문 if / else',
    duration: '5분',
    xpReward: 30,
    summary: '조건에 따라 서로 다른 코드를 실행하는 분기 처리와 들여쓰기 규칙을 배웁니다.',
    concept: `
### 1. 조건문(if)이란?
"만약 점수가 80점 이상이면 합격, 아니면 탈락"처럼 **상황에 따라 다른 길을 가도록 분기하는 신호등**입니다.

### 2. 문법 구조
\`\`\`python
if 조건:
    # 조건이 참(True)일 때 실행할 코드
else:
    # 조건이 거짓(False)일 때 실행할 코드
\`\`\`

### 3. 꼭 알아두어야 할 2가지 파이썬 규칙
1. **콜론(\`:\`)**: 조건 뒤에는 반드시 쌍점(\`:\`)을 찍어야 합니다. "조건이 끝났으니 이제 실행할 내용이 나온다"는 신호입니다.
2. **들여쓰기(Indentation)**: 파이썬은 다른 언어와 달리 중괄호\`{}\`를 쓰지 않고, **스페이스 4칸 들여쓰기(Tab)**로 코드 묶음을 구분합니다. 들여쓰기를 하지 않으면 오류가 납니다.
    `,
    exampleCode: `age = 20

if age >= 19:
    print("성인 요금이 적용됩니다.")
else:
    print("청소년 할인이 적용됩니다.")
`,
    exampleExplanation: 'age가 20이므로 age >= 19 조건이 참이 되어 "성인 요금이 적용됩니다."가 출력됩니다.',
    checkQuestion: {
      question: '파이썬에서 if문 아래에 실행할 코드 구역을 나타내기 위해 사용하는 문법은 무엇일까요?',
      options: [
        '중괄호 { }',
        '들여쓰기 (스페이스 4칸 또는 Tab)',
        '세미콜론 ;',
        'end 키워드'
      ],
      correctIndex: 1,
      explanation: '파이썬은 들여쓰기(Indentation) 자체가 문법 규칙입니다. 들여쓰기된 줄들이 if문에 속한 실행 구역이 됩니다.'
    }
  },
  {
    id: 'py-4',
    order: 4,
    title: '반복문 for와 range',
    duration: '5분',
    xpReward: 30,
    summary: '정해진 횟수만큼 깔끔하게 코드를 반복 실행하는 for문과 range() 도구를 익힙니다.',
    concept: `
### 1. for문이란?
동일하거나 비슷한 작업을 여러 번 반복할 때 쓰는 도구입니다.

### 2. 번호표를 순서대로 뽑아주는 range()
\`range()\`는 반복할 횟수만큼 숫자를 순서대로 공급하는 번호표 생성기입니다.
- \`range(5)\` ➔ \`0, 1, 2, 3, 4\` (0부터 시작하여 5개)
- \`range(1, 6)\` ➔ \`1, 2, 3, 4, 5\` (1부터 시작하여 6 직전까지)

> **주의**: \`range(1, 6)\`은 6을 포함하지 않고 6 직전인 5까지만 나옵니다.
    `,
    exampleCode: `# 1부터 5까지 더하기
total = 0

for num in range(1, 6):
    total = total + num
    print(f"현재 더한 숫자: {num}, 누적 합계: {total}")

print("최종 합계:", total)
`,
    exampleExplanation: 'num 변수에 1부터 5까지 차례로 대입되며 total에 누적되어 15가 됩니다.',
    checkQuestion: {
      question: '`for i in range(1, 4):` 에서 i에 차례대로 들어오는 숫자들은 무엇일까요?',
      options: [
        '1, 2, 3',
        '1, 2, 3, 4',
        '0, 1, 2, 3',
        '0, 1, 2'
      ],
      correctIndex: 0,
      explanation: 'range(시작, 끝)은 끝 번호 직전까지 생성하므로 range(1, 4)는 1, 2, 3이 됩니다.'
    }
  },
  {
    id: 'py-5',
    order: 5,
    title: '리스트와 자리 번호(인덱스)',
    duration: '6분',
    xpReward: 35,
    summary: '여러 데이터를 순서대로 모으는 리스트와 자리 번호(인덱스)의 개념을 마스터합니다.',
    concept: `
### 1. 리스트(List)란?
여러 개의 데이터를 하나의 바구니에 순서대로 담아두는 바구니입니다. 대괄호 \`[]\`를 씁니다.
\`\`\`python
scores = [90, 85, 77, 95]
\`\`\`

---

### 2. 인덱스(Index)는 '자리 번호'입니다!
리스트 안에 들어있는 각각의 값에 접근하려면 위치를 가리키는 번호표를 써야 합니다.
파이썬에서는 이 위치 번호를 **인덱스(Index)**라고 부릅니다.

> **가장 중요한 규칙**: 파이썬의 자리 번호는 **1번이 아니라 0번부터 시작**합니다!
- \`scores[0]\`: 첫 번째 자리의 값 (90)
- \`scores[1]\`: 두 번째 자리의 값 (85)
- \`scores[2]\`: 세 번째 자리의 값 (77)

---

### 3. 리스트에 자주 쓰는 기능
- **새 데이터 추가**: \`scores.append(100)\` (맨 뒤에 100 추가)
- **전체 개수 확인**: \`len(scores)\` (리스트 안에 든 데이터 개수)
    `,
    exampleCode: `fruits = ["사과", "바나나", "포도"]

# 0번(첫 번째) 과일 확인
print("첫 번째 자리(인덱스 0):", fruits[0])

# 맨 뒤에 새 과일 추가하기
fruits.append("딸기")
print("과일 전체 목록:", fruits)
print("전체 과일 개수:", len(fruits))
`,
    exampleExplanation: 'fruits[0]으로 첫 번째 값인 "사과"를 꺼내고, append로 "딸기"를 추가합니다.',
    checkQuestion: {
      question: '`colors = ["빨강", "초록", "파랑"]` 일 때, 두 번째 자리인 "초록"을 꺼내려면 어떻게 작성해야 할까요?',
      options: [
        'colors[1]',
        'colors[2]',
        'colors[0]',
        'colors["초록"]'
      ],
      correctIndex: 0,
      explanation: '파이썬의 자리 번호(인덱스)는 0번부터 시작하므로 첫 번째가 [0], 두 번째는 [1]입니다.'
    }
  },
  {
    id: 'py-6',
    order: 6,
    title: '함수 만들기 def와 return',
    duration: '6분',
    xpReward: 40,
    summary: '반복되는 계산을 묶어두고 재사용하는 나만의 기능 버튼(함수)을 만드는 방법을 배웁니다.',
    concept: `
### 1. 함수(Function)란?
자주 사용하는 계산이나 동작을 상자 안에 묶어두고, 필요할 때마다 이름으로 호출하는 **'나만의 전용 기능 버튼'**입니다.

### 2. 함수 문법 3요소
\`\`\`python
def 더하기(a, b):       # def: 함수 정의 시작
    result = a + b
    return result     # return: 계산한 결과물을 밖으로 돌려주기
\`\`\`

1. **\`def\` (Define)**: 함수를 새로 만들겠다는 선언 키워드
2. **매개변수 (Parameter)**: 함수가 일할 때 전달받는 재료값 (위 예시의 \`a\`, \`b\`)
3. **\`return\` (반환)**: 계산을 마친 결과물을 함수를 부른 곳으로 돌려주는 키워드
    `,
    exampleCode: `# 두 숫자를 곱하여 사각형 넓이를 계산하는 함수
def calculate_rectangle(width, height):
    area = width * height
    return area

# 함수 호출하여 결과 받기
box1 = calculate_rectangle(5, 4)
box2 = calculate_rectangle(10, 3)

print("첫 번째 사각형 넓이:", box1)
print("두 번째 사각형 넓이:", box2)
`,
    exampleExplanation: 'calculate_rectangle 함수에 가로와 세로 길이를 넘기면, 곱한 넓이를 return하여 결과가 출력됩니다.',
    checkQuestion: {
      question: '함수 안에서 계산한 최종 결과물을 함수 밖으로 전달하기 위해 사용하는 키워드는 무엇일까요?',
      options: [
        'send',
        'output',
        'return',
        'give'
      ],
      correctIndex: 2,
      explanation: '파이썬에서 함수의 결과값을 반환할 때는 return 키워드를 사용합니다.'
    }
  }
];


// ---- File: src/data/practiceProblems.js ----
/**
 * Beginner-friendly Coding Practice Problems
 * Progressive hints and clear validation patterns.
 */

const PRACTICE_PROBLEMS = [
  {
    id: 'prob-1',
    title: '변수로 환영 메시지 출력하기',
    level: '입문',
    description: `
변수 \`name\`에 본인의 이름이나 닉네임을 저장하고,
\`안녕하세요, <이름>님!\` 형태로 출력하는 코드를 작성하세요.
    `,
    starterCode: `# 아래에 name 변수를 만들고 출력해보세요\nname = "학생"\n\n`,
    expectedPattern: /안녕하세요,\s*.+님!/,
    sampleSolution: `name = "학생"\nprint(f"안녕하세요, {name}님!")`,
    hints: [
      'f-string을 사용하면 문자열 안에 변수를 쉽게 넣을 수 있습니다: f"안녕하세요, {name}님!"',
      'print() 함수 안에 만든 문자열을 전달하여 화면에 출력하세요.'
    ]
  },
  {
    id: 'prob-2',
    title: '짝수와 홀수 판별하기',
    level: '초급',
    description: `
변수 \`number = 8\`이 주어졌을 때,
이 숫자가 짝수이면 \`짝수입니다\`, 홀수이면 \`홀수입니다\`를 출력하는 조건문을 완성하세요.
    `,
    starterCode: `number = 8\n\n# if와 else를 사용하여 짝수/홀수를 판별하세요\n`,
    expectedPattern: /짝수입니다/,
    sampleSolution: `number = 8\nif number % 2 == 0:\n    print("짝수입니다")\nelse:\n    print("홀수입니다")`,
    hints: [
      '어떤 수를 2로 나눈 나머지(number % 2)가 0이면 짝수입니다.',
      'if number % 2 == 0: 뒤에 콜론(:)을 꼭 붙여주세요.',
      'if문과 else문 아래 실행할 문장은 들여쓰기를 해야 합니다.'
    ]
  },
  {
    id: 'prob-3',
    title: '1부터 10까지 모두 더하기',
    level: '초급',
    description: `
\`for\` 반복문과 \`range()\` 함수를 사용하여
1부터 10까지의 숫자를 모두 더한 합계를 구하고 출력하세요. (정답: 55)
    `,
    starterCode: `total = 0\n\n# for문으로 1부터 10까지 더해보세요\n\nprint("결과:", total)\n`,
    expectedPattern: /55/,
    sampleSolution: `total = 0\nfor i in range(1, 11):\n    total += i\nprint("결과:", total)`,
    hints: [
      '1부터 10까지 반복하려면 range(1, 11)을 사용해야 합니다.',
      'for i in range(1, 11): 내부에서 total = total + i 를 실행하세요.'
    ]
  },
  {
    id: 'prob-4',
    title: '리스트에서 최댓값 찾기',
    level: '중급',
    description: `
주어진 리스트 \`numbers = [14, 35, 7, 89, 28]\` 안에서
가장 큰 숫자를 찾아 출력하세요. (정답: 89)
    `,
    starterCode: `numbers = [14, 35, 7, 89, 28]\n\n# 가장 큰 숫자를 찾아 출력하세요\nmax_num = numbers[0]\n\n`,
    expectedPattern: /89/,
    sampleSolution: `numbers = [14, 35, 7, 89, 28]\nmax_num = numbers[0]\nfor num in numbers:\n    if num > max_num:\n        max_num = num\nprint("최댓값:", max_num)`,
    hints: [
      'for num in numbers: 로 리스트 안의 숫자를 하나씩 확인해보세요.',
      '현재 확인하는 num이 지금까지의 max_num보다 크면 max_num = num 으로 갱신합니다.'
    ]
  },
  {
    id: 'prob-5',
    title: '두 변수의 값 맞바꾸기 (Swap)',
    level: '초급',
    description: `
정렬 알고리즘의 가장 핵심 기초는 두 숫자의 자리를 맞바꾸는(Swap) 것입니다.
\`a = 10\`, \`b = 20\`이 있을 때 두 변수의 값을 서로 교환하여
\`a = 20, b = 10\` 형태로 출력하세요.
    `,
    starterCode: `a = 10\nb = 20\n\n# a와 b의 값을 맞바꾸세요\n\nprint(f"a = {a}, b = {b}")\n`,
    expectedPattern: /a\s*=\s*20,\s*b\s*=\s*10/,
    sampleSolution: `a = 10\nb = 20\na, b = b, a\nprint(f"a = {a}, b = {b}")`,
    hints: [
      '파이썬에서는 "a, b = b, a" 한 줄로 두 변수의 값을 깔끔하게 맞바꿀 수 있습니다.',
      '교환 후 print문으로 올바르게 바뀌었는지 확인하세요.'
    ]
  }
];


// ---- File: src/data/algorithms.js ----
/**
 * Algorithm Definitions & Step-by-Step Simulation Generators
 * Clear, intuitive metaphors and synchronized Python code highlighting.
 */

const ALGORITHMS = [
  {
    id: 'bubble_sort',
    name: '버블 정렬 (Bubble Sort)',
    category: '정렬',
    difficulty: '초급',
    timeInfo: '원소 10개 기준 약 45회 비교 (보통 속도)',
    spaceInfo: '추가 메모리 불필요 (O(1))',
    summary: '이웃한 두 숫자를 비교하여 더 큰 수를 뒤로 맞바꾸며 정렬하는 방식입니다.',
    description: `
물속에서 공기 방울(버블)이 뽀글뽀글 수면으로 올라오듯, **이웃한 두 숫자를 비교해서 더 큰 수를 뒤로 맞바꾸며(Swap)** 가장 큰 수를 맨 뒤로 밀어내는 가장 직관적인 정렬 방법입니다.
    `,
    rules: [
      '맨 앞자리(인덱스 0)부터 바로 오른쪽 이웃 숫자와 크기를 비교합니다.',
      '왼쪽 숫자가 오른쪽 숫자보다 더 크면 두 자리의 값을 맞바꿉니다.',
      '한 바퀴를 다 돌면 전체에서 가장 큰 숫자가 맨 뒷자리에 확정됩니다.',
      '확정된 맨 뒷자리를 제외하고 숫자 개수만큼 이 과정을 반복합니다.'
    ],
    codeLines: [
      'for i in range(len(arr) - 1):',
      '    for j in range(len(arr) - 1 - i):',
      '        if arr[j] > arr[j + 1]:',
      '            arr[j], arr[j + 1] = arr[j + 1], arr[j]',
      '    # i번째 회전 완료 (가장 큰 수 확정)'
    ],
    defaultData: [45, 12, 89, 34, 23],
    preTest: {
      question: '배열 [5, 3, 8, 2]에서 버블 정렬의 1회전(첫 번째 바퀴)이 끝났을 때 배열의 상태는?',
      options: [
        '[2, 3, 5, 8]',
        '[3, 5, 2, 8]',
        '[3, 2, 5, 8]',
        '[5, 3, 2, 8]'
      ],
      correctIndex: 1,
      explanation: '5와 3 비교 후 맞바꿈 [3, 5, 8, 2] -> 5와 8 비교 유지 -> 8과 2 비교 후 맞바꿈 [3, 5, 2, 8]. 가장 큰 수 8이 맨 뒤에 확정됩니다.'
    },
    postTest: {
      question: '버블 정렬에서 한 바퀴를 돌고 나면 확실하게 보장되는 사실은 무엇일까요?',
      options: [
        '모든 숫자가 정렬된다',
        '가장 큰 숫자가 맨 뒷자리에 확실하게 확정된다',
        '배열의 길이가 절반으로 줄어든다',
        '가장 작은 숫자가 맨 뒷자리로 간다'
      ],
      correctIndex: 1,
      explanation: '인접한 두 숫자를 계속 비교하며 큰 수를 뒤로 밀어내므로, 1회전이 끝나면 가장 큰 숫자가 맨 뒤에 확정됩니다.'
    },
    generateSteps: (initialArr) => {
      const steps = [];
      const arr = [...initialArr];
      const n = arr.length;

      steps.push({
        array: arr.map(v => ({ val: v, state: 'default' })),
        activeIndices: [],
        activeLine: 0,
        message: '버블 정렬을 시작합니다. 정렬되지 않은 원소들을 확인합니다.'
      });

      for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - 1 - i; j++) {
          steps.push({
            array: arr.map((v, idx) => ({
              val: v,
              state: (idx >= n - i) ? 'sorted' : (idx === j || idx === j + 1) ? 'comparing' : 'default'
            })),
            activeIndices: [j, j + 1],
            activeLine: 2,
            message: `자리 번호 ${j}번(${arr[j]})과 ${j + 1}번(${arr[j + 1]})의 크기를 비교합니다.`
          });

          if (arr[j] > arr[j + 1]) {
            const temp = arr[j];
            arr[j] = arr[j + 1];
            arr[j + 1] = temp;

            steps.push({
              array: arr.map((v, idx) => ({
                val: v,
                state: (idx >= n - i) ? 'sorted' : (idx === j || idx === j + 1) ? 'swapping' : 'default'
              })),
              activeIndices: [j, j + 1],
              activeLine: 3,
              message: `${temp}가 ${arr[j]}보다 더 크므로 두 숫자의 자리를 맞바꿉니다.`
            });
          } else {
            steps.push({
              array: arr.map((v, idx) => ({
                val: v,
                state: (idx >= n - i) ? 'sorted' : (idx === j || idx === j + 1) ? 'default' : 'default'
              })),
              activeIndices: [j, j + 1],
              activeLine: 2,
              message: `${arr[j]}이(가) ${arr[j + 1]}보다 작거나 같으므로 자리를 바꾸지 않고 유지합니다.`
            });
          }
        }

        steps.push({
          array: arr.map((v, idx) => ({
            val: v,
            state: (idx >= n - 1 - i) ? 'sorted' : 'default'
          })),
          activeIndices: [n - 1 - i],
          activeLine: 4,
          message: `${i + 1}회전 완료: 가장 큰 숫자 [${arr[n - 1 - i]}]이(가) 맨 뒷자리에 확정되었습니다.`
        });
      }

      steps.push({
        array: arr.map(v => ({ val: v, state: 'sorted' })),
        activeIndices: [],
        activeLine: 4,
        message: '모든 숫자가 크기 순서대로 정렬 완료되었습니다.'
      });

      return steps;
    }
  },
  {
    id: 'selection_sort',
    name: '선택 정렬 (Selection Sort)',
    category: '정렬',
    difficulty: '초급',
    timeInfo: '원소 10개 기준 약 45회 비교 (교환 횟수가 적음)',
    spaceInfo: '추가 메모리 불필요 (O(1))',
    summary: '남은 숫자 중 가장 작은 최솟값을 쏙 골라내어 맨 앞자리와 맞바꾸는 정렬입니다.',
    description: `
아직 정렬되지 않은 구간 전체를 훑어보면서 **가장 작은 최솟값**을 선택한 뒤, 맨 앞자리와 맞바꾸는 과정을 반복합니다.
    `,
    rules: [
      '아직 정렬되지 않은 구간에서 가장 작은 최솟값의 자리 번호를 찾습니다.',
      '최솟값을 찾으면 정렬되지 않은 구간의 맨 첫 번째 자리와 값을 맞바꿉니다.',
      '맨 앞자리는 정렬 완료 상태가 되고, 다음 자리부터 다시 최솟값을 탐색합니다.'
    ],
    codeLines: [
      'for i in range(len(arr)):',
      '    min_idx = i',
      '    for j in range(i + 1, len(arr)):',
      '        if arr[j] < arr[min_idx]: min_idx = j',
      '    arr[i], arr[min_idx] = arr[min_idx], arr[i]'
    ],
    defaultData: [64, 25, 12, 22, 11],
    preTest: {
      question: '선택 정렬에서 [29, 10, 14, 37, 13]의 1회전(첫 번째 최솟값 교환) 후 배열 상태는?',
      options: [
        '[10, 29, 14, 37, 13]',
        '[10, 13, 14, 29, 37]',
        '[14, 10, 29, 37, 13]',
        '[29, 10, 13, 14, 37]'
      ],
      correctIndex: 0,
      explanation: '전체에서 가장 작은 수인 10을 찾아 맨 앞자리 29와 맞바꾸므로 [10, 29, 14, 37, 13]이 됩니다.'
    },
    postTest: {
      question: '선택 정렬의 가장 큰 특징은 무엇일까요?',
      options: [
        '최솟값을 찾아 자리 번호(인덱스)와 1회전당 1번만 맞바꾼다',
        '인접한 모든 숫자를 매번 맞바꾼다',
        '데이터를 3개의 기둥으로 옮긴다',
        '원소 개수가 2배로 증가한다'
      ],
      correctIndex: 0,
      explanation: '선택 정렬은 최솟값을 찾은 후 1회전당 단 1번만 맞바꿈(Swap)을 수행합니다.'
    },
    generateSteps: (initialArr) => {
      const steps = [];
      const arr = [...initialArr];
      const n = arr.length;

      steps.push({
        array: arr.map(v => ({ val: v, state: 'default' })),
        activeIndices: [],
        activeLine: 0,
        message: '선택 정렬을 시작합니다.'
      });

      for (let i = 0; i < n; i++) {
        let minIdx = i;

        steps.push({
          array: arr.map((v, idx) => ({
            val: v,
            state: idx < i ? 'sorted' : idx === minIdx ? 'pivot' : 'default'
          })),
          activeIndices: [minIdx],
          activeLine: 1,
          message: `현재 자리 번호 ${i}번(${arr[i]})을 임시 최솟값으로 정합니다.`
        });

        for (let j = i + 1; j < n; j++) {
          steps.push({
            array: arr.map((v, idx) => ({
              val: v,
              state: idx < i ? 'sorted' : idx === minIdx ? 'pivot' : idx === j ? 'comparing' : 'default'
            })),
            activeIndices: [minIdx, j],
            activeLine: 3,
            message: `현재 최솟값 [${arr[minIdx]}]과 ${j}번째 숫자 [${arr[j]}]를 비교합니다.`
          });

          if (arr[j] < arr[minIdx]) {
            minIdx = j;
            steps.push({
              array: arr.map((v, idx) => ({
                val: v,
                state: idx < i ? 'sorted' : idx === minIdx ? 'pivot' : 'default'
              })),
              activeIndices: [minIdx],
              activeLine: 3,
              message: `더 작은 숫자 [${arr[minIdx]}]을 발견하여 새로운 최솟값으로 갱신합니다.`
            });
          }
        }

        if (minIdx !== i) {
          const temp = arr[i];
          arr[i] = arr[minIdx];
          arr[minIdx] = temp;

          steps.push({
            array: arr.map((v, idx) => ({
              val: v,
              state: idx < i ? 'sorted' : (idx === i || idx === minIdx) ? 'swapping' : 'default'
            })),
            activeIndices: [i, minIdx],
            activeLine: 4,
            message: `자리 번호 ${i}번과 최솟값 [${arr[i]}]의 자리를 서로 맞바꿉니다.`
          });
        }

        steps.push({
          array: arr.map((v, idx) => ({
            val: v,
            state: idx <= i ? 'sorted' : 'default'
          })),
          activeIndices: [i],
          activeLine: 4,
          message: `${i}번 자리에 숫자 [${arr[i]}]의 최종 위치가 확정되었습니다.`
        });
      }

      steps.push({
        array: arr.map(v => ({ val: v, state: 'sorted' })),
        activeIndices: [],
        activeLine: 4,
        message: '모든 숫자가 성공적으로 정렬되었습니다.'
      });

      return steps;
    }
  },
  {
    id: 'insertion_sort',
    name: '삽입 정렬 (Insertion Sort)',
    category: '정렬',
    difficulty: '초급',
    timeInfo: '이미 거의 정렬되어 있다면 매우 빠름 (최선 O(n))',
    spaceInfo: '추가 메모리 불필요 (O(1))',
    summary: '손안의 카드를 정리하듯 알맞은 자리를 찾아 쏙 끼워 넣는 정렬입니다.',
    description: `
두 번째 숫자부터 시작하여, 그 앞의 이미 정렬된 숫자들과 비교하면서 **자신이 들어갈 알맞은 자리를 찾아 끼워 넣는(Insert)** 방식입니다.
    `,
    rules: [
      '2번째 숫자(인덱스 1)부터 현재 집어넣을 대상으로 선택합니다.',
      '선택한 숫자를 앞의 정렬된 숫자들과 오른쪽에서 왼쪽으로 비교합니다.',
      '선택한 숫자보다 큰 숫자들은 오른쪽으로 한 칸씩 밀어냅니다.',
      '자기보다 작은 숫자를 만나면 바로 그 뒷자리에 쏙 삽입합니다.'
    ],
    codeLines: [
      'for i in range(1, len(arr)):',
      '    key = arr[i]',
      '    j = i - 1',
      '    while j >= 0 and arr[j] > key:',
      '        arr[j + 1] = arr[j]; j -= 1',
      '    arr[j + 1] = key'
    ],
    defaultData: [12, 11, 13, 5, 6],
    preTest: {
      question: '삽입 정렬이 실무에서 특히 가장 빠르게 끝나는 상황은 언제일까요?',
      options: [
        '배열이 완전히 역순으로 뒤집혀 있을 때',
        '배열이 이미 거의 정렬되어 있을 때',
        '모든 원소가 음수일 때',
        '데이터가 무작위로 섞여 있을 때'
      ],
      correctIndex: 1,
      explanation: '이미 거의 정렬되어 있으면 제자리 비교만으로 즉시 끝나므로 아주 빠른 속도로 완료됩니다.'
    },
    postTest: {
      question: '정렬된 [11, 12, 13] 앞에 새로운 숫자 5를 삽입할 때 5는 어디로 들어갈까요?',
      options: [
        '맨 뒤 (13 다음)',
        '11과 12 사이',
        '맨 앞자리 (11 이전)',
        '12와 13 사이'
      ],
      correctIndex: 2,
      explanation: '5는 13, 12, 11보다 모두 작으므로 모든 숫자를 뒤로 한 칸씩 밀어내고 맨 앞자리에 삽입됩니다.'
    },
    generateSteps: (initialArr) => {
      const steps = [];
      const arr = [...initialArr];
      const n = arr.length;

      steps.push({
        array: arr.map((v, idx) => ({ val: v, state: idx === 0 ? 'sorted' : 'default' })),
        activeIndices: [0],
        activeLine: 0,
        message: '첫 번째 숫자 [${arr[0]}]은 그 자체로 정렬된 것으로 봅니다.'
      });

      for (let i = 1; i < n; i++) {
        const key = arr[i];
        let j = i - 1;

        steps.push({
          array: arr.map((v, idx) => ({
            val: v,
            state: idx < i ? 'sorted' : idx === i ? 'pivot' : 'default'
          })),
          activeIndices: [i],
          activeLine: 1,
          message: `끼워 넣을 숫자 [${key}]를 선택합니다.`
        });

        while (j >= 0 && arr[j] > key) {
          steps.push({
            array: arr.map((v, idx) => ({
              val: v,
              state: idx === j ? 'comparing' : idx === j + 1 ? 'swapping' : idx < i ? 'sorted' : 'default'
            })),
            activeIndices: [j, j + 1],
            activeLine: 3,
            message: `[${arr[j]}]가 [${key}]보다 크므로 ${arr[j]}를 오른쪽으로 한 칸 밀어냅니다.`
          });

          arr[j + 1] = arr[j];
          j--;
        }

        arr[j + 1] = key;

        steps.push({
          array: arr.map((v, idx) => ({
            val: v,
            state: idx <= i ? 'sorted' : 'default'
          })),
          activeIndices: [j + 1],
          activeLine: 5,
          message: `숫자 [${key}]을(를) 알맞은 빈자리(인덱스 ${j + 1})에 삽입했습니다.`
        });
      }

      steps.push({
        array: arr.map(v => ({ val: v, state: 'sorted' })),
        activeIndices: [],
        activeLine: 5,
        message: '삽입 정렬이 완료되었습니다.'
      });

      return steps;
    }
  },
  {
    id: 'quick_sort',
    name: '퀵 정렬 (Quick Sort)',
    category: '정렬',
    difficulty: '중급',
    timeInfo: '데이터가 많아도 매우 빠름 (평균 O(n log n))',
    spaceInfo: '재귀 호출 메모리 (O(log n))',
    summary: '기준점(피벗)을 잡고 작은 값과 큰 값을 좌우로 분할하여 빠르게 정렬합니다.',
    description: `
하나의 기준점(피벗, Pivot)을 정한 뒤, **기준보다 작은 수는 왼쪽으로, 큰 수는 오른쪽으로 나누어** 절반씩 해결하는 대표적인 분할 정복 정렬입니다.
실무와 파이썬 내장 정렬의 핵심 기초가 됩니다.
    `,
    rules: [
      '배열에서 하나의 숫자를 기준점(피벗)으로 선택합니다.',
      '피벗보다 작은 숫자들은 왼쪽 구역으로, 큰 숫자들은 오른쪽 구역으로 이동시킵니다.',
      '피벗의 최종 위치가 확정되고, 좌우 두 묶음으로 나뉩니다.',
      '나뉜 좌우 묶음에 대해 같은 분할 과정을 재귀적으로 반복합니다.'
    ],
    codeLines: [
      'def quick_sort(arr, low, high):',
      '    if low < high:',
      '        pi = partition(arr, low, high)',
      '        quick_sort(arr, low, pi - 1)',
      '        quick_sort(arr, pi + 1, high)'
    ],
    defaultData: [38, 27, 43, 3, 9, 82, 10],
    preTest: {
      question: '퀵 정렬에서 기준점(피벗, Pivot)의 가장 핵심적인 역할은 무엇일까요?',
      options: [
        '배열을 작은 값 구역과 큰 값 구역으로 나누는 기준점 역할',
        '배열의 길이를 절반으로 줄여 삭제하는 역할',
        '모든 원소를 무작위로 섞는 역할',
        '원판을 3개의 기둥으로 옮기는 역할'
      ],
      correctIndex: 0,
      explanation: '피벗은 배열을 피벗보다 작은 구역과 큰 구역으로 나누는 분할의 기준점이 됩니다.'
    },
    postTest: {
      question: '퀵 정렬이 실무에서 널리 쓰일 만큼 빠른 이유는 무엇일까요?',
      options: [
        '기준점을 중심으로 문제를 매 단계 절반씩 나누어 해결하기 때문',
        '인접한 두 숫자만 한 번 비교하기 때문',
        '데이터를 비교하지 않고 바로 정답을 알기 때문',
        '추가 메모리를 무한히 쓰기 때문'
      ],
      correctIndex: 0,
      explanation: '피벗을 기준으로 매 단계 문제를 절반씩 나누어 정복(Divide & Conquer)하므로 매우 빠른 속도를 냅니다.'
    },
    generateSteps: (initialArr) => {
      const steps = [];
      const arr = [...initialArr];

      steps.push({
        array: arr.map(v => ({ val: v, state: 'default' })),
        activeIndices: [],
        activeLine: 0,
        message: '퀵 정렬을 시작합니다.'
      });

      function quickSortHelper(low, high) {
        if (low < high) {
          const pi = partition(low, high);
          quickSortHelper(low, pi - 1);
          quickSortHelper(pi + 1, high);
        } else if (low === high && low >= 0 && low < arr.length) {
          steps.push({
            array: arr.map((v, idx) => ({
              val: v,
              state: idx === low ? 'sorted' : 'default'
            })),
            activeIndices: [low],
            activeLine: 1,
            message: `원소 1개 구간 [인덱스 ${low}: ${arr[low]}] 정렬 확정.`
          });
        }
      }

      function partition(low, high) {
        const pivot = arr[high];
        let i = low - 1;

        steps.push({
          array: arr.map((v, idx) => ({
            val: v,
            state: idx === high ? 'pivot' : (idx >= low && idx < high) ? 'comparing' : 'default'
          })),
          activeIndices: [high],
          activeLine: 2,
          message: `구간 [${low}~${high}]에서 [${pivot}]을 기준점(피벗)으로 잡습니다.`
        });

        for (let j = low; j < high; j++) {
          steps.push({
            array: arr.map((v, idx) => ({
              val: v,
              state: idx === high ? 'pivot' : idx === j ? 'comparing' : (idx <= i) ? 'sorted' : 'default'
            })),
            activeIndices: [j, high],
            activeLine: 2,
            message: `숫자 [${arr[j]}]와 기준점 [${pivot}]을 비교합니다.`
          });

          if (arr[j] < pivot) {
            i++;
            const temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;

            steps.push({
              array: arr.map((v, idx) => ({
                val: v,
                state: idx === high ? 'pivot' : (idx === i || idx === j) ? 'swapping' : 'default'
              })),
              activeIndices: [i, j],
              activeLine: 2,
              message: `${arr[i]} < 피벗(${pivot}) 이므로 작은 값 구역(자리 번호 ${i})으로 맞바꿉니다.`
            });
          }
        }

        const temp = arr[i + 1];
        arr[i + 1] = arr[high];
        arr[high] = temp;

        steps.push({
          array: arr.map((v, idx) => ({
            val: v,
            state: idx === i + 1 ? 'sorted' : 'default'
          })),
          activeIndices: [i + 1],
          activeLine: 3,
          message: `기준점 [${arr[i + 1]}]의 최종 자리 번호(${i + 1}번)가 확정되었습니다!`
        });

        return i + 1;
      }

      quickSortHelper(0, arr.length - 1);

      steps.push({
        array: arr.map(v => ({ val: v, state: 'sorted' })),
        activeIndices: [],
        activeLine: 4,
        message: '퀵 정렬이 모두 완료되었습니다.'
      });

      return steps;
    }
  },
  {
    id: 'binary_search',
    name: '이진 탐색 (Binary Search)',
    category: '탐색',
    difficulty: '중급',
    timeInfo: '1,000개 데이터도 약 10번 만에 탐색 (초고속 O(log n))',
    spaceInfo: '추가 메모리 불필요 (O(1))',
    summary: '정렬된 데이터에서 가운데(Mid)를 확인하고 절반씩 버려가며 목표를 찾는 탐색입니다.',
    description: `
두꺼운 사전에서 단어를 찾을 때 처음부터 한 장씩 넘기지 않고 **가운데를 펼친 뒤 앞뒤 중 한쪽을 통째로 버리듯**, 탐색 범위를 매번 절반씩 줄여나가는 고속 탐색 방법입니다.
**단, 반드시 데이터가 미리 정렬되어 있어야 합니다.**
    `,
    rules: [
      '탐색 구간의 시작점(Left)과 끝점(Right)을 정합니다.',
      '정확히 가운데 자리 번호인 Mid = (Left + Right) // 2 를 구합니다.',
      '가운데 숫자가 찾으려는 목표값과 같으면 즉시 탐색 성공!',
      '목표값이 더 작으면 오른쪽 절반을 버리고, 목표값이 더 크면 왼쪽 절반을 버립니다.'
    ],
    codeLines: [
      'left = 0, right = len(arr) - 1',
      'while left <= right:',
      '    mid = (left + right) // 2',
      '    if arr[mid] == target: return mid',
      '    elif arr[mid] < target: left = mid + 1',
      '    else: right = mid - 1'
    ],
    defaultData: [3, 8, 15, 24, 38, 56, 72, 91],
    targetValue: 56,
    preTest: {
      question: '이진 탐색을 사용하기 위한 가장 중요한 필수 전제 조건은 무엇일까요?',
      options: [
        '데이터가 반드시 크기순으로 미리 정렬되어 있어야 한다',
        '데이터의 개수가 10개 미만이어야 한다',
        '모든 데이터가 짝수여야 한다',
        '원판을 3개만 사용해야 한다'
      ],
      correctIndex: 0,
      explanation: '정렬되어 있지 않으면 "가운데 값보다 크니까 오른쪽 절반에 있다"는 판단을 내릴 수 없기 때문입니다.'
    },
    postTest: {
      question: '데이터 1,000개가 정렬되어 있을 때 이진 탐색은 최대 몇 번의 비교로 목표값을 찾을 수 있을까요?',
      options: [
        '약 1,000번',
        '약 500번',
        '약 10번 (절반씩 10번 나누면 1이 됨)',
        '단 1번'
      ],
      correctIndex: 2,
      explanation: '매번 절반씩 줄어들므로 2의 10제곱이 1024가 되어, 최대 약 10번 만에 탐색이 끝납니다.'
    },
    generateSteps: (initialArr, target = 56) => {
      const steps = [];
      const arr = [...initialArr].sort((a, b) => a - b);
      let left = 0;
      let right = arr.length - 1;
      let found = false;

      steps.push({
        array: arr.map(v => ({ val: v, state: 'default' })),
        activeIndices: [left, right],
        activeLine: 0,
        message: `목표 숫자 [${target}]을 찾기 위해 이진 탐색을 시작합니다. (탐색 구간: 0번~${right}번)`
      });

      while (left <= right) {
        const mid = Math.floor((left + right) / 2);

        steps.push({
          array: arr.map((v, idx) => ({
            val: v,
            state: idx === mid ? 'pivot' : (idx >= left && idx <= right) ? 'comparing' : 'default'
          })),
          activeIndices: [left, mid, right],
          activeLine: 2,
          message: `가운데 자리 번호(인덱스 ${mid}, 값: ${arr[mid]})를 먼저 확인합니다.`
        });

        if (arr[mid] === target) {
          found = true;
          steps.push({
            array: arr.map((v, idx) => ({
              val: v,
              state: idx === mid ? 'found' : 'default'
            })),
            activeIndices: [mid],
            activeLine: 3,
            message: `찾았다! 목표값 [${target}]을 자리 번호 ${mid}번에서 발견했습니다.`
          });
          break;
        } else if (arr[mid] < target) {
          steps.push({
            array: arr.map((v, idx) => ({
              val: v,
              state: idx < mid + 1 ? 'default' : (idx <= right) ? 'comparing' : 'default'
            })),
            activeIndices: [mid + 1, right],
            activeLine: 4,
            message: `${arr[mid]} < ${target} 이므로 왼쪽 절반을 버리고 오른쪽 구간으로 좁힙니다.`
          });
          left = mid + 1;
        } else {
          steps.push({
            array: arr.map((v, idx) => ({
              val: v,
              state: idx > mid - 1 ? 'default' : (idx >= left) ? 'comparing' : 'default'
            })),
            activeIndices: [left, mid - 1],
            activeLine: 5,
            message: `${arr[mid]} > ${target} 이므로 오른쪽 절반을 버리고 왼쪽 구간으로 좁힙니다.`
          });
          right = mid - 1;
        }
      }

      return steps;
    }
  },
  {
    id: 'hanoi',
    name: '하노이의 탑 (Tower of Hanoi)',
    category: '재귀 퍼즐',
    difficulty: '중급',
    type: 'pegs',
    timeInfo: '원판 3개 기준 총 7번 이동 (2ⁿ - 1회)',
    spaceInfo: '재귀 호출 스택 (O(n))',
    summary: '크기 규칙을 지키며 원판을 세 기둥 사이로 옮기는 대표적인 재귀(Recursion) 퍼즐입니다.',
    description: `
작은 원판 위에 더 큰 원판을 올려놓을 수 없다는 규칙에 따라, 기둥 A에 있는 원판들을 기둥 C로 전부 옮기는 고전 퍼즐입니다.
**재귀(함수가 자기 자신을 다시 호출하여 큰 문제를 쪼개는 것)**를 눈으로 이해하는 데 가장 좋습니다.
    `,
    rules: [
      '한 번에 하나의 원판만 다른 기둥으로 옮길 수 있습니다.',
      '각 기둥의 맨 위에 있는 원판만 들어올릴 수 있습니다.',
      '절대로 작은 원판 위에 더 큰 원판을 얹을 수 없습니다.',
      '원판 3개를 옮기기 위한 최소 이동 횟수는 7번(2³ - 1)입니다.'
    ],
    codeLines: [
      'def hanoi(n, start, target, aux):',
      '    if n == 1:',
      '        move_disk(start, target); return',
      '    hanoi(n - 1, start, aux, target)',
      '    move_disk(start, target)',
      '    hanoi(n - 1, aux, target, start)'
    ],
    diskCount: 3,
    preTest: {
      question: '원판 3개짜리 하노이의 탑을 규칙에 맞게 모두 옮기기 위한 최소 이동 횟수는?',
      options: [
        '3번',
        '5번',
        '7번 (2³ - 1)',
        '9번'
      ],
      correctIndex: 2,
      explanation: '원판 n개의 최소 이동 횟수 공식은 2ⁿ - 1 입니다. 3개일 때는 2³ - 1 = 7번입니다.'
    },
    postTest: {
      question: '하노이의 탑에서 n개의 원판을 목표 기둥으로 옮길 때 사용하는 핵심적인 3단계 논리는?',
      options: [
        '위쪽 n-1개를 보조 기둥으로 치워두고 -> 가장 큰 원판을 목표로 -> n-1개를 다시 목표 기둥으로',
        '모든 원판을 한 번에 들어올린다',
        '양 끝의 원판을 맞바꾼다',
        '가장 큰 원판을 가장 먼저 옮긴다'
      ],
      correctIndex: 0,
      explanation: '가장 큰 원판을 맨 아래에 깔기 위해 위의 n-1개를 보조 기둥으로 비켜두고, 가장 큰 원판을 옮긴 뒤, 다시 n-1개를 그 위에 얹는 방식입니다.'
    },
    generateSteps: (diskCount = 3) => {
      const steps = [];
      const pegs = [
        Array.from({ length: diskCount }, (_, i) => diskCount - i),
        [],
        []
      ];

      steps.push({
        pegs: [pegs[0].slice(), pegs[1].slice(), pegs[2].slice()],
        activeLine: 0,
        message: `하노이의 탑 시작! 기둥 A에 원판 ${diskCount}개가 있습니다. (최소 이동 횟수: ${Math.pow(2, diskCount) - 1}회)`
      });

      const pegNames = ['기둥 A', '기둥 B', '기둥 C'];

      function solveHanoi(n, from, to, aux) {
        if (n === 1) {
          const disk = pegs[from].pop();
          pegs[to].push(disk);
          steps.push({
            pegs: [pegs[0].slice(), pegs[1].slice(), pegs[2].slice()],
            from,
            to,
            disk,
            activeLine: 2,
            message: `[원판 ${disk}]을(를) ${pegNames[from]}에서 ${pegNames[to]}로 이동합니다.`
          });
          return;
        }

        solveHanoi(n - 1, from, aux, to);

        const disk = pegs[from].pop();
        pegs[to].push(disk);
        steps.push({
          pegs: [pegs[0].slice(), pegs[1].slice(), pegs[2].slice()],
          from,
          to,
          disk,
          activeLine: 4,
          message: `가장 큰 [원판 ${disk}]을(를) ${pegNames[from]}에서 ${pegNames[to]}로 이동합니다.`
        });

        solveHanoi(n - 1, aux, to, from);
      }

      solveHanoi(diskCount, 0, 2, 1);

      steps.push({
        pegs: [pegs[0].slice(), pegs[1].slice(), pegs[2].slice()],
        activeLine: 5,
        message: '모든 원판이 기둥 C로 성공적으로 이동 완료되었습니다.'
      });

      return steps;
    }
  }
];

function getAlgorithmById(id) {
  return ALGORITHMS.find(a => a.id === id) || ALGORITHMS[0];
}


// ---- File: src/data/advancedGuide.js ----
/**
 * Advanced Python Guide Data: 12 Glossary Terms, 10 Quizzes, and 5 Essay Questions
 * Sourced directly from official Python language specifications and reference guidelines.
 */

const GLOSSARY_TERMS = [
  {
    id: 'term-1',
    term: '반복 가능 객체',
    eng: 'Iterable',
    category: '제어 흐름 & 자료구조',
    summary: 'for 루프나 sum(), list() 등의 입력 대상이 될 수 있는 객체입니다.',
    description: '순차적으로 요소를 하나씩 꺼내어 공급할 수 있는 객체입니다. 리스트, 튜플, 문자열뿐만 아니라 range()처럼 요소를 요청받을 때마다 순서대로 계산하여 제공하는 객체도 모두 반복 가능 객체에 해당합니다. 공급이 모두 끝나면 순회가 정상 종료됩니다.',
    example: 'for x in range(3): print(x)  # 0, 1, 2 순차 공급'
  },
  {
    id: 'term-2',
    term: '문서화 문자열',
    eng: 'Docstring',
    category: '함수 & OOP',
    summary: '모듈, 클래스, 함수 정의의 첫머리에 작성하는 공식 설명 문자열입니다.',
    description: '객체의 목적과 사용법을 설명하기 위해 세 따옴표("""...""")로 작성하는 문자열 리터럴입니다. 파이썬 파서에 의해 정리되어 런타임에 __doc__ 속성으로 누구나 조회할 수 있습니다.',
    example: 'def add(a, b):\n    """두 수의 합을 계산하여 반환합니다."""\n    return a + b'
  },
  {
    id: 'term-3',
    term: '위치 전용 파라미터',
    eng: 'Positional-Only Parameter',
    category: '함수형 패턴',
    summary: '함수 호출 시 키워드(이름=값)로 전달할 수 없고 오직 순서(위치)로만 넘겨야 하는 매개변수입니다.',
    description: '함수 정의 시 슬래시(/) 기호 왼쪽에 선언된 매개변수들입니다. 매개변수 이름을 나중에 변경하더라도 호출자의 코드가 깨지지 않도록 라이브러리 API의 안정성을 지키기 위해 사용됩니다.',
    example: 'def func(x, y, /):\n    return x + y\n# func(1, 2)는 성공, func(x=1, y=2)는 TypeError 발생'
  },
  {
    id: 'term-4',
    term: '키워드 전용 파라미터',
    eng: 'Keyword-Only Parameter',
    category: '함수형 패턴',
    summary: '함수 호출 시 위치로 넘길 수 없고 반드시 이름(key=value)을 명시해야 하는 매개변수입니다.',
    description: '함수 정의 시 별표(*) 기호 오른쪽에 선언된 매개변수들입니다. 옵션 값의 전달 의도를 호출 코드에서 명확히 드러내도록 강제할 때 유용합니다.',
    example: 'def connect(host, *, port=8080):\n    pass\n# connect("localhost", port=8080) 형태로만 호출 가능'
  },
  {
    id: 'term-5',
    term: '단락 평가',
    eng: 'Short-Circuit Evaluation',
    category: '제어 흐름',
    summary: '결과가 이미 확정되었을 때 뒷부분의 연산을 수행하지 않고 즉시 중단하는 평가 방식입니다.',
    description: 'and 연산에서 앞쪽이 False이면 뒤쪽은 확인하지 않고 즉시 종료되며, or 연산에서 앞쪽이 True이면 뒤쪽을 건너뜁니다. 파이썬에서는 단순 True/False뿐 아니라 마지막으로 평가된 실제 객체 값을 그대로 반환합니다.',
    example: 'result = "" or "기본값"  # result에는 "기본값"이 저장됨'
  },
  {
    id: 'term-6',
    term: '시퀀스 언패킹',
    eng: 'Sequence Unpacking',
    category: '자료구조',
    summary: '튜플이나 리스트에 묶여 있는 여러 요소를 좌변의 개별 변수들에 한 번에 분배하여 담는 기능입니다.',
    description: '하나의 시퀀스 객체에 담긴 데이터들을 요소 개수에 맞게 여러 변수로 깔끔하게 풀어 헤쳐 할당합니다.',
    example: 'point = (10, 20)\nx, y = point  # x는 10, y는 20'
  },
  {
    id: 'term-7',
    term: '네임스페이스',
    eng: 'Namespace',
    category: '객체지향 & 범위',
    summary: '변수나 함수의 이름을 실제 메모리 속 객체에 연결해두는 이름 사전입니다.',
    description: '파이썬에서는 대부분 딕셔너리 형태로 구현되어 있으며, 내장(Built-in), 모듈 전체(Global), 함수 내부(Local)마다 각각 독자적인 이름 공간을 가지고 있어 이름 충돌을 방지합니다.',
    example: 'print(locals())  # 현재 지역 네임스페이스 확인'
  },
  {
    id: 'term-8',
    term: '스코프',
    eng: 'Scope',
    category: '객체지향 & 범위',
    summary: '코드 안에서 특정 변수 이름을 접두사 없이 바로 참조할 수 있는 유효 영역입니다.',
    description: '파이썬 인터프리터는 변수를 찾을 때 LEGB(Local -> Enclosing -> Global -> Built-in) 순서로 안쪽에서 바깥쪽으로 순차 탐색합니다.',
    example: '지역(Local)에 없으면 바깥 함수(Enclosing), 모듈 전역(Global), 내장(Built-in) 순으로 탐색'
  },
  {
    id: 'term-9',
    term: '이름 맹글링',
    eng: 'Name Mangling',
    category: '객체지향 & 범위',
    summary: '클래스 속성 이름 앞에 밑줄 2개를 붙여 상속 시 자식 클래스와의 이름 충돌을 방지하는 변환 기법입니다.',
    description: '__name 형태로 선언하면 파이썬 파서가 이를 _ClassName__name 형태로 텍스트를 자동 치환하여 부모의 내부 변수를 자식의 오버라이드로부터 보호합니다.',
    example: 'class A:\n    def __init__(self): self.__secret = 42\n# 내부적으로 _A__secret 으로 변환됨'
  },
  {
    id: 'term-10',
    term: '제너레이터',
    eng: 'Generator',
    category: '함수형 패턴',
    summary: 'yield 문을 사용하여 실행 상태를 유지한 채 값을 순차적으로 생성하는 메모리 절약형 이터레이터입니다.',
    description: '일반 함수는 return을 만나면 스택과 지역 변수가 사라지지만, 제너레이터는 yield를 만나는 순간의 상태를 동결 보존했다가 다음 요청 시 그 지점부터 다시 실행됩니다. 공급이 끝나면 StopIteration 예외를 발생시킵니다.',
    example: 'def count():\n    yield 1\n    yield 2'
  },
  {
    id: 'term-11',
    term: '와일드카드 패턴',
    eng: 'Wildcard Pattern (_)',
    category: '제어 흐름',
    summary: 'match 문에서 어떠한 대상과도 항상 일치하는 기본 fallback 처리용 밑줄(_) 패턴입니다.',
    description: '구조적 패턴 매칭(match...case) 구문에서 case _: 형태로 맨 마지막에 위치하여, 앞선 모든 패턴에 해당하지 않는 나머지 모든 경우를 안전하게 받아냅니다.',
    example: 'match command:\n    case "go": pass\n    case _: print("알 수 없는 명령")'
  },
  {
    id: 'term-12',
    term: '데이터클래스',
    eng: 'Dataclass',
    category: '객체지향 & 범위',
    summary: '@dataclass 데코레이터를 붙여 생성자(__init__) 등의 반복 코드를 자동으로 만들어주는 간결한 클래스입니다.',
    description: '단순히 데이터를 묶어 저장하는 용도의 클래스를 정의할 때 보일러플레이트 코드를 줄여주는 표준 라이브러리 기능입니다.',
    example: 'from dataclasses import dataclass\n@dataclass\nclass Point:\n    x: int\n    y: int'
  }
];

const ADVANCED_QUIZZES = [
  {
    id: 'adv-q1',
    title: 'if...elif 와 match 패턴 매칭의 차이',
    question: '파이썬 3.10의 match 문이 기존 if...elif 구조와 구별되는 가장 핵심적인 기능적 차이점은 무엇인가요?',
    options: [
      '단순 값 비교를 넘어 자료구조의 형태 분석과 구조 분해(Destructuring) 및 변수 바인딩을 동시 수행한다.',
      'while 루프를 자동으로 생성하여 코드를 더 빠르게 실행한다.',
      '변수의 자료형을 C++ 수준의 정적 타입으로 영구 고정한다.',
      '전역 변수를 자동으로 삭제하여 메모리를 비운다.'
    ],
    correctIndex: 0,
    explanation: 'match 문은 대상 객체의 형태를 검사하고, 시퀀스나 클래스 내부 요소를 분해(Destructuring)하여 변수에 직접 바인딩하는 구조적 패턴 매칭을 제공합니다.'
  },
  {
    id: 'adv-q2',
    title: 'range() 객체의 메모리 효율성과 개념',
    question: 'range(1000000)이 100만 개의 리스트를 즉시 만들지 않고 극단적인 메모리 절약을 달성할 수 있는 이유와, 이러한 객체를 일컫는 핵심 용어는?',
    options: [
      '모든 요소를 하드디스크에 임시 저장하기 때문 (Buffer 객체)',
      '수열의 규칙(시작, 끝, 간격)만 보관하고 순회 시점에 계산하여 공급하기 때문 (반복 가능 객체, Iterable)',
      'C언어 포인터를 사용하여 실제 0바이트만 점유하기 때문 (Pointer 객체)',
      '변수를 문자열로 압축하여 저장하기 때문 (String 객체)'
    ],
    correctIndex: 1,
    explanation: 'range 객체는 100만 개의 요소를 힙에 미리 할당하지 않고, start/stop/step 정보만 유지하면서 순회 시점에 하나씩 계산해 공급하는 대표적인 반복 가능 객체(Iterable)입니다.'
  },
  {
    id: 'adv-q3',
    title: '루프(for/while) 뒤 else 절의 실행 조건',
    question: '파이썬의 for 또는 while 루프 뒤에 붙은 else 블록이 실행되는 구체적인 조건은 무엇인가요?',
    options: [
      '루프 내부에서 break 문이 실행되어 루프를 강제 탈출했을 때',
      '루프 조건식이 참(True)인 동안 매 반복마다 1번씩',
      '루프 본문 내부에서 break 문을 만나지 않고 정상 종료되었을 때',
      '루프 도중 예외(Exception)가 발생하여 중단되었을 때'
    ],
    correctIndex: 2,
    explanation: '루프의 else 절은 루프가 break로 중단되지 않고 모든 이터러블을 완주하거나 조건식이 거짓이 되어 정상 종료되었을 때만 실행됩니다.'
  },
  {
    id: 'adv-q4',
    title: '특수 파라미터 구분자 (/ 와 *)의 역할',
    question: '함수 정의에서 특정 인자를 오직 위치(Positional)로만 넘기도록 강제하거나, 키워드(key=val)로만 넘기도록 강제하는 특수 기호는?',
    options: [
      '/ 왼쪽은 위치 전용(Positional-Only), * 오른쪽은 키워드 전용(Keyword-Only)',
      '* 왼쪽은 위치 전용, / 오른쪽은 키워드 전용',
      '# 기호와 $ 기호',
      ': 기호와 ; 기호'
    ],
    correctIndex: 0,
    explanation: '슬래시(/) 왼쪽에 선언된 매개변수는 위치 전용이며, 별표(*) 오른쪽에 선언된 매개변수는 키워드 전용으로 전달 방식이 제한됩니다.'
  },
  {
    id: 'adv-q5',
    title: '가변 기본 인자 (def f(L=[]))의 누적 부작용 원인',
    question: 'def f(a, L=[]) 처럼 기본값으로 가변 리스트를 지정하면 함수 호출 간에 데이터가 계속 누적되는 근본적인 원인은?',
    options: [
      '파이썬 가비지 컬렉터가 작동하지 않기 때문',
      '기본 인자 표현식이 함수가 호출될 때가 아니라 함수가 정의되는 시점에 딱 한 번만 평가되기 때문',
      'L 변수가 자동으로 모듈 최상위 전역 변수(global)로 변환되기 때문',
      '파이썬 리스트는 불변 객체이기 때문'
    ],
    correctIndex: 1,
    explanation: '기본 인자(Default Argument)는 함수 정의(Def statement) 시점에 단 한 번 평가되어 함수 객체에 보관되므로, 동일한 가변 리스트 객체가 모든 호출에서 공유됩니다.'
  },
  {
    id: 'adv-q6',
    title: '리스트(List)와 튜플(Tuple)의 핵심 차이',
    question: '요소의 수정 가능 여부(가변성) 및 사용 관례 측면에서 리스트와 튜플의 가장 큰 차이점은 무엇인가요?',
    options: [
      '튜플은 가변(Mutable)이고 리스트는 불변(Immutable)이다.',
      '튜플은 불변(Immutable)으로 주로 고정된 이종 데이터를 다루며, 리스트는 가변(Mutable)으로 동종 데이터 모음에 주로 사용된다.',
      '리스트는 숫자를 저장할 수 없고 튜플만 숫자를 저장할 수 있다.',
      '튜플은 인덱싱(자리 번호 조회)을 지원하지 않는다.'
    ],
    correctIndex: 1,
    explanation: '튜플은 한 번 생성되면 요소를 변경할 수 없는 불변 객체이며 좌표 등 고정 묶음에 쓰이고, 리스트는 append, pop 등으로 자유롭게 제자리 수정이 가능한 가변 객체입니다.'
  },
  {
    id: 'adv-q7',
    title: '가변 객체의 제자리 수정 메서드 반환값 원칙',
    question: 'list.sort() 나 list.append(), list.reverse() 처럼 원본 데이터를 직접 수정하는 메서드들이 공통적으로 반환하는 값은 무엇일까요?',
    options: [
      '수정된 자기 자신 리스트 객체 (Self)',
      '새롭게 복사된 신규 리스트 객체',
      'None',
      'True'
    ],
    correctIndex: 2,
    explanation: '파이썬은 원본이 제자리(in-place)에서 직접 변경되었음을 명확히 하고 새로운 복사본이 반환된 것으로 오해하는 실수를 막기 위해 의도적으로 None을 반환하도록 설계되었습니다.'
  },
  {
    id: 'adv-q8',
    title: '스코프 재바인딩 키워드 (global vs nonlocal)',
    question: '모듈 전역 범위의 변수를 가리킬 때와, 최외곽 전역을 제외한 가장 가까운 바깥 상위 함수의 변수를 가리킬 때 사용하는 키워드는?',
    options: [
      'global (모듈 전역), nonlocal (바깥 상위 함수)',
      'public (모듈 전역), private (바깥 상위 함수)',
      'outer (모듈 전역), inner (바깥 상위 함수)',
      'static (모듈 전역), dynamic (바깥 상위 함수)'
    ],
    correctIndex: 0,
    explanation: 'global은 현재 모듈의 전역 변수를 재바인딩하고, nonlocal은 중첩 함수에서 전역을 제외한 가장 가까운 상위 함수의 변수를 재바인딩합니다.'
  },
  {
    id: 'adv-q9',
    title: '클래스 내부 __variable 식별자의 이름 맹글링',
    question: '클래스 내에서 속성 이름 앞에 __ 기호를 2개 붙여 자식 클래스에서의 오버라이드 충돌을 막기 위해 _ClassName__variable 형태로 텍스트 변환하는 기법의 명칭은?',
    options: [
      '데이터 캡슐화 (Data Encapsulation)',
      '이름 맹글링 (Name Mangling)',
      '타입 캐스팅 (Type Casting)',
      '메서드 오버로딩 (Method Overloading)'
    ],
    correctIndex: 1,
    explanation: '파이썬 파서가 __식별자를 _클래스명__식별자 형태로 치환하여 상속 계층 간의 의도치 않은 이름 충돌을 원천 방지하는 메커니즘을 이름 맹글링(Name Mangling)이라고 합니다.'
  },
  {
    id: 'adv-q10',
    title: '제너레이터의 실행 상태 보존과 종료 예외',
    question: 'yield 문을 사용하는 제너레이터 함수가 호출 간에 보존하는 요소들과, 더 이상 생성할 값이 없을 때 자동으로 발생하는 예외는?',
    options: [
      '하드디스크 캐시 보존 및 KeyError 발생',
      '실행 상태(지역 변수 바인딩, 명령 지시자, 스택) 보존 및 StopIteration 예외 발생',
      '전역 변수 복사본 보존 및 IndexError 발생',
      '함수 소스코드 텍스트 보존 및 EOFError 발생'
    ],
    correctIndex: 1,
    explanation: '제너레이터는 yield 지점의 프레임 실행 상태(지역 변수, 명령어 위치 등)를 동결 보존하며, 순회가 끝나면 StopIteration 예외를 발생시켜 반복을 종료합니다.'
  }
];

const ESSAY_TOPICS = [
  {
    id: 'essay-1',
    title: '가변 인자 패킹 (*args, **kwargs) 내부 메커니즘',
    category: '함수 및 시그니처',
    question: '위치 인자 튜플 패킹(*args)과 키워드 인자 딕셔너리 패킹(**kwargs)의 내부 처리 메커니즘과 순서 제약, 그리고 cheeseshop 예시를 통한 순서 보장 방식을 설명하시오.',
    criteria: [
      '*와 **의 전달 순서 제약 명시 (일반 인자 -> *args -> 키워드 전용 -> **kwargs)',
      '초과 위치 인자는 tuple로, 미정의 키워드 인자는 dict로 생성되는 원리 기술',
      '파이썬 3.7+부터 딕셔너리의 삽입 순서(Insertion Order)가 공식 보장됨을 설명'
    ],
    modelAnswer: `
1. **매개변수 전달 순서 제약**:
   - 파이썬 함수에서 \`*args\`는 일반 위치 매개변수 뒤에 위치해야 하며, \`**kwargs\`는 매개변수 목록의 가장 마지막에 선언되어야 합니다.
   - 순서: \`def func(pos, *args, kw_only, **kwargs):\`

2. **내부 객체 생성 메커니즘**:
   - \`*args\`: 위치 매개변수에 할당되고 남은 임의 개수의 위치 인자들을 런타임에 불변 객체인 \`tuple\`로 패킹하여 바인딩합니다.
   - \`**kwargs\`: 명시되지 않은 모든 \`key=value\` 형태의 키워드 인자들을 \`dict\` 객체로 패킹하여 바인딩합니다.

3. **cheeseshop 예시와 순서 보장**:
\`\`\`python
def cheeseshop(kind, *arguments, **keywords):
    print("-- Do you have any", kind, "?")
    for arg in arguments:
        print(arg)
    for kw in keywords:
        print(kw, ":", keywords[kw])
\`\`\`
   - 호출자가 전달한 위치 인자들은 전달된 순서 그대로 \`arguments\` 튜플에 패킹되어 순회됩니다.
   - 파이썬 3.7부터는 딕셔너리의 삽입 순서(Insertion Order)가 언어 표준 사양으로 공식 보장되므로, 키워드 인자 역시 호출 시 입력한 순서 그대로 \`keywords\` 딕셔너리에 보존되어 순회 출력됩니다.
    `
  },
  {
    id: 'essay-2',
    title: '다중 상속 다이아몬드 문제와 C3 선형화 MRO',
    category: '객체지향 및 클래스',
    question: '다중 상속에서 발생하는 다이아몬드 상속 문제를 파이썬이 super()와 C3 선형화(MRO)를 통해 어떻게 해결하는지 설명하시오.',
    criteria: [
      '모든 클래스가 최상위 object를 상속받아 다이아몬드 구조를 형성하는 원리',
      'C3 선형화의 3대 보장 원리: 단조성(Monotonicity), 선언 순서 보장, 단 1회 호출',
      'super()가 단순 부모가 아닌 MRO 체인 상의 다음 클래스를 동적 탐색함을 명시'
    ],
    modelAnswer: `
1. **다이아몬드 상속 문제**:
   - 파이썬 3의 모든 클래스는 암시적으로 \`object\`를 상속받으므로, 다중 상속 \`class D(B, C)\` 구조는 필연적으로 상위 공통 조상 \`object\`를 갖는 다이아몬드 형태를 이룹니다.
   - 단순 DFS 탐색 시 공통 조상의 메서드가 중복 호출되거나 최신 재정의 메서드가 무시될 위험이 있습니다.

2. **C3 선형화 MRO 알고리즘의 3대 보장**:
   - **단조성(Monotonicity)**: 부모의 MRO 순서 관계가 자식의 MRO에서도 역전되지 않고 유지됩니다.
   - **선언 순서 보장**: \`class D(B, C):\` 에서 좌측 부모 \`B\`가 우측 부모 \`C\`보다 항상 앞서 탐색됩니다.
   - **단 1회 호출**: 공통 조상 클래스는 MRO 순서의 맨 뒤쪽에 정확히 단 1회만 배치됩니다.

3. **super()의 동적 위임 역할**:
   - \`super()\`는 직계 부모 클래스를 직접 가리키는 것이 아니라, **현재 인스턴스의 MRO 튜플(\`__mro__\`) 상에서 다음 순서(Next in MRO)에 위치한 클래스를 동적으로 찾아 위임**합니다.
   - 따라서 각 협력 클래스가 \`super().method()\`를 호출하면 다이아몬드 계층의 모든 클래스가 중복이나 누락 없이 정확히 1회씩 연쇄 호출됩니다.
    `
  },
  {
    id: 'essay-3',
    title: '어휘 분석: 논리적 줄/물리적 줄과 줄 이어붙이기',
    category: '어휘 분석 및 문법',
    question: '논리적 줄과 물리적 줄의 차이 및 역슬래시(\\) 명시적 줄 잇기와 괄호() 암시적 줄 잇기에서의 주석(#) 사용 제약을 비교 분석하시오.',
    criteria: [
      '물리적 줄(개행으로 끝나는 줄)과 논리적 줄(파서의 Statement 단위, NEWLINE 토큰) 구분',
      '명시적 줄 이어붙이기(\\) 뒤에는 주석(#)을 포함한 어떤 문자도 올 수 없음',
      '괄호 내부의 암시적 줄 이어붙이기에서는 인라인 주석(#)이 자유롭게 허용됨'
    ],
    modelAnswer: `
1. **논리적 줄(Logical Line)과 물리적 줄(Physical Line)**:
   - **물리적 줄**: 파일 내에서 실제 개행 문자(\`\\n\`)로 끝나는 텍스트 한 줄입니다.
   - **논리적 줄**: 파이썬 파서가 하나의 완전한 실행 문장(Statement)으로 인식하는 단위입니다. 논리적 줄이 완성되는 지점에서 파서는 \`NEWLINE\` 토큰을 생성합니다.

2. **명시적 줄 이어붙이기 (\`\\ \`)**:
   - 물리적 줄 끝에 역슬래시(\`\\\`)를 붙여 다음 줄과 결합합니다.
   - **제약 사항**: 역슬래시 뒤에는 즉각적인 개행 문자 외에 어떠한 공백이나 주석(\`#\`)도 올 수 없습니다. 따라서 역슬래시 줄 끝에는 주석을 쓸 수 없습니다 (작성 시 \`SyntaxError\` 발생).

3. **암시적 줄 이어붙이기 (\`()\`, \`[]\`, \`{}\`)**:
   - 소괄호, 대괄호, 중괄호 내부에서는 역슬래시 없이도 개행이 자동으로 무시되며 하나의 논리적 줄로 결합됩니다.
   - **주석 허용**: 괄호 내부의 각 물리적 줄 끝에는 자유롭게 \`# 주석\`을 추가할 수 있습니다. 리스트 컴프리헨션이나 긴 매개변수 목록의 가독성을 높이는 핵심 문법 기반입니다.
    `
  },
  {
    id: 'essay-4',
    title: '일급 객체 기반 데코레이터 (@decorator) 아키텍처',
    category: '함수형 프로그래밍',
    question: '함수 일급 객체 특성과 @decorator 축약 문법의 내부 변환, 그리고 클로저의 자유 변수 바인딩 메커니즘을 단계별로 논술하시오.',
    criteria: [
      '함수가 변수 할당, 인자 전달, 반환이 가능한 일급 객체임을 명시',
      '@decorator 구문이 func = decorator(func) 고차 함수 호출로 변환됨을 기술',
      'wrapper 함수가 상위 스코프의 func를 자유 변수로 클로저에 영구 보존하는 원리'
    ],
    modelAnswer: `
1. **함수의 일급 객체(First-Class Object) 특성**:
   - 파이썬에서 함수는 객체이므로 변수에 대입할 수 있고, 다른 함수의 인자로 넘길 수 있으며, 함수의 반환값으로 반환될 수 있습니다.

2. **@decorator 문법의 내부 변환**:
\`\`\`python
@my_decorator
def target():
    pass
# 위 코드는 파서에 의해 정확히 아래 코드로 변환됩니다:
target = my_decorator(target)
\`\`\`

3. **내부 아키텍처 및 클로저(Closure) 바인딩**:
\`\`\`python
def my_decorator(func):
    def wrapper(*args, **kwargs):
        # [관심사 분리]: 로깅, 인증, 시간 측정 등 부가 기능 수행
        print("부가 기능 실행")
        return func(*args, **kwargs)  # 핵심 로직 실행
    return wrapper
\`\`\`
   - \`wrapper\` 함수 내부에서 참조하는 \`func\`는 상위 스코프의 매개변수(자유 변수, Free Variable)입니다.
   - \`my_decorator\`가 실행을 마치고 반환된 후에도, 파이썬 인터프리터는 클로저(\`wrapper.__closure__\`)를 통해 \`func\`에 대한 참조를 영구 보존합니다.
   - 이를 통해 원본 함수의 호출 방식을 전혀 변경하지 않고도 핵심 로직과 부가 기능이 완벽히 분리(Separation of Concerns)됩니다.
    `
  },
  {
    id: 'essay-5',
    title: '리스트 컴프리헨션 vs 제너레이터 표현식 비교',
    category: '성능 최적화 및 평가 방식',
    question: '리스트 컴프리헨션과 제너레이터 표현식의 문법적 차이, 메모리/평가 방식(즉시 평가 vs 지연 평가), 그리고 실무 선택 기준을 비교 논술하시오.',
    criteria: [
      '대괄호 [] 와 소괄호 () 의 문법적 차이 기술',
      '즉시 평가(Eager Evaluation, O(N) 메모리)와 지연 평가(Lazy Evaluation, O(1) 메모리) 대조',
      'StopIteration 및 대용량 데이터 스트리밍 vs 인덱싱/재순회 실무 선택 기준'
    ],
    modelAnswer: `
1. **문법적 표현 차이**:
   - 리스트 컴프리헨션: 대괄호 \`[\`와 \`]\` 사용 \`[x * 2 for x in data]\`
   - 제너레이터 표현식: 소괄호 \`(\`와 \`)\` 사용 \`(x * 2 for x in data)\`

2. **메모리 할당 및 평가 방식**:
   - **리스트 컴프리헨션 (즉시 평가, Eager Evaluation)**:
     - 표현식을 만나는 즉시 전체 루프를 돌아 모든 결과 원소를 담은 리스트를 힙(Heap) 메모리에 할당합니다.
     - 데이터 크기 $N$에 비례하여 메모리가 급증합니다 ($O(N)$ 메모리).
   - **제너레이터 표현식 (지연 평가, Lazy Evaluation)**:
     - 정의 시점에는 제너레이터 객체만 생성하고 실제 계산은 전혀 하지 않습니다.
     - \`next()\`나 \`for\` 루프에 의해 실제 값이 요구될 때마다 단 1개씩 계산하여 공급하므로, 데이터가 10억 개여도 메모리는 항상 일정하게 작습니다 ($O(1)$ 메모리).
     - 모든 원소 공급이 끝나면 \`StopIteration\` 예외를 발생시켜 순회를 종결합니다.

3. **실무 선택 기준**:
   - **제너레이터 표현식 선택**: 데이터가 기가바이트(GB) 단위의 대용량 로그이거나 스트리밍 데이터일 때, 또는 \`sum()\`, \`max()\` 처럼 결과를 한 번만 순회 소비할 때 메모리 절약을 위해 필수적으로 선택합니다.
   - **리스트 컴프리헨션 선택**: 데이터 크기가 충분히 작고, 인덱싱(\`res[0]\`), 길이 확인(\`len()\`), 다중 재순회, 또는 정렬 메서드(\`sort()\`)가 필요할 때 선택합니다.
    `
  }
];


// ---- File: src/components/authModal.js ----
/**
 * User Account & Name Modal
 * Clean input placeholders with NO pre-filled dummy data.
 */



function showAuthModal(onSuccess) {
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


// ---- File: src/components/header.js ----
/**
 * Top Header Navigation
 */



function renderHeader(container, onNavigate) {
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


// ---- File: src/components/bottomNav.js ----
/**
 * Bottom Tab Navigation Bar
 */

function renderBottomNav(container, activeTab, onNavigate) {
  const tabs = [
    { id: 'dashboard', label: '홈' },
    { id: 'learn', label: '기초문법' },
    { id: 'practice', label: '코드연습' },
    { id: 'algorithms', label: '알고리즘' },
    { id: 'guide', label: '심화·사전' },
    { id: 'review', label: '오답노트' },
  ];

  container.innerHTML = `
    <nav class="bottom-nav">
      ${tabs.map(tab => `
        <button class="nav-item ${activeTab === tab.id ? 'active' : ''}" data-tab="${tab.id}">
          <span style="font-size: 0.82rem; font-weight: 700;">${tab.label}</span>
        </button>
      `).join('')}
    </nav>
  `;

  container.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      onNavigate(tabId);
    });
  });
}


// ---- File: src/components/dashboardView.js ----
/**
 * Home Dashboard View
 * Clean progress tracking and direct entry into Python lessons and algorithms.
 */





function renderDashboardView(container, onNavigate) {
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


// ---- File: src/components/learnView.js ----
/**
 * Concept Learning View
 * Sequential lesson unlocks with runnable examples and mandatory check quizzes.
 */





function renderLearnView(container, onNavigate, options = {}) {
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


// ---- File: src/components/practiceView.js ----
/**
 * Code Practice View
 * Mobile quick-key toolbar, in-browser sandbox evaluation, and progressive hints.
 */





function renderPracticeView(container, onNavigate, options = {}) {
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


// ---- File: src/components/algorithmView.js ----
/**
 * Algorithm Visualizer View
 * Pre-test, Step-by-Step Simulation (Array Bars & Hanoi Pegs),
 * Synchronized Python code line highlighting, and Post-test Before/After comparison.
 */




function renderAlgorithmView(container, onNavigate, options = {}) {
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


// ---- File: src/components/guideView.js ----
/**
 * Advanced Python Guide & Glossary View Component
 * Features:
 * 1. 12 Core Python Glossary terms with search and category filtering
 * 2. 10 Technical Quizzes with instant grading and detailed explanations
 * 3. 5 Deep Essay Interview topics with scoring criteria and model answers
 */




function renderGuideView(container, onNavigate) {
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


// ---- File: src/components/reviewView.js ----
/**
 * Review & Quiz View
 * Clean empty state with zero dummy data and retry capabilities.
 */




function renderReviewView(container, onNavigate) {
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


// ---- File: src/components/profileView.js ----
/**
 * Profile & Settings View
 */





function renderProfileView(container, onNavigate) {
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


// ---- File: src/app.js ----
/**
 * Main Application Orchestrator
 */












class App {
  constructor() {
    this.currentView = 'dashboard';
    this.viewOptions = {};
    this.headerContainer = document.getElementById('header-mount');
    this.mainContainer = document.getElementById('main-mount');
    this.bottomNavContainer = document.getElementById('bottom-nav-mount');

    this.init();
  }

  init() {
    document.documentElement.setAttribute('data-theme', appState.getState().settings.theme);

    appState.subscribe(() => {
      this.updateHeader();
    });

    this.navigate('dashboard');
  }

  navigate(viewId, options = {}) {
    this.currentView = viewId;
    this.viewOptions = options;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    this.updateHeader();
    this.renderCurrentView();
    this.updateBottomNav();
  }

  updateHeader() {
    renderHeader(this.headerContainer, (view, opts) => this.navigate(view, opts));
  }

  updateBottomNav() {
    renderBottomNav(this.bottomNavContainer, this.currentView, (view, opts) => this.navigate(view, opts));
  }

  renderCurrentView() {
    this.mainContainer.innerHTML = '';

    switch (this.currentView) {
      case 'dashboard':
        renderDashboardView(this.mainContainer, (view, opts) => this.navigate(view, opts));
        break;
      case 'learn':
        renderLearnView(this.mainContainer, (view, opts) => this.navigate(view, opts), this.viewOptions);
        break;
      case 'practice':
        renderPracticeView(this.mainContainer, (view, opts) => this.navigate(view, opts), this.viewOptions);
        break;
      case 'algorithms':
        renderAlgorithmView(this.mainContainer, (view, opts) => this.navigate(view, opts), this.viewOptions);
        break;
      case 'guide':
        renderGuideView(this.mainContainer, (view, opts) => this.navigate(view, opts));
        break;
      case 'review':
        renderReviewView(this.mainContainer, (view, opts) => this.navigate(view, opts));
        break;
      case 'profile':
        renderProfileView(this.mainContainer, (view, opts) => this.navigate(view, opts));
        break;
      default:
        renderDashboardView(this.mainContainer, (view, opts) => this.navigate(view, opts));
        break;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});


})();
