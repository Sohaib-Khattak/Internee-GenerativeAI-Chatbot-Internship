'use client';
import { useAuth } from '@/context/AuthContext';
import { getUserData, updateUserProgress } from '@/lib/firebase/firestore';
import { useEffect, useState, useCallback } from 'react';
import { buildProgressData, getQuizResults } from '@/lib/storage';
import { defaultTopics } from '@/lib/lessons/lessons-data';

export default function ProgressPage() {
  const { user } = useAuth();
  const [data, setData] = useState(buildProgressData);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  const syncStorage = useCallback(() => {
    setData(buildProgressData());
  }, []);

  useEffect(() => {
    syncStorage();
    window.addEventListener('lesson-completed', syncStorage);
    return () => window.removeEventListener('lesson-completed', syncStorage);
  }, [syncStorage]);



  async function runAnalysis() {
    if (!user || !data?.progress) return;
    setAnalyzing(true);
    setAnalysisError(null);

    try {
      const res = await fetch('/api/progress/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completedLessons: data.progress,
          quizResults: getQuizResults(),
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Analysis failed');

      if (result.weakAreas) {
        await updateUserProgress(user.uid, { weakAreas: result.weakAreas });
        setData((prev) =>
          prev ? { ...prev, weakAreas: result.weakAreas } : prev
        );
      }
      if (Array.isArray(result.recommendations)) {
        setRecommendations(result.recommendations);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Analysis failed';
      setAnalysisError(msg);
    } finally {
      setAnalyzing(false);
    }
  }

  const completedCount = data?.progress ? Object.keys(data.progress).length : 0;
  const weakCount = data?.weakAreas?.length || 0;
  const totalTopics = defaultTopics.length;
  const completionRate = Math.min(Math.round((completedCount / totalTopics) * 100), 100);

  const completedLessons = data?.progress
    ? Object.entries(data.progress).sort(
        ([, a], [, b]) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      )
    : [];

  const weekLessons = completedLessons;

  // Local-date key (YYYY-MM-DD) that respects the user's timezone, unlike toISOString() (UTC)
  function localDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const weeklyData = (() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const weekDates = days.map((_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return localDateKey(date);
    });

    const counts = weekDates.map((dateStr) =>
      weekLessons.filter(([, l]) => l.completedAt.startsWith(dateStr)).length
    );
    const maxVal = Math.max(1, ...counts);

    return days.map((day, i) => ({
      day,
      count: counts[i],
      maxVal,
      date: weekDates[i],
    }));
  })();

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const thisMonth = new Date().getMonth();
  const monthlyData = monthLabels.slice(0, thisMonth + 1).map((label, i) => {
    const count = weekLessons.filter(([, c]) => {
      const m = new Date(c.completedAt).getMonth();
      return m === i;
    }).length;
    return { label, count };
  });

  

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Your Progress</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Track your learning journey with analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</h3>
            <span className="text-xl">✅</span>
          </div>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{completedCount}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Lessons finished</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Weak Areas</h3>
            <span className="text-xl">🎯</span>
          </div>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{weakCount}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Topics to improve</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Completion Rate</h3>
            <span className="text-xl">📈</span>
          </div>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{completedCount > 0 ? `${completionRate}%` : '0%'}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{completedCount} of {totalTopics} topics</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Analysis</h3>
            <span className="text-xl">📊</span>
          </div>
          <button
            onClick={runAnalysis}
            disabled={analyzing || completedCount === 0}
            className="mt-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 disabled:opacity-50 transition-colors font-medium"
          >
            {analyzing ? 'Analyzing...' : 'Run Analysis'}
          </button>
        </div>
      </div>

      {analysisError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
          <span className="text-base">⚠️</span>
          <div>
            <strong>Analysis failed:</strong> {analysisError}
            <p className="text-xs mt-1">Check that the AI service is available and try again.</p>
          </div>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="bg-gradient-to-br from-brand-50 to-accent-50 dark:from-brand-900/20 dark:to-accent-900/20 p-6 rounded-xl border border-brand-200 dark:border-brand-800 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <span>💡</span> AI Recommendations
          </h3>
          <ul className="space-y-2">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                <span className="w-5 h-5 bg-brand-100 dark:bg-brand-900/50 rounded-full flex items-center justify-center text-[10px] font-bold text-brand-700 dark:text-brand-300 shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Weekly Activity</h3>
          <div className="flex items-end justify-between gap-2 h-40">
            {weeklyData.map(({ day, count, maxVal }) => {
              const height = (count / maxVal) * 100;
              return (
                <div key={day} className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{count}</span>
                  <div className="w-full bg-brand-100 dark:bg-brand-900/30 rounded-t-md relative" style={{ height: '100px' }}>
                    <div
                      className="absolute bottom-0 w-full bg-brand-500 rounded-t-md transition-all duration-500"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{day}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Monthly Trend</h3>
          <svg viewBox="0 0 300 160" className="w-full h-40">
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9333ea" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#9333ea" stopOpacity="0" />
              </linearGradient>
            </defs>
            {monthlyData.length > 1 && (() => {
              const max = Math.max(1, ...monthlyData.map(d => d.count));
              const w = 300, h = 140, pad = 10;
              const xStep = (w - pad * 2) / (monthlyData.length - 1);
              const pts = monthlyData.map((d, i) => ({
                x: pad + i * xStep,
                y: h - pad - ((d.count / max) * (h - pad * 2)),
              }));
              const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
              const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${h - pad} L ${pts[0].x} ${h - pad} Z`;
              return (
                <>
                  <path d={areaPath} fill="url(#lineGrad)" />
                  <path d={linePath} fill="none" stroke="#9333ea" strokeWidth="2" />
                  {pts.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="3" fill="#9333ea" className="hover:r-5 transition-all" />
                  ))}
                </>
              );
            })()}
            {monthlyData.length <= 1 && (
              <text x="150" y="75" textAnchor="middle" fill="#9ca3af" fontSize="13">
                Need more data
              </text>
            )}
          </svg>
          <div className="flex justify-between mt-1">
            {monthlyData.map((d) => (
              <span key={d.label} className="text-[10px] text-gray-400 dark:text-gray-500">{d.label}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Weak Areas Breakdown</h3>
        {data?.weakAreas && data.weakAreas.length > 0 ? (
          <div className="space-y-3">
            {data.weakAreas.map((area, i) => {
              const idx = i % 5;
              const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-400'];
              // Derive the bar from the actual quiz score for this topic when available
              const topicId = defaultTopics.find((t) => t.title === area)?.id;
              const quiz = topicId ? getQuizResults().find((r) => r.topicId === topicId) : undefined;
              const scorePct = quiz ? Math.round((quiz.score / quiz.total) * 100) : undefined;
              // Lower score → weaker → wider bar (95 max so the bar never overflows)
              const width = scorePct !== undefined ? Math.max(15, 95 - scorePct) : [100, 80, 65, 50, 35][idx] || 40;
              return (
                <div key={area} className="flex items-center gap-3">
                  <span className="w-28 text-sm text-gray-600 dark:text-gray-300 font-medium truncate">{area}</span>
                  <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors[idx]} rounded-full transition-all duration-500`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 w-8 text-right shrink-0">
                    {scorePct !== undefined ? `${scorePct}%` : `${width}%`}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400 dark:text-gray-500 text-sm">Run analysis to identify weak areas.</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Completed Lessons</h3>
          {completedLessons.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-500 text-sm">No lessons completed yet.</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {completedLessons.map(([id, lesson]) => (
                <li key={id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{lesson.title}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(lesson.completedAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Completion Donut</h3>
          <div className="flex items-center justify-center h-48">
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 36 36" className="w-full h-full">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#f3e8ff"
                  strokeWidth="3.5"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#9333ea"
                  strokeWidth="3.5"
                  strokeDasharray={`${completedCount > 0 ? completionRate : 0}, 100`}
                  strokeLinecap="round"
                />
                <text x="18" y="20.5" textAnchor="middle" fontSize="6" fill="#6b21a8" fontWeight="bold">
                  {completedCount > 0 ? `${completionRate}%` : '0%'}
                </text>
              </svg>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-brand-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Completed ({completedCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-brand-100" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Remaining</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}