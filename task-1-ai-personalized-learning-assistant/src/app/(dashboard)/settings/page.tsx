'use client';
import { useEffect, useState } from 'react';

function getStoredTheme(): string {
  if (typeof window === 'undefined') return 'light';
  return localStorage.getItem('theme') || 'light';
}

function applyTheme(theme: string) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export default function SettingsPage() {
  const [theme, setThemeState] = useState('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setThemeState(getStoredTheme());
    applyTheme(getStoredTheme());
    setMounted(true);
  }, []);

  function setTheme(id: string) {
    setThemeState(id);
    localStorage.setItem('theme', id);
    applyTheme(id);
  }

  if (!mounted) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Settings</h1>
        <p className="text-gray-500 mt-1 dark:text-gray-400">Customize your experience</p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Theme</h3>
          <div className="flex gap-3">
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-lg border transition-colors ${
                theme === 'light'
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              <span>☀️</span>
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-lg border transition-colors ${
                theme === 'dark'
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              <span>🌙</span>
              Dark
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
