/**
 * Python Curriculum
 * Teaches real Python syntax while explaining concepts intuitively.
 * Example: "인덱스(Index)는 데이터가 위치한 자리 번호입니다."
 */

export const PYTHON_LESSONS = [
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
