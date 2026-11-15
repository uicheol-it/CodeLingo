/**
 * Advanced Python Guide Data: 12 Glossary Terms, 10 Quizzes, and 5 Essay Questions
 * Sourced directly from official Python language specifications and reference guidelines.
 */

export const GLOSSARY_TERMS = [
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

export const ADVANCED_QUIZZES = [
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

export const ESSAY_TOPICS = [
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
