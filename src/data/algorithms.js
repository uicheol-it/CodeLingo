/**
 * Algorithm Definitions & Step-by-Step Simulation Generators
 * Clear, intuitive metaphors and synchronized Python code highlighting.
 */

export const ALGORITHMS = [
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

export function getAlgorithmById(id) {
  return ALGORITHMS.find(a => a.id === id) || ALGORITHMS[0];
}
