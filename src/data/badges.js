/**
 * Learning Achievement Badges
 */

export const BADGES = [
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

export function getBadgeById(id) {
  return BADGES.find(b => b.id === id);
}
