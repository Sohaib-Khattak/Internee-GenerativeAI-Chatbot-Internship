export interface Lesson {
  id: string;
  title: string;
  description: string;
  topic: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  content: string;
  exercises: string[];
  quiz: { question: string; options: string[]; correct: number }[];
}

export const defaultTopics = [
  { id: 'js-basics', title: 'JavaScript Basics', level: 'beginner' as const },
  { id: 'react-fundamentals', title: 'React Fundamentals', level: 'intermediate' as const },
  { id: 'node-api', title: 'Node.js API Design', level: 'advanced' as const },
  { id: 'python-data', title: 'Python for Data Science', level: 'intermediate' as const },
  { id: 'git-workflow', title: 'Git & Collaboration', level: 'beginner' as const },
];
