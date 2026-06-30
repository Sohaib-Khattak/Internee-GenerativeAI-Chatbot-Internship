'use client';
import { defaultTopics } from '@/lib/lessons/lessons-data';
import Link from 'next/link';

export default function LessonsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Learning Modules</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {defaultTopics.map((topic) => (
          <Link
            key={topic.id}
            href={`/lessons/${topic.id}`}
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-lg">{topic.title}</h3>
            <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
              topic.level === 'beginner' ? 'bg-green-100 text-green-700' :
              topic.level === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {topic.level}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
