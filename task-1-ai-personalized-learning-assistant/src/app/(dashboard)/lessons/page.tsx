'use client';
import { defaultTopics } from '@/lib/lessons/lessons-data';
import Link from 'next/link';

export default function LessonsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Learning Modules</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Choose a topic to start learning</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {defaultTopics.map((topic) => (
          <Link
            key={topic.id}
            href={`/lessons/${topic.id}`}
            className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-brand-200 dark:hover:border-brand-600 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-800 dark:text-white">{topic.title}</h3>
              <span className="text-xl">{topic.level === 'beginner' ? '🌱' : topic.level === 'intermediate' ? '🔥' : '🚀'}</span>
            </div>
            <span className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${
              topic.level === 'beginner' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
              topic.level === 'intermediate' ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
              'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
            }`}>
              {topic.level}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
