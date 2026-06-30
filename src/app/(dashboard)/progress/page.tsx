'use client';
import { useAuth } from '@/context/AuthContext';
import { getUserData, updateUserProgress } from '@/lib/firebase/firestore';
import { useEffect, useState } from 'react';

interface ProgressData {
  progress?: Record<string, { completedAt: string; title: string }>;
  weakAreas?: string[];
}

export default function ProgressPage() {
  const { user } = useAuth();
  const [data, setData] = useState<ProgressData | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (user) {
      getUserData(user.uid).then((d) => setData(d as ProgressData));
    }
  }, [user]);

  async function runAnalysis() {
    if (!user || !data?.progress) return;
    setAnalyzing(true);

    try {
      const res = await fetch('/api/progress/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completedLessons: data.progress,
          quizResults: [],
        }),
      });

      const result = await res.json();
      if (result.weakAreas) {
        await updateUserProgress(user.uid, { weakAreas: result.weakAreas });
        setData((prev) =>
          prev ? { ...prev, weakAreas: result.weakAreas } : prev
        );
      }
    } catch (e) {
      console.error('Analysis failed:', e);
    } finally {
      setAnalyzing(false);
    }
  }

  const completedCount = data?.progress ? Object.keys(data.progress).length : 0;

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-2xl font-bold">Your Progress</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-gray-600">Completed</h3>
          <p className="text-3xl font-bold mt-2">{completedCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-gray-600">Weak Areas</h3>
          <p className="text-3xl font-bold mt-2">{data?.weakAreas?.length || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-gray-600">Analysis</h3>
          <button
            onClick={runAnalysis}
            disabled={analyzing}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {analyzing ? 'Analyzing...' : 'Run Analysis'}
          </button>
        </div>
      </div>

      {data?.weakAreas && data.weakAreas.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold mb-3">Areas to Improve</h3>
          <div className="flex flex-wrap gap-2">
            {data.weakAreas.map((area) => (
              <span
                key={area}
                className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      )}

      {data?.progress && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold mb-3">Completed Lessons</h3>
          {Object.entries(data.progress).length === 0 ? (
            <p className="text-gray-500 text-sm">No lessons completed yet.</p>
          ) : (
            <ul className="space-y-2">
              {Object.entries(data.progress).map(([id, lesson]) => (
                <li key={id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span>{lesson.title}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(lesson.completedAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
