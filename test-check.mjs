import { PythonEngine } from './src/core/pythonEngine.js';
import { ALGORITHMS } from './src/data/algorithms.js';
import { PYTHON_LESSONS } from './src/data/pythonLessons.js';
import { PRACTICE_PROBLEMS } from './src/data/practiceProblems.js';
import { GLOSSARY_TERMS, ADVANCED_QUIZZES, ESSAY_TOPICS } from './src/data/advancedGuide.js';
import { appState } from './src/core/state.js';

async function runTests() {
  console.log('--- 1. Clean State Verification ---');
  const state = appState.getState();
  console.log('Completed lessons count:', state.completedLessons.length);
  console.log('Wrong answers count:', state.wrongAnswers.length);
  console.log('User XP:', state.user.xp);
  if (state.completedLessons.length !== 0) throw new Error('State must start with 0 completed lessons');
  if (state.wrongAnswers.length !== 0) throw new Error('Wrong answers notebook must start completely empty');

  console.log('--- 2. Python Engine Verification ---');
  const engine = new PythonEngine();
  const res1 = await engine.run('name = "학생"\nprint(f"안녕하세요, {name}님!")');
  console.log('Output Test:', res1.output);
  if (!res1.output.includes('안녕하세요, 학생님!')) throw new Error('Print test failed');

  const res2 = await engine.run('total = 0\nfor i in range(1, 11):\n    total += i\nprint(total)');
  console.log('Sum Test:', res2.output);
  if (!res2.output.includes('55')) throw new Error('Loop test failed');

  console.log('--- 3. 6 Algorithms Step Verification ---');
  for (const a of ALGORITHMS) {
    const steps = a.type === 'pegs' ? a.generateSteps(3) : a.generateSteps(a.defaultData, a.targetValue);
    console.log(`[${a.name}] Generated ${steps.length} steps.`);
    if (!steps || steps.length === 0) throw new Error(`Algorithm ${a.id} failed to generate steps`);
  }

  console.log('--- 4. Lesson & Practice Verification ---');
  console.log(`Python Lessons count: ${PYTHON_LESSONS.length}`);
  console.log(`Practice Problems count: ${PRACTICE_PROBLEMS.length}`);

  console.log('--- 5. Advanced Guide & Glossary Verification ---');
  console.log(`Glossary Terms: ${GLOSSARY_TERMS.length} terms loaded.`);
  console.log(`Advanced Quizzes: ${ADVANCED_QUIZZES.length} quizzes loaded.`);
  console.log(`Technical Essays: ${ESSAY_TOPICS.length} essay topics loaded.`);
  if (GLOSSARY_TERMS.length !== 12) throw new Error('Must have 12 glossary terms');
  if (ADVANCED_QUIZZES.length !== 10) throw new Error('Must have 10 advanced quizzes');
  if (ESSAY_TOPICS.length !== 5) throw new Error('Must have 5 essay topics');

  console.log('ALL VERIFICATION CHECKS PASSED SUCCESSFULLY! 🎉');
}

runTests().catch(e => {
  console.error('Test error:', e);
  process.exit(1);
});
