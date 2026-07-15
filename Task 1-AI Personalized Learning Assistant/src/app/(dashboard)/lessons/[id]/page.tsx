'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { defaultTopics, dummyLessonContent } from '@/lib/lessons/lessons-data';
import { useAuth } from '@/context/AuthContext';
import { addCompletedLesson, isLessonCompleted, getQuizScore } from '@/lib/storage';
import ReactMarkdown from 'react-markdown';

export default function LessonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [justCompleted, setJustCompleted] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setCompleted(isLessonCompleted(id));
  }, [id]);

  const topic = defaultTopics.find((t) => t.id === id);
  const content = topic ? (dummyLessonContent[id] || 'Content not available.') : '';
  const topicIndex = topic ? defaultTopics.findIndex((t) => t.id === id) : -1;
  const prevTopic = topicIndex > 0 ? defaultTopics[topicIndex - 1] : null;
  const nextTopic = topicIndex >= 0 && topicIndex < defaultTopics.length - 1 ? defaultTopics[topicIndex + 1] : null;

  if (!topic) {
    return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Lesson not found</div>;
  }

  const handleMarkComplete = () => {
    addCompletedLesson(id, topic.title);
    setCompleted(true);
    setJustCompleted(true);
    setTimeout(() => router.push('/dashboard'), 1200);
  };

  const handleNavigate = (topicId: string) => {
    router.push(`/lessons/${topicId}`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{topic.title}</h2>
            {completed && (
              <span className="px-2.5 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full font-medium flex items-center gap-1">
                &#10003; Completed
              </span>
            )}
          </div>
          <span className={`inline-block mt-1 px-3 py-1 text-xs rounded-full font-medium ${
            topic.level === 'beginner' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
            topic.level === 'intermediate' ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
            'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
          }`}>
            {topic.level}
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>

      {justCompleted ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-6 rounded-xl text-center">
          <p className="text-green-700 dark:text-green-300 font-semibold text-lg">&#10003; Course Completed!</p>
          <p className="text-green-600 dark:text-green-400 text-sm mt-1">Redirecting to dashboard...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {!completed && (
            <button
              onClick={handleMarkComplete}
              className="w-full py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-semibold text-sm flex items-center justify-center gap-2"
            >
              <span>&#10003;</span>
              <span>Mark as Completed</span>
            </button>
          )}
          {completed && (
            <button
              onClick={() => router.push(`/lessons/${id}/quiz`)}
              className="w-full py-3 bg-white dark:bg-gray-800 text-brand-600 dark:text-brand-400 border-2 border-brand-600 dark:border-brand-500 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors font-semibold text-sm flex items-center justify-center gap-2"
            >
              <span>📝</span>
              <span>Take Quiz</span>
            </button>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        {prevTopic ? (
          <button
            onClick={() => handleNavigate(prevTopic.id)}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:border-brand-300 hover:text-brand-700 dark:hover:border-brand-600 dark:hover:text-brand-300 transition-colors"
          >
            <span>&larr;</span>
            <span>{prevTopic.title}</span>
          </button>
        ) : <div />}
        {nextTopic ? (
          <button
            onClick={() => handleNavigate(nextTopic.id)}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:border-brand-300 hover:text-brand-700 dark:hover:border-brand-600 dark:hover:text-brand-300 transition-colors"
          >
            <span>{nextTopic.title}</span>
            <span>&rarr;</span>
          </button>
        ) : <div />}
      </div>
    </div>
  );
}
