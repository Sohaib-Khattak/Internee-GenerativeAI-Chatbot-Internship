'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  getChatHistory,
  deleteChat,
  CHAT_HISTORY_EVENT,
  ChatConversation,
} from '@/lib/storage';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export default function HistoryPage() {
  const [chats, setChats] = useState<ChatConversation[]>([]);

  useEffect(() => {
    const refresh = () => setChats(getChatHistory());
    refresh();
    window.addEventListener(CHAT_HISTORY_EVENT, refresh);
    return () => window.removeEventListener(CHAT_HISTORY_EVENT, refresh);
  }, []);

  function handleDelete(id: string) {
    deleteChat(id);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Chat History</h2>
        <Link
          href="/tutor"
          className="px-4 py-2 text-sm bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium"
        >
          + New Chat
        </Link>
      </div>

      {chats.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-10 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm text-center">
          <div className="w-14 h-14 bg-brand-100 dark:bg-brand-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">💬</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">No chats yet</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">
            Your AI tutor conversations will appear here.
          </p>
          <Link
            href="/tutor"
            className="inline-block px-5 py-2.5 text-sm bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 rounded-xl hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors font-medium"
          >
            Start a Conversation
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm divide-y divide-gray-100 dark:divide-gray-700">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
            >
              <span className="text-xl shrink-0">💬</span>
              <Link href={`/tutor?chat=${chat.id}`} className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                  {chat.title}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {chat.messages.length} messages · {formatDate(chat.updatedAt)}
                </p>
              </Link>
              <button
                onClick={() => handleDelete(chat.id)}
                className="shrink-0 px-3 py-1.5 text-xs text-red-500 dark:text-red-400 border border-red-200 dark:border-red-900/40 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
                aria-label={`Delete ${chat.title}`}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
