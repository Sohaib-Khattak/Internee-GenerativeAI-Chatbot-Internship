'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { defaultTopics } from '@/lib/lessons/lessons-data';
import { useAuth } from '@/context/AuthContext';
import { getUserData, updateUserProgress } from '@/lib/firebase/firestore';
import ReactMarkdown from 'react-markdown';

export default function LessonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [understanding, setUnderstanding] = useState(0);

  const topic = defaultTopics.find((t) => t.id === id);

  useEffect(() => {
    if (!topic || !user) return;
    const uid = user.uid;
    const topicTitle = topic.title;
    const topicLevel = topic.level;

    async function generate() {
      setLoading(true);
      const userData = await getUserData(uid);
      const weakAreas = (userData?.weakAreas as string[]) || [];

      const res = await fetch('/api/lessons/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicTitle,
          skillLevel: topicLevel,
          weakAreas,
        }),
      });

      const data = await res.json();
      setContent(data.content);
      setLoading(false);
    }

    generate();
  }, [id, user, topic]);

  if (!topic) {
    return <div className="p-8 text-center text-gray-500">Lesson not found</div>;
  }

  async function markComplete(level: number) {
    if (!user || !topic) return;
    await updateUserProgress(user.uid, {
      [`progress.${id}`]: {
        completedAt: new Date().toISOString(),
        title: topic.title,
      },
    });

    if (level <= 2) {
      const userData = await getUserData(user.uid);
      const currentWeak = (userData?.weakAreas as string[]) || [];
      if (!currentWeak.includes(topic.title)) {
        await updateUserProgress(user.uid, {
          weakAreas: [...currentWeak, topic.title],
        });
      }
    }

    setUnderstanding(level);
    router.push('/dashboard');
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{topic.title}</h2>
          <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${
            topic.level === 'beginner' ? 'bg-green-100 text-green-700' :
            topic.level === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {topic.level}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-sm border prose prose-sm max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )}

      {!loading && content && (
        <div className="bg-white p-6 rounded-lg shadow-sm border mt-6">
          <h3 className="font-semibold text-lg mb-4">How was this lesson?</h3>
          <div className="flex gap-2">
            {['Needs Review', 'Somewhat Clear', 'Clear', 'Mastered'].map((label, i) => (
              <button
                key={label}
                onClick={() => markComplete(i + 1)}
                className={`px-4 py-2 rounded text-sm border transition-colors hover:bg-gray-100 ${
                  understanding === i + 1 ? 'bg-blue-100 border-blue-500' : ''
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
