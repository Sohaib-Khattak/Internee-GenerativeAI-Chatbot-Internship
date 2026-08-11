const LESSONS_KEY = 'internee_completed_lessons';
const QUIZ_KEY = 'internee_quiz_results';
const WEAK_KEY = 'internee_weak_areas';
const STREAK_KEY = 'internee_streak';

export interface CompletedLesson {
  id: string;
  title: string;
  completedAt: string;
}

export interface QuizResult {
  topicId: string;
  score: number;
  total: number;
  date: string;
}

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setItem(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getCompletedLessons(): CompletedLesson[] {
  return getItem<CompletedLesson[]>(LESSONS_KEY, []);
}

export function addCompletedLesson(id: string, title: string): CompletedLesson[] {
  const lessons = getCompletedLessons();
  if (lessons.some((l) => l.id === id)) return lessons;
  const newLesson: CompletedLesson = {
    id,
    title,
    completedAt: new Date().toISOString(),
  };
  const updated = [newLesson, ...lessons];
  setItem(LESSONS_KEY, updated);
  updateStreak();
  window.dispatchEvent(new CustomEvent('lesson-completed', { detail: newLesson }));
  return updated;
}

export function isLessonCompleted(id: string): boolean {
  return getCompletedLessons().some((l) => l.id === id);
}

export function getQuizResults(): QuizResult[] {
  return getItem<QuizResult[]>(QUIZ_KEY, []);
}

export function saveQuizResult(topicId: string, score: number, total: number): void {
  const results = getQuizResults();
  const existing = results.findIndex((r) => r.topicId === topicId);
  const entry: QuizResult = { topicId, score, total, date: new Date().toISOString() };
  if (existing >= 0) {
    results[existing] = entry;
  } else {
    results.push(entry);
  }
  setItem(QUIZ_KEY, results);
  recalcWeakAreas();
  updateStreak();
  window.dispatchEvent(new CustomEvent('lesson-completed'));
}

export function getWeakAreas(): string[] {
  return getItem<string[]>(WEAK_KEY, []);
}

function recalcWeakAreas() {
  const results = getQuizResults();
  const weak = results
    .filter((r) => r.score / r.total < 0.7)
    .map((r) => {
      const names: Record<string, string> = {
        'js-basics': 'JavaScript Basics',
        'react-fundamentals': 'React Fundamentals',
        'node-api': 'Node.js API Design',
        'python-data': 'Python for Data Science',
        'git-workflow': 'Git & Collaboration',
        'html-css': 'HTML & CSS Essentials',
        'typescript': 'TypeScript Deep Dive',
        'nextjs': 'Next.js Full Stack',
        'sql-basics': 'SQL & Databases',
        'docker': 'Docker & Containers',
      };
      return names[r.topicId] || r.topicId;
    });
  setItem(WEAK_KEY, weak);
}

export function getStreak(): number {
  return getItem<number>(STREAK_KEY, 0);
}

function updateStreak() {
  const raw = localStorage.getItem(STREAK_KEY);
  let streak = raw ? JSON.parse(raw) : 0;
  const today = new Date().toISOString().split('T')[0];
  const lastRaw = localStorage.getItem('internee_last_active');
  const lastDate = lastRaw ? JSON.parse(lastRaw) : null;

  if (!lastDate) {
    streak = 1;
  } else if (lastDate === today) {
  } else {
    const diff = Math.round((new Date(today).getTime() - new Date(lastDate).getTime()) / 86400000);
    if (diff === 1) {
      streak += 1;
    } else {
      streak = 1;
    }
  }
  setItem(STREAK_KEY, streak);
  setItem('internee_last_active', today);
}

export function resetAllProgress() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LESSONS_KEY);
  localStorage.removeItem(QUIZ_KEY);
  localStorage.removeItem(WEAK_KEY);
  localStorage.removeItem(STREAK_KEY);
  localStorage.removeItem('internee_last_active');
  window.dispatchEvent(new CustomEvent('lesson-completed'));
}

export function getQuizScore(topicId: string): { score: number; total: number } | null {
  const results = getQuizResults();
  const found = results.find((r) => r.topicId === topicId);
  return found ? { score: found.score, total: found.total } : null;
}

export function buildProgressData() {
  const stored = getCompletedLessons();
  const base: Record<string, { completedAt: string; title: string }> = {};
  for (const lesson of stored) {
    base[lesson.id] = { completedAt: lesson.completedAt, title: lesson.title };
  }
  const storedWeak = getWeakAreas();
  return { progress: base, weakAreas: storedWeak };
}
