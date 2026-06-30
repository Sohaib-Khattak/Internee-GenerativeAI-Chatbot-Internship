'use client';
import { useAuth } from '@/context/AuthContext';
import { logOut } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logOut();
    router.push('/login');
  }

  return (
    <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
      <h1 className="text-lg font-semibold">Welcome, {user?.email?.split('@')[0] || 'Intern'}</h1>
      <button
        onClick={handleLogout}
        className="text-sm text-gray-600 hover:text-red-600 transition-colors"
      >
        Logout
      </button>
    </header>
  );
}
