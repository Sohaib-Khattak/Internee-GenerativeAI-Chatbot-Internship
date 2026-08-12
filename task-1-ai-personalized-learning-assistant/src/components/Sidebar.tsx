'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getChatHistory, CHAT_HISTORY_EVENT, ChatConversation } from '@/lib/storage';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/lessons', label: 'Lessons', icon: '📚' },
  { href: '/tutor', label: 'AI Chat', icon: '🤖' },
  { href: '/progress', label: 'Progress', icon: '📈' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [recentChats, setRecentChats] = useState<ChatConversation[]>([]);

  // Load recent chats and keep in sync when a conversation changes.
  useEffect(() => {
    const refresh = () => setRecentChats(getChatHistory().slice(0, 5));
    refresh();
    window.addEventListener(CHAT_HISTORY_EVENT, refresh);
    return () => window.removeEventListener(CHAT_HISTORY_EVENT, refresh);
  }, []);

  return (
    <aside className="w-64 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-8 px-2">
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
          AI
        </div>
        <span className="font-semibold text-gray-800 dark:text-white">Internee AI</span>
      </div>

      <nav className="space-y-1 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between px-3 mb-2">
          <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">History</h3>
          {recentChats.length > 0 && (
            <Link
              href="/history"
              className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
            >
              View all
            </Link>
          )}
        </div>

        <div className="space-y-1">
          {recentChats.length > 0 ? (
            <>
              {recentChats.map((chat) => {
                const isActive =
                  pathname === '/tutor' && searchParams.get('chat') === chat.id;
                return (
                  <Link
                    key={chat.id}
                    href={`/tutor?chat=${chat.id}`}
                    className={`block w-full text-left px-3 py-2 text-sm truncate rounded-lg transition-colors ${
                      isActive
                        ? 'bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 font-medium'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    <span className="text-xs mr-1.5">💬</span>
                    {chat.title}
                  </Link>
                );
              })}
            </>
          ) : (
            <p className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">
              No chats yet
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
