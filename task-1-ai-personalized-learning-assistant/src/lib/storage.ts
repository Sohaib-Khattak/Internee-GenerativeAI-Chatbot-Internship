const LESSONS_KEY = 'internee_completed_lessons';
const QUIZ_KEY = 'internee_quiz_results';
const WEAK_KEY = 'internee_weak_areas';
const STREAK_KEY = 'internee_streak';
const CHATS_KEY = 'internee_chat_history';

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

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
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

export const CHAT_HISTORY_EVENT = 'chat-history-updated';

function generateChatId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function notifyChatHistory() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CHAT_HISTORY_EVENT));
  }
}

/** All saved tutor conversations, most recent first. */
export function getChatHistory(): ChatConversation[] {
  const chats = getItem<ChatConversation[]>(CHATS_KEY, []);
  return chats.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** Derive a short display title from the first user message. */
export function chatTitle(messages: ChatMessage[]): string {
  const first = messages.find((m) => m.role === 'user')?.content;
  if (!first) return 'New chat';
  return first.length > 32 ? first.slice(0, 32).trimEnd() + '…' : first;
}

/** Create a new conversation and persist it. */
export function saveNewChat(messages: ChatMessage[]): string {
  const chats = getItem<ChatConversation[]>(CHATS_KEY, []);
  const now = new Date().toISOString();
  const chat: ChatConversation = {
    id: generateChatId(),
    title: chatTitle(messages),
    messages,
    createdAt: now,
    updatedAt: now,
  };
  chats.push(chat);
  setItem(CHATS_KEY, chats);
  notifyChatHistory();
  return chat.id;
}

/** Persist a conversation by id. */
export function saveChat(id: string, messages: ChatMessage[]): void {
  if (!id) return;
  const chats = getItem<ChatConversation[]>(CHATS_KEY, []);
  const idx = chats.findIndex((c) => c.id === id);
  if (idx === -1) return;
  chats[idx] = {
    ...chats[idx],
    title: chatTitle(messages),
    messages,
    updatedAt: new Date().toISOString(),
  };
  setItem(CHATS_KEY, chats);
  notifyChatHistory();
}

/** Look up a conversation by id. */
export function getChatById(id: string): ChatConversation | null {
  return getItem<ChatConversation[]>(CHATS_KEY, []).find((c) => c.id === id) ?? null;
}

/** Delete a conversation by id. */
export function deleteChat(id: string): void {
  const chats = getItem<ChatConversation[]>(CHATS_KEY, []).filter((c) => c.id !== id);
  setItem(CHATS_KEY, chats);
  notifyChatHistory();
}

/** Last saved conversation's id (recently loaded on the tutor page). */
export function getLastChatId(): string | null {
  const chats = getChatHistory();
  return chats.length ? chats[0].id : null;
}
