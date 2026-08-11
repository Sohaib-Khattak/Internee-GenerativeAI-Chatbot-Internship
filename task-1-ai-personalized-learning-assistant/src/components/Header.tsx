'use client';
import { useAuth } from '@/context/AuthContext';
import { getUserData } from '@/lib/firebase/firestore';
import { logOut } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';

export default function Header() {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    getUserData(user.uid).then((d) => {
      if (d?.name) setName(d.name);
    });
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    setMenuOpen(false);
    await logOut();
    router.push('/login');
  }

  const avatar = (name || user?.email?.split('@')[0] || 'Intern').charAt(0).toUpperCase();

  return (
    <header className="bg-gray-100 dark:bg-gray-800 px-6 py-3 flex items-center justify-end border-b border-gray-200 dark:border-gray-700">
      <div className="relative ml-auto" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white text-sm font-bold hover:bg-brand-700 transition-colors cursor-pointer"
        >
          {avatar}
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg py-1 z-50">
            <Link
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="text-base">👤</span>
              Profile
            </Link>
            <Link
              href="/settings"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="text-base">⚙️</span>
              Settings
            </Link>
            <hr className="my-1 border-gray-100 dark:border-gray-700" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <span className="text-base">🚪</span>
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
