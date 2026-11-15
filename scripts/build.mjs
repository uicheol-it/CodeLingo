import fs from 'fs';
import path from 'path';

const BASE_DIR = path.resolve('C:/Users/User/.gemini/antigravity/scratch/code-learning-app');
const OUT_DIR = path.join(BASE_DIR, 'dist');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const files = [
  'src/core/state.js',
  'src/core/pythonEngine.js',
  'src/data/badges.js',
  'src/data/quizzes.js',
  'src/data/pythonLessons.js',
  'src/data/practiceProblems.js',
  'src/data/algorithms.js',
  'src/data/advancedGuide.js',
  'src/components/authModal.js',
  'src/components/header.js',
  'src/components/bottomNav.js',
  'src/components/dashboardView.js',
  'src/components/learnView.js',
  'src/components/practiceView.js',
  'src/components/algorithmView.js',
  'src/components/guideView.js',
  'src/components/reviewView.js',
  'src/components/profileView.js',
  'src/app.js'
];

let bundleContent = '(() => {\n"use strict";\n';

for (const rel of files) {
  const full = path.join(BASE_DIR, rel);
  let code = fs.readFileSync(full, 'utf-8');

  // Strip imports and exports
  code = code.replace(/import\s+.*?\s+from\s+['"][^'"]+['"];?/g, '');
  code = code.replace(/export\s+const\s+/g, 'const ');
  code = code.replace(/export\s+function\s+/g, 'function ');
  code = code.replace(/export\s+class\s+/g, 'class ');
  code = code.replace(/export\s*\{[^}]*\};?/g, '');
  code = code.replace(/export\s+default\s+/g, '');

  bundleContent += `\n// ---- File: ${rel} ----\n` + code + '\n';
}

bundleContent += '\n})();\n';

fs.writeFileSync(path.join(OUT_DIR, 'app.bundle.js'), bundleContent, 'utf-8');
console.log('Built dist/app.bundle.js successfully!');
