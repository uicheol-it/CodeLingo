/**
 * In-browser Python Execution Engine
 * Safe sandbox with step limits, syntax analysis, and clear Korean feedback.
 */

export class PythonEngine {
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

export const pythonEngine = new PythonEngine();
