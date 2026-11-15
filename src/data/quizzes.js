/**
 * Practical Python Concept Quizzes
 */

export const GENERAL_QUIZZES = [
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
