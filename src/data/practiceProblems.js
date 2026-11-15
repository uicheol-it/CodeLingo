/**
 * Beginner-friendly Coding Practice Problems
 * Progressive hints and clear validation patterns.
 */

export const PRACTICE_PROBLEMS = [
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
