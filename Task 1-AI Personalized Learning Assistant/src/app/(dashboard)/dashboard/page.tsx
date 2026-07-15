'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import { getUserData } from '@/lib/firebase/firestore';
import { getStreak, buildProgressData, resetAllProgress } from '@/lib/storage';
import { defaultTopics } from '@/lib/lessons/lessons-data';

interface UserData {
  name?: string;
  weakAreas?: string[];
  progress?: Record<string, { completedAt: string; title: string }>;
}

const tips = [
  'Complete daily lessons to build streaks',
  'Use AI Tutor to clarify weak areas',
  'Review progress weekly for best results',
  'Practice with real-world examples',
];

const weakAreaColors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-400'];
const weakAreaWidths = [80, 65, 50];

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<UserData>(buildProgressData);
  const [showReset, setShowReset] = useState(false);

  const syncStorage = useCallback(() => {
    setData(buildProgressData());
  }, []);

  useEffect(() => {
    syncStorage();
    window.addEventListener('lesson-completed', syncStorage);
    return () => window.removeEventListener('lesson-completed', syncStorage);
  }, [syncStorage]);

  useEffect(() => {
    if (!user) return;
    const uid = user.uid;
    getUserData(uid).then((d) => {
      const pd = d as UserData;
      if (pd?.name) {
        setData((prev) => ({ ...prev, name: pd.name }));
      }
    });
  }, [user]);

  const completedEntries = data?.progress ? Object.entries(data.progress) : [];
  const completedCount = completedEntries.length;
  const weakCount = data?.weakAreas?.length || 0;
  const streak = getStreak();
  const totalTopics = defaultTopics.length;
  const completionRate = Math.min(Math.round((completedCount / totalTopics) * 100), 100);

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good Morning', emoji: '🌅' };
    if (hour < 17) return { text: 'Good Afternoon', emoji: '☀️' };
    return { text: 'Good Evening', emoji: '🌙' };
  }

  function getDisplayName() {
    if (data?.name) return data.name;
    const raw = user?.email?.split('@')[0] || 'Intern';
    return raw
      .split(/[._-]/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  const greeting = getGreeting();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
          {greeting.emoji} {greeting.text}, {getDisplayName()}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Here is your learning overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</h3>
            <span className="text-xl">✅</span>
          </div>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{completedCount}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Lessons completed</p>
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
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Streak</h3>
            <span className="text-xl">🔥</span>
          </div>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{streak}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Days in a row</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Completion Rate</h3>
            <span className="text-xl">📈</span>
          </div>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{completedCount > 0 ? `${completionRate}%` : '0%'}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{completedCount} of {totalTopics} topics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Completed Courses</h3>
          {completedEntries.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-500 text-sm">No lessons completed yet.</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {completedEntries.map(([id, lesson]) => (
                <li key={id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {id.includes('js') ? '🟨' : id.includes('git') ? '🟥' : id.includes('html') ? '🟦' : id.includes('react') ? '🩵' : '🟩'}
                    </span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{lesson.title}</span>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(lesson.completedAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Weak Areas Breakdown</h3>
          {data?.weakAreas && data.weakAreas.length > 0 ? (
            <div className="space-y-4">
              {data.weakAreas.map((area, i) => (
                <div key={area}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 dark:text-gray-200 font-medium">{area}</span>
                    <span className="text-gray-400 dark:text-gray-500">{weakAreaWidths[i]}%</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${weakAreaColors[i]} rounded-full transition-all duration-500`}
                      style={{ width: `${weakAreaWidths[i]}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-sm">No weak areas identified.</p>
          )}
          <div className="flex items-center justify-center h-24 mt-4">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 36 36" className="w-full h-full">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#f3e8ff"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#9333ea"
                  strokeWidth="3"
                  strokeDasharray={`${completedCount > 0 ? completionRate : 0}, 100`}
                  strokeLinecap="round"
                />
                <text x="18" y="20.5" textAnchor="middle" fontSize="6" fill="#6b21a8" fontWeight="bold">
                  {completedCount > 0 ? `${completionRate}%` : '0%'}
                </text>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {completedEntries.slice(-3).reverse().map(([id, lesson]) => (
              <div key={id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="w-8 h-8 bg-brand-100 dark:bg-brand-900/50 rounded-lg flex items-center justify-center text-sm">
                  📘
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Completed {lesson.title}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(lesson.completedAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="w-8 h-8 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex items-center justify-center text-sm">
                🎯
              </span>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">New weak area identified: Docker & Containers</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Based on quiz results</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Tips & Updates</h3>
          <ul className="space-y-3">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                <span className="w-1.5 h-1.5 bg-brand-500 rounded-full mt-2 flex-shrink-0" />
                {tip}
              </li>
            ))}
          </ul>

          <hr className="my-4 border-gray-100 dark:border-gray-700" />

          {!showReset ? (
            <button
              onClick={() => setShowReset(true)}
              className="w-full py-2 text-sm text-red-500 border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
            >
              Reset All Progress
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium text-center">Clear all progress and start over?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowReset(false)}
                  className="flex-1 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { resetAllProgress(); setShowReset(false); }}
                  className="flex-1 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                >
                  Confirm Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
